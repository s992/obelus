import type { Judgment } from '@obelus/shared/types';
import { Worker } from 'bullmq';
import z from 'zod';

import { db } from '../db/db';
import { client as gqlClient } from '../gql/client';
import { logger } from '../log';
import {
  createGoodreadsImportFailure,
  finishGoodreadsImport,
  getGoodreadsImportIdByJobId,
} from '../sqlc/goodreads_import_sql';
import { createRecord } from '../sqlc/record_sql';
import { connection } from './connection';
import { CsvRowSchema, ProgressSchema, type TCsvRowSchema } from './schema';

type JobArgs = {
  records: TCsvRowSchema[];
  userId: string;
};

const schemaWithHardcoverId = z.object({ hardcoverId: z.number(), goodreads: CsvRowSchema });
const ratingMap: Record<number, Judgment> = {
  1: 'rejected',
  2: 'rejected',
  3: 'mixed',
  4: 'accepted',
  5: 'accepted',
};

export const worker = new Worker<JobArgs>(
  'import',
  async (job) => {
    if (!job.id) {
      throw new Error('job does not have an id');
    }

    const records = job.data.records;
    const total = records.length;
    const found = new Map<number, z.infer<typeof schemaWithHardcoverId>>();
    const failed = new Map<number, z.infer<typeof CsvRowSchema>>();
    const importIdResult = await getGoodreadsImportIdByJobId(db, { jobid: job.id });
    const importId = importIdResult?.id;

    // progress tracking
    let pending = 0;
    let failedLookup = 0;
    let failedInsert = 0;
    let succeeded = 0;

    if (!importId) {
      throw new Error(`no job record available for ${job.id}`);
    }

    const updateProgress = (progress: z.infer<typeof ProgressSchema>) => {
      job.updateProgress(ProgressSchema.parse(progress));
    };

    updateProgress({ total, failedInsert, failedLookup, pending, succeeded });

    const withIsbn10 = records.filter((row) => !!row.isbn10);

    if (withIsbn10.length) {
      const isbn10Results = await gqlClient.FindBookIdsByISBN10({
        isbns: withIsbn10.map((row) => row.isbn10 as string),
      });

      for (const result of isbn10Results.editions) {
        const hardcoverId = result.book.id;
        const goodreads = withIsbn10.find((row) => row.isbn10 === result.isbn_10);

        if (!goodreads) {
          continue;
        }

        pending++;
        found.set(goodreads.id, {
          hardcoverId,
          goodreads,
        });

        updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
      }
    }

    const withIsbn13 = records.filter((row) => !!row.isbn13 && !found.has(row.id));

    if (withIsbn13.length) {
      const isbn13Results = await gqlClient.FindBookIdsByISBN13({
        isbns: withIsbn13.map((row) => row.isbn13 as string),
      });

      for (const result of isbn13Results.editions) {
        const hardcoverId = result.book.id;
        const goodreads = withIsbn13.find((row) => row.isbn13 === result.isbn_13);

        if (!goodreads) {
          continue;
        }

        pending++;
        found.set(goodreads?.id, {
          hardcoverId,
          goodreads,
        });

        updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
      }
    }

    const basicSearchCandidates = records.filter((row) => !found.has(row.id));

    if (basicSearchCandidates.length) {
      for (const candidate of basicSearchCandidates) {
        const searchResult = await gqlClient.SearchBooksForImport({ query: `${candidate.title} ${candidate.author}` });
        const id = searchResult.search?.ids?.[0];
        const cover = (searchResult.search?.results as any)?.hits?.[0]?.document?.image;

        if (!id || !Object.keys(cover).length) {
          failedLookup++;
          failed.set(candidate.id, candidate);
          updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
          continue;
        }

        if (id) {
          pending++;
          found.set(candidate.id, {
            hardcoverId: id,
            goodreads: candidate,
          });

          updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
        }
      }
    }

    // no bulk insert with sqlc..
    for (const book of found.values()) {
      let status = 'finished';

      if (book.goodreads.shelf === 'currently-reading') {
        status = 'reading';
      }

      if (book.goodreads.shelf === 'to-read') {
        status = 'planned';
      }

      let start: Date | null = new Date();

      if (status !== 'planned' && book.goodreads.added) {
        start = new Date(book.goodreads.added);
      }

      let end: Date | null = null;

      if (status === 'finished' && book.goodreads.finished) {
        end = new Date(book.goodreads.finished);
      }

      pending--;

      try {
        await createRecord(db, {
          bookid: book.hardcoverId,
          finishedat: end,
          startedat: start,
          status,
          userid: job.data.userId,
          judgment: ratingMap[book.goodreads.rating ?? 0] ?? null,
        });
        succeeded++;
        updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
      } catch (err) {
        logger.error(err, 'failed to insert record');
        failedInsert++;
        failed.set(book.goodreads.id, book.goodreads);
        updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
      }
    }

    updateProgress({ total, failedInsert, failedLookup, pending, succeeded });

    for (const book of failed.values()) {
      await createGoodreadsImportFailure(db, {
        author: book.author ?? '',
        title: book.title ?? '',
        importid: importId,
      });
    }

    finishGoodreadsImport(db, { jobid: job.id, successcount: succeeded });
  },
  { connection },
);

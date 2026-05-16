import { Worker } from 'bullmq';
import z from 'zod';

import { db } from '../db/db';
import { client as gqlClient } from '../gql/client';
import { logger } from '../log';
import { client } from '../redis';
import { createGoodreadsImportFailure, getGoodreadsImportIdByJobId } from '../sqlc/goodreads_import_sql';
import { createRecord } from '../sqlc/record_sql';
import { csvRowSchema } from './schema';

type JobArgs = {
  records: Record<string, string>[];
  userId: string;
};

const schemaWithHardcoverId = z.object({ hardcoverId: z.number(), goodreads: csvRowSchema });

export const worker = new Worker<JobArgs>(
  'import',
  async (job) => {
    if (!job.id) {
      throw new Error('job does not have an id');
    }

    const formatted = job.data.records.map((record) =>
      csvRowSchema.parse({
        id: record['Book Id'],
        title: record['Title'],
        author: record['Author'],
        isbn10: record['ISBN']?.replaceAll('"', '').replaceAll('=', ''),
        isbn13: record['ISBN13']?.replaceAll('"', '').replaceAll('=', ''),
        rating: record['My Rating'],
        added: record['Date Added'],
        finished: record['Date Read'],
        shelf: record['Exclusive Shelf'],
      }),
    );
    const total = formatted.length;
    const found = new Map<number, z.infer<typeof schemaWithHardcoverId>>();
    const failed = new Map<number, z.infer<typeof csvRowSchema>>();
    const importIdResult = await getGoodreadsImportIdByJobId(db, { jobid: job.id });
    const importId = importIdResult?.id;

    if (!importId) {
      throw new Error(`no job record available for ${job.id}`);
    }

    job.updateProgress({ total, succeeded: 0, failed: 0 });

    const withIsbn10 = formatted.filter((row) => !!row.isbn10);

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

        found.set(goodreads.id, {
          hardcoverId,
          goodreads,
        });
      }
    }

    const withIsbn13 = formatted.filter((row) => !!row.isbn13 && !found.has(row.id));

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

        found.set(goodreads?.id, {
          hardcoverId,
          goodreads,
        });
      }
    }

    const basicSearchCandidates = formatted.filter((row) => !found.has(row.id));

    if (basicSearchCandidates.length) {
      for (const candidate of basicSearchCandidates) {
        const searchResult = await gqlClient.SearchBooksForImport({ query: `${candidate.title} ${candidate.author}` });
        const id = searchResult.search?.ids?.[0];
        const cover = (searchResult.search?.results as any)?.hits?.[0]?.document?.image;

        if (!id || !Object.keys(cover).length) {
          failed.set(candidate.id, candidate);
          job.updateProgress({ total, failed: failed.size, succeeded: 0 });
          continue;
        }

        if (id) {
          found.set(candidate.id, {
            hardcoverId: id,
            goodreads: candidate,
          });
        }
      }
    }

    let succeeded = 0;

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

      try {
        await createRecord(db, {
          bookid: book.hardcoverId,
          finishedat: end,
          startedat: start,
          status,
          userid: job.data.userId,
        });
        succeeded++;
        job.updateProgress({ total, failed: failed.size, succeeded });
      } catch (err) {
        logger.error(err, 'failed to insert record');
        failed.set(book.goodreads.id, book.goodreads);
        job.updateProgress({ total, failed: failed.size, succeeded });
      }
    }

    job.updateProgress({ total, failed: failed.size, succeeded, failedBooks: failed });

    for (const book of failed.values()) {
      createGoodreadsImportFailure(db, {
        author: book.author ?? '',
        title: book.title ?? '',
        importid: importId,
      });
    }
  },
  { connection: client },
);

import { Job, Worker } from 'bullmq';
import z from 'zod';

import { ImportFailureReasonSchema, ImportProgressSchema } from '@obelus/shared/schema';
import type { ImportProgress, Judgment } from '@obelus/shared/types';

import { db } from '../db/db';
import { client as gqlClient } from '../gql/client';
import { logger } from '../log';
import {
  createGoodreadsImport,
  createGoodreadsImportFailure,
  finishGoodreadsImport,
} from '../sqlc/goodreads_import_sql';
import { createRecord } from '../sqlc/record_sql';
import { connection } from './connection';
import { type CsvRow, CsvRowSchema } from './schema';

type JobArgs = {
  records: CsvRow[];
  userId: string;
};

const FoundSchema = z.object({ hardcoverId: z.number(), goodreads: CsvRowSchema });
const FailedSchema = CsvRowSchema.extend({ reason: ImportFailureReasonSchema });
const ratingMap: Record<number, Judgment> = {
  1: 'rejected',
  2: 'rejected',
  3: 'mixed',
  4: 'accepted',
  5: 'accepted',
};

type Found = z.infer<typeof FoundSchema>;
type Failed = z.infer<typeof FailedSchema>;

const jobFn = async (job: Job<JobArgs>) => {
  if (!job.id) {
    throw new Error('job does not have an id');
  }

  const records = job.data.records;
  const total = records.length;
  const found = new Map<number, Found>();
  const failed = new Map<number, Failed>();
  const importInsert = await createGoodreadsImport(db, { jobid: job.id, userid: job.data.userId });
  const importId = importInsert?.id;
  let inserts: Promise<void>[] = [];

  // progress tracking
  let pending = 0;
  let failedLookup = 0;
  let failedInsert = 0;
  let succeeded = 0;

  if (!importId) {
    throw new Error(`no job record available for ${job.id}`);
  }

  const updateProgress = (
    progress: Omit<ImportProgress, 'status'>,
    status: ImportProgress['status'] = 'in-progress',
  ) => {
    return job.updateProgress(ImportProgressSchema.parse({ ...progress, status }));
  };

  // we have rate limiting, but give hardcover a little breathing room to avoid
  // getting stuck in exponential backoff hell too early. we call this after every
  // API request in the worker
  const sleep = () => new Promise((resolve) => setTimeout(resolve, 1000));

  const insertOnSuccess = async () => {
    succeeded++;
    pending--;
    await updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
  };

  const insertOnError = (book: Found) => async (err: Error) => {
    logger.error(err, 'failed to insert record');
    failedInsert++;
    pending--;
    failed.set(book.goodreads.id, { ...book.goodreads, reason: 'already_exists' });
    await updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
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
      const book = { hardcoverId, goodreads };
      found.set(goodreads.id, book);

      updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
      inserts.push(
        importBook(book.hardcoverId, book.goodreads, job.data.userId).then(insertOnSuccess).catch(insertOnError(book)),
      );
    }

    await sleep();
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
      const book = { hardcoverId, goodreads };
      found.set(goodreads.id, book);

      updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
      inserts.push(
        importBook(book.hardcoverId, book.goodreads, job.data.userId).then(insertOnSuccess).catch(insertOnError(book)),
      );
    }

    await sleep();
  }

  const basicSearchCandidates = records.filter((row) => !found.has(row.id));

  if (basicSearchCandidates.length) {
    for (const candidate of basicSearchCandidates) {
      const searchResult = await gqlClient.SearchBooksForImport({ query: `${candidate.title} ${candidate.author}` });
      const id = searchResult.search?.ids?.[0];
      const cover = (searchResult.search?.results as any)?.hits?.[0]?.document?.image;

      if (!id || !Object.keys(cover).length) {
        failedLookup++;
        failed.set(candidate.id, { ...candidate, reason: 'cannot_find' });
        updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
        continue;
      }

      if (id) {
        const book = { hardcoverId: id, goodreads: candidate };
        pending++;
        found.set(candidate.id, book);

        updateProgress({ total, failedInsert, failedLookup, pending, succeeded });
        inserts.push(
          importBook(book.hardcoverId, book.goodreads, job.data.userId)
            .then(insertOnSuccess)
            .catch(insertOnError(book)),
        );
        await sleep();
      }
    }
  }

  await Promise.allSettled(inserts);
  updateProgress({ total, failedInsert, failedLookup, pending, succeeded });

  for (const book of failed.values()) {
    await createGoodreadsImportFailure(db, {
      author: book.author ?? '',
      title: book.title ?? '',
      importid: importId,
      reason: book.reason,
    });
  }

  await finishGoodreadsImport(db, { jobid: job.id, successcount: succeeded });
  updateProgress({ total, failedInsert, failedLookup, pending, succeeded }, 'complete');
};

async function importBook(hardcoverId: number, goodreadsBook: CsvRow, userId: string) {
  let status = 'finished';

  if (goodreadsBook.shelf === 'currently-reading') {
    status = 'reading';
  }

  if (goodreadsBook.shelf === 'to-read') {
    status = 'planned';
  }

  let start: Date | null = new Date();

  if (status !== 'planned' && goodreadsBook.added) {
    start = new Date(goodreadsBook.added);
  }

  let end: Date | null = null;

  if (status === 'finished' && goodreadsBook.finished) {
    end = new Date(goodreadsBook.finished);
  }

  await createRecord(db, {
    bookid: hardcoverId,
    finishedat: end,
    startedat: start,
    status,
    userid: userId,
    judgment: ratingMap[goodreadsBook.rating ?? 0] ?? null,
  });
}

let worker: Worker<JobArgs> | null;

export function getWorker() {
  if (worker) {
    return worker;
  }

  worker = new Worker('import', jobFn, { connection });

  return worker;
}

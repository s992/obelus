import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import { type FastifyTRPCPluginOptions, fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import type { TRPCRequestInfo } from '@trpc/server/http';
import type { Job } from 'bullmq';
import { parse } from 'csv-parse';
import fastify from 'fastify';

import { type AppRouter, appRouter } from './appRouter';
import { config } from './config';
import { db } from './db/db';
import { logger } from './log';
import { importQueue } from './queue/queue';
import { type CsvRow, CsvRowSchema } from './queue/schema';
import { client as redis } from './redis';
import { createContext } from './trpc/context';

export const server = fastify({
  loggerInstance: logger,
});

server.register(fastifyHelmet, { global: true });
server.register(fastifyJwt, { secret: config.OBELUS_AUTH_TOKEN_SECRET });
server.register(fastifyCookie, { secret: config.OBELUS_COOKIE_SECRET });
server.register(fastifyMultipart);
server.register(fastifyTRPCPlugin, {
  prefix: 'trpc',
  trpcOptions: {
    router: appRouter,
    createContext,
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

server.get('/livez', () => ({ ok: true }));

server.get('/readyz', async (_req, res) => {
  try {
    await Promise.all([db.query('SELECT 1'), redis.ping()]);
    return { ok: true };
  } catch {
    return res.code(503).send({ ok: false });
  }
});

server.post('/import', async (req, res) => {
  const ctx = await createContext({ req, res, info: {} as TRPCRequestInfo });
  const userId = ctx.currentUser.id;

  if (!userId) {
    return res.code(401).send();
  }

  const file = await req.file();

  if (!file) {
    return res.code(400).send();
  }

  const records: CsvRow[] = [];
  const parser = file?.file.pipe(parse({ columns: true, skipEmptyLines: true, trim: true }));

  try {
    for await (const record of parser) {
      records.push(
        CsvRowSchema.parse({
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
    }
  } catch (err) {
    logger.error(err, 'failed to parse csv');
    return res.code(400).send();
  }

  let job: Job;

  try {
    job = await importQueue.add('import', {
      records,
      userId,
    });
  } catch (err) {
    logger.error(err, 'failed to create import job');
    return res.code(503).send();
  }

  if (!job.id) {
    return res.code(500).send();
  }

  return res.code(200).send({ total: records.length });
});

(async () => {
  try {
    await server.listen({ port: config.OBELUS_API_PORT });
  } catch (err) {
    console.error(`failed to start: ${err}`);
    process.exit(1);
  }
})();

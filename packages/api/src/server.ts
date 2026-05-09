import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import { FastifyTRPCPluginOptions, fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';

import { AppRouter, appRouter } from './appRouter';
import { config } from './config';
import { logger } from './log';
import { createContext } from './trpc/context';

const server = fastify({
  loggerInstance: logger,
});

server.register(fastifyHelmet, { global: true });
server.register(fastifyJwt, { secret: config.AUTH_TOKEN_SECRET });
server.register(fastifyCookie, { secret: config.COOKIE_SECRET });
server.register(cors, {
  origin: (origin, cb) => {
    if (!origin) {
      cb(new Error('Not allowed'), false);
      return;
    }

    const hostname = new URL(origin).hostname;

    if (hostname === 'localhost') {
      cb(null, true);
      return;
    }

    cb(new Error('Not allowed'), false);
  },
});

server.register(fastifyTRPCPlugin, {
  prefix: 'trpc',
  trpcOptions: {
    router: appRouter,
    createContext,
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

(async () => {
  try {
    await server.listen({ port: config.PORT });
  } catch (err) {
    console.error(`failed to start: ${err}`);
    process.exit(1);
  }
})();

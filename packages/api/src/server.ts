import fastifyCookie from '@fastify/cookie';
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
server.register(fastifyJwt, { secret: config.OBELUS_AUTH_TOKEN_SECRET });
server.register(fastifyCookie, { secret: config.OBELUS_COOKIE_SECRET });
server.register(fastifyTRPCPlugin, {
  prefix: 'trpc',
  trpcOptions: {
    router: appRouter,
    createContext,
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

(async () => {
  try {
    await server.listen({ port: config.OBELUS_API_PORT });
  } catch (err) {
    console.error(`failed to start: ${err}`);
    process.exit(1);
  }
})();

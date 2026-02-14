import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { type FastifyReply, type FastifyRequest, fastify } from "fastify";
import { checkDatabaseReadiness, checkRedisReadiness } from "./db/client.js";
import { createContext } from "./lib/context.js";
import { isAllowedOrigin } from "./lib/cors.js";
import { ensureCsrfToken } from "./lib/csrf.js";
import { env } from "./lib/env.js";
import { enforceCsrfRateLimit } from "./lib/rate-limit.js";
import { appRouter } from "./routers/index.js";
import { registerGoodreadsImportRoutes } from "./routes/goodreads-imports.js";

const app = fastify({ logger: true, trustProxy: env.TRUST_PROXY });

await app.register(cors, {
  origin: (origin, callback) => {
    // Allow non-browser clients and same-host local development origins.
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed"), false);
  },
  credentials: true,
});

await app.register(cookie);
await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

app.get("/csrf", async (request, reply) => {
  enforceCsrfRateLimit(request.ip);
  const token = ensureCsrfToken(request, reply);
  return { token };
});

await app.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext: ({ req, res }: { req: FastifyRequest; res: FastifyReply }) =>
      createContext(req, res),
  },
});

await registerGoodreadsImportRoutes(app);

app.get("/health", async () => ({ ok: true }));
app.get("/livez", async () => ({ ok: true }));
app.get("/readyz", async (_, reply) => {
  const [dbReady, redisReady] = await Promise.all([
    checkDatabaseReadiness(),
    checkRedisReadiness(),
  ]);
  if (!dbReady || !redisReady) {
    reply.code(503);
    return { ok: false, dbReady, redisReady };
  }
  return { ok: true, dbReady, redisReady };
});

const [dbReady, redisReady] = await Promise.all([checkDatabaseReadiness(), checkRedisReadiness()]);
if (!dbReady || !redisReady) {
  app.log.error(
    { dbReady, redisReady },
    "Database or Redis readiness check failed during startup.",
  );
  process.exit(1);
}

app.listen({ port: env.API_PORT, host: "::" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

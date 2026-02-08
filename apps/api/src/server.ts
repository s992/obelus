import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { type FastifyReply, type FastifyRequest, fastify } from "fastify";
import { createContext } from "./lib/context.js";
import { ensureCsrfToken } from "./lib/csrf.js";
import { env } from "./lib/env.js";
import { appRouter } from "./routers/index.js";

const app = fastify({ logger: true });

const configuredOrigins = (env.APP_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const allowedOrigins = new Set([
  env.APP_ORIGIN,
  ...configuredOrigins,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://[::1]:5173",
]);

const isPrivateNetworkHostname = (hostname: string): boolean => {
  const segments = hostname.split(".").map((part) => Number(part));
  if (
    segments.length !== 4 ||
    segments.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  const a = segments[0];
  const b = segments[1];
  if (a === undefined || b === undefined) {
    return false;
  }

  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
};

const isAllowedOrigin = (origin: string): boolean => {
  if (allowedOrigins.has(origin)) {
    return true;
  }

  if (env.NODE_ENV !== "development") {
    return false;
  }

  try {
    const parsed = new URL(origin);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]" ||
      isPrivateNetworkHostname(parsed.hostname)
    );
  } catch {
    return false;
  }
};

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

app.get("/csrf", async (request, reply) => {
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

app.get("/health", async () => ({ ok: true }));

app.listen({ port: env.API_PORT, host: "::" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

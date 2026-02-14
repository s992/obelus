import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { resolveCurrentUser } from "../lib/auth.js";
import { normalizeOriginHeader, resolveAllowedOriginForHeader } from "../lib/cors.js";
import { ensureCsrfToken } from "../lib/csrf.js";
import { env } from "../lib/env.js";
import { goodreadsImportQueue } from "../lib/goodreads-import-queue.js";
import {
  createQueuedGoodreadsImport,
  getGoodreadsImport,
  listGoodreadsImports,
  parseGoodreadsImportOptions,
} from "../lib/goodreads-import.js";

const MAX_IMPORT_CSV_BYTES = 10 * 1024 * 1024;

type ResolvedAuth = {
  userId: string;
};

const resolveAuth = async (
  request: FastifyRequest,
  reply: FastifyReply,
  options: { requireCsrf: boolean },
): Promise<ResolvedAuth | null> => {
  const sessionToken = request.cookies[env.SESSION_COOKIE_NAME];
  const { user } = await resolveCurrentUser(sessionToken);
  if (!user) {
    reply.code(401).send({ message: "Unauthorized" });
    return null;
  }

  if (options.requireCsrf) {
    const csrfToken = ensureCsrfToken(request, reply);
    const requestToken =
      typeof request.headers["x-csrf-token"] === "string" ? request.headers["x-csrf-token"] : null;

    if (requestToken !== csrfToken) {
      reply.code(403).send({ message: "Invalid CSRF token." });
      return null;
    }
  }

  return { userId: user.id };
};

const readUtf8Stream = async (stream: NodeJS.ReadableStream, maxBytes: number): Promise<string> => {
  const chunks: Buffer[] = [];
  let bytes = 0;

  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.byteLength;
    if (bytes > maxBytes) {
      throw new Error("Uploaded file exceeds size limit.");
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
};

const writeSseEvent = (reply: FastifyReply, event: string, data: unknown) => {
  reply.raw.write(`event: ${event}\n`);
  reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
};

export const registerGoodreadsImportRoutes = async (app: FastifyInstance) => {
  app.post("/imports/goodreads", async (request, reply) => {
    const auth = await resolveAuth(request, reply, { requireCsrf: true });
    if (!auth) {
      return;
    }

    if (!request.isMultipart()) {
      reply.code(400).send({ message: "Expected multipart/form-data payload." });
      return;
    }

    let filename = "goodreads_library_export.csv";
    let csvPayload: string | null = null;
    let optionsRaw = "{}";

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === "file") {
        filename = part.filename || filename;
        csvPayload = await readUtf8Stream(part.file, MAX_IMPORT_CSV_BYTES);
      } else if (part.fieldname === "options") {
        optionsRaw = String(part.value ?? "{}");
      }
    }

    if (!csvPayload || csvPayload.trim().length === 0) {
      reply.code(400).send({ message: "CSV file is required." });
      return;
    }

    const optionsJson = (() => {
      try {
        return JSON.parse(optionsRaw) as unknown;
      } catch {
        throw new Error("Invalid JSON in options field.");
      }
    })();

    const options = parseGoodreadsImportOptions(optionsJson);
    const created = await createQueuedGoodreadsImport({
      userId: auth.userId,
      filename,
      csvPayload,
      options,
    });

    await goodreadsImportQueue.add(created.id, {
      importId: created.id,
      userId: auth.userId,
    });

    reply.code(201).send({ importId: created.id });
  });

  app.get("/imports/goodreads", async (request, reply) => {
    const auth = await resolveAuth(request, reply, { requireCsrf: false });
    if (!auth) {
      return;
    }

    const imports = await listGoodreadsImports(auth.userId);
    reply.send({ imports });
  });

  app.get<{ Params: { importId: string } }>(
    "/imports/goodreads/:importId",
    async (request, reply) => {
      const auth = await resolveAuth(request, reply, { requireCsrf: false });
      if (!auth) {
        return;
      }

      const record = await getGoodreadsImport(request.params.importId, auth.userId);
      if (!record) {
        reply.code(404).send({ message: "Import not found." });
        return;
      }

      reply.send(record);
    },
  );

  app.get<{ Params: { importId: string } }>(
    "/imports/goodreads/:importId/events",
    async (request, reply) => {
      const requestOrigin = normalizeOriginHeader(request.headers.origin);
      const allowedOrigin = resolveAllowedOriginForHeader(request.headers.origin);
      if (requestOrigin && !allowedOrigin) {
        reply.code(403).send({ message: "Origin not allowed." });
        return;
      }

      const auth = await resolveAuth(request, reply, { requireCsrf: false });
      if (!auth) {
        return;
      }

      const importId = request.params.importId;

      if (allowedOrigin) {
        reply.raw.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
        reply.raw.setHeader("Vary", "Origin");
      }
      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");
      reply.raw.flushHeaders();

      let closed = false;
      let lastProcessed = -1;

      const sendSnapshot = async () => {
        const snapshot = await getGoodreadsImport(importId, auth.userId);
        if (!snapshot) {
          writeSseEvent(reply, "import.failed", { message: "Import not found." });
          reply.raw.end();
          closed = true;
          return;
        }

        const status = snapshot.status;
        if (status === "queued" && lastProcessed < 0) {
          writeSseEvent(reply, "import.started", snapshot);
        }

        if (snapshot.summary.processedRows !== lastProcessed) {
          writeSseEvent(reply, "import.progress", snapshot);
          lastProcessed = snapshot.summary.processedRows;
        }

        if (status === "completed" || status === "completed_with_errors") {
          writeSseEvent(reply, "import.completed", snapshot);
          reply.raw.end();
          closed = true;
          return;
        }

        if (status === "failed") {
          writeSseEvent(reply, "import.failed", snapshot);
          reply.raw.end();
          closed = true;
        }
      };

      await sendSnapshot();
      if (closed) {
        return;
      }

      const interval = setInterval(() => {
        void sendSnapshot();
      }, 2000);

      const heartbeat = setInterval(() => {
        reply.raw.write(": ping\n\n");
      }, 10000);

      request.raw.on("close", () => {
        clearInterval(interval);
        clearInterval(heartbeat);
      });
    },
  );
};

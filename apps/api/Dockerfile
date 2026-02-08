# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /workspace

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY apps/api/package.json apps/api/tsconfig.json apps/api/drizzle.config.ts ./apps/api/
COPY apps/api/src ./apps/api/src
COPY apps/api/drizzle ./apps/api/drizzle

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @obelus/shared build
RUN pnpm --filter @obelus/api build
RUN pnpm --filter @obelus/api --prod deploy --legacy /workspace/deploy/api

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S obelus && adduser -S -G obelus obelus

COPY --from=builder --chown=obelus:obelus /workspace/deploy/api ./
COPY --from=builder --chown=obelus:obelus /workspace/apps/api/drizzle ./apps/api/drizzle

USER obelus

EXPOSE 4000

CMD ["node", "dist/apps/api/src/server.js"]

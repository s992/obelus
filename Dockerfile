ARG NODE_VERSION=24
ARG PNPM_VERSION=10.33.2

FROM node:${NODE_VERSION}-alpine AS build
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/
COPY packages/client/package.json packages/client/

RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY packages/api packages/api
COPY packages/client packages/client

RUN pnpm --filter @obelus/api build

ARG OBELUS_BASE_URL
ENV OBELUS_BASE_URL=$OBELUS_BASE_URL
RUN pnpm --filter @obelus/client build

RUN pnpm deploy --filter @obelus/api --prod --legacy /deploy/api

FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache nginx gettext tini

WORKDIR /app

COPY --from=build /deploy/api ./api
COPY --from=build /repo/packages/api/dist ./api/dist
COPY --from=build /repo/packages/client/dist ./client

COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 3000

ENTRYPOINT ["tini", "--", "/entrypoint.sh"]

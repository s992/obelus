# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /workspace

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src
COPY apps/web/package.json apps/web/tsconfig.json apps/web/vite.config.ts ./apps/web/
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
COPY apps/web/index.html ./apps/web/index.html
COPY apps/web/postcss.config.mjs ./apps/web/postcss.config.mjs

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @obelus/shared build
RUN pnpm --filter @obelus/web build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY apps/web/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/web/nginx/entrypoint.sh /usr/local/bin/obelus-web-entrypoint.sh
COPY --from=builder /workspace/apps/web/dist /usr/share/nginx/html

USER root
RUN chmod +x /usr/local/bin/obelus-web-entrypoint.sh
USER 101

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/obelus-web-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

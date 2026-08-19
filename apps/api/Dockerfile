# syntax=docker/dockerfile:1

# The workspace root is the build context: the API depends on @menu/shared,
# which has to be built from source in the same image.
FROM node:22-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
# The web workspace is declared in the root package.json, so npm wants its
# manifest even though nothing here builds it.
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @menu/api --workspace @menu/shared --include-workspace-root

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @menu/shared && npm run build -w @menu/api

# Drop dev dependencies from the tree that ships.
RUN npm prune --omit=dev --workspace @menu/api --workspace @menu/shared --include-workspace-root

FROM node:22-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

# tini reaps zombies and forwards signals, so `docker compose stop` actually
# reaches Node instead of waiting out the timeout.
RUN apk add --no-cache tini

COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/package.json package.json
COPY --from=build /repo/packages/shared/package.json packages/shared/package.json
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/apps/api/package.json apps/api/package.json
COPY --from=build /repo/apps/api/node_modules apps/api/node_modules
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY --from=build /repo/apps/api/drizzle apps/api/drizzle
COPY apps/api/docker-entrypoint.sh apps/api/docker-entrypoint.sh

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/repo/apps/api/docker-entrypoint.sh"]

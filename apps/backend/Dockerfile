FROM oven/bun:1-alpine AS pruner
WORKDIR /repo

COPY . .
RUN bunx turbo prune apps/backend --docker


FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=pruner /repo/out/package.json ./
COPY --from=pruner /repo/out/bun.lock ./
COPY --from=pruner /repo/out/apps ./apps
COPY --from=pruner /repo/out/packages ./packages

RUN bun install --frozen-lockfile


FROM dhi.io/bun:1-alpine3.22 AS runner
WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3001
CMD ["bun", "run", "--cwd", "apps/backend", "start"]

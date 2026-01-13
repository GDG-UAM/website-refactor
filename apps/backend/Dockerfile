FROM dhi.io/bun:1-alpine3.22 AS pruner
WORKDIR /repo

COPY . .

# Generate a backend-only workspace + lockfile
RUN bunx turbo prune apps/backend --docker


FROM dhi.io/bun:1-alpine3.22 AS runner
WORKDIR /app

COPY --from=pruner /repo/out/package.json ./
COPY --from=pruner /repo/out/bun.lock ./

COPY --from=pruner /repo/out/apps ./apps
COPY --from=pruner /repo/out/packages ./packages

RUN bun install --frozen-lockfile

EXPOSE 3001
CMD ["bun", "run", "--cwd", "apps/backend", "start"]

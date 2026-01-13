FROM oven/bun:1-alpine AS pruner
WORKDIR /repo

COPY . .

RUN bunx turbo prune apps/frontend --docker


FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=pruner /repo/out/package.json ./
COPY --from=pruner /repo/out/bun.lock ./
COPY --from=pruner /repo/out/apps ./apps
COPY --from=pruner /repo/out/packages ./packages

RUN bun install --frozen-lockfile

ARG NEXT_PUBLIC_BACKEND_URL
ARG INTERNAL_BACKEND_URL
ARG INTERNAL_API_SECRET

ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV INTERNAL_BACKEND_URL=${INTERNAL_BACKEND_URL}
ENV INTERNAL_API_SECRET=${INTERNAL_API_SECRET}
ENV NODE_ENV=production

RUN bun x turbo run build --filter=frontend


FROM dhi.io/node:25 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy only runtime outputs
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static

EXPOSE 3001
CMD ["node", "server.js"]

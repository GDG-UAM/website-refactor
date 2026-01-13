# ---------- Stage 1: Base ----------
FROM oven/bun:1-alpine AS base
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/permissions/package.json ./packages/permissions/

RUN bun install --frozen-lockfile

COPY . .

# ---------- Stage 2: Build ----------
ARG NEXT_PUBLIC_BACKEND_URL
ARG INTERNAL_BACKEND_URL
ARG INTERNAL_API_SECRET

ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV INTERNAL_BACKEND_URL=${INTERNAL_BACKEND_URL}
ENV INTERNAL_API_SECRET=${INTERNAL_API_SECRET}
ENV NODE_ENV=production

RUN bun x turbo run build --filter=frontend

# ---------- Stage 3: Runtime (hardened) ----------
FROM dhi.io/node:25 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=base /app/apps/frontend/public ./apps/frontend/public
COPY --from=base /app/apps/frontend/.next/standalone ./
COPY --from=base /app/apps/frontend/.next/static ./apps/frontend/.next/static

EXPOSE 3001
CMD ["node", "server.js"]

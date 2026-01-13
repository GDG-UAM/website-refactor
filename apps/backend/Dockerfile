# ---------- Stage 1: Base (builder) ----------
FROM oven/bun:1-alpine AS base
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/permissions/package.json ./packages/permissions/

RUN bun install --frozen-lockfile

COPY . .

# ---------- Stage 2: Build ----------
ENV NODE_ENV=production

RUN bun x turbo run build --filter=backend

# ---------- Stage 3: Runtime (hardened Bun) ----------
FROM dhi.io/bun:1-alpine3.22 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=base /app/apps/backend/dist ./apps/backend/dist
COPY --from=base /app/packages ./packages
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

EXPOSE 3001
CMD ["bun", "run", "--cwd", "apps/backend", "start"]

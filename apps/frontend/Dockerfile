# Stage 1: Base
FROM oven/bun:slim AS base
WORKDIR /app

# Stage 2: Installer
FROM base AS installer
# Copy root config files
COPY package.json bun.lockb turbo.json ./
# Copy app-specific package files to resolve workspaces
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

RUN bun install --frozen-lockfile

# Copy source code
COPY . .

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NODE_ENV=production

RUN bun x turbo run build --filter=frontend

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Standalone output copies
COPY --from=installer /app/apps/frontend/public ./apps/frontend/public
COPY --from=installer /app/apps/frontend/.next/standalone ./
COPY --from=installer /app/apps/frontend/.next/static ./apps/frontend/.next/static

EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
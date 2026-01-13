# Stage 1: Base
FROM dhi.io/bun:1-alpine3.22 AS base
WORKDIR /app

# Stage 2: Installer
FROM base AS installer
# Copy root config files
COPY package.json bun.lock turbo.json ./
# Copy app-specific package files to resolve workspaces
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/permissions/package.json ./packages/permissions/

RUN bun install --frozen-lockfile

# Copy source code
COPY . .

ARG NEXT_PUBLIC_BACKEND_URL
ARG INTERNAL_BACKEND_URL
ARG INTERNAL_API_SECRET

ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV INTERNAL_BACKEND_URL=${INTERNAL_BACKEND_URL}
ENV INTERNAL_API_SECRET=${INTERNAL_API_SECRET}
ENV NODE_ENV=production

RUN bun x turbo run build --filter=frontend

# Stage 3: Runner
FROM dhi.io/node:25 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Standalone output copies
COPY --from=installer /app/apps/frontend/public ./apps/frontend/public
COPY --from=installer /app/apps/frontend/.next/standalone ./
COPY --from=installer /app/apps/frontend/.next/static ./apps/frontend/.next/static

EXPOSE 3001
CMD ["node", "apps/frontend/server.js"]
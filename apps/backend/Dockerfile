# Stage 1: Pruning/Setup
FROM oven/bun:slim AS base
WORKDIR /app

# Stage 2: Dependencies (Only what's needed for the backend)
FROM base AS installer
COPY package.json bun.lock turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/permissions/package.json ./packages/permissions/

# This installs only the backend and its workspace dependencies (permissions)
# We use --production to skip devDependencies (like eslint, tsc)
RUN bun install --frozen-lockfile --production --filter=backend --filter=@gdg-uam/permissions

# Stage 3: Runner
FROM base AS runner
# Copy only the node_modules from the installer stage
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=installer /app/packages/permissions ./packages/permissions

# Copy the actual backend source code
COPY apps/backend ./apps/backend

# Expose backend port
EXPOSE 3001

WORKDIR /app/apps/backend
CMD ["bun", "run", "start"]
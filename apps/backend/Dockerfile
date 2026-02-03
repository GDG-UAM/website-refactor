# Stage 1: Pruning/Setup
FROM oven/bun:slim AS base
WORKDIR /app

# Stage 2: Dependencies (Only what's needed for the backend)
FROM base AS installer
COPY package.json bun.lock turbo.json ./

COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/permissions/package.json ./packages/permissions/

# This installs only the backend and its workspace dependencies (permissions)
# We use --production to skip devDependencies (like eslint, tsc)
RUN bun install --frozen-lockfile --production --filter=backend --filter=@gdg-uam/permissions

# Stage 3: Runner
FROM base AS runner
WORKDIR /app

# 1. Copy the HOISTED node_modules from the root
COPY --from=installer /app/node_modules ./node_modules

# 2. Copy the workspace packages (the local code)
COPY --from=installer /app/packages/permissions ./packages/permissions
COPY apps/backend ./apps/backend

# Expose backend port
EXPOSE 3001

# Set the working directory to the backend app
WORKDIR /app/apps/backend
CMD ["bun", "run", "start"]
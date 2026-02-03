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

# 1. Copy the hoisted node_modules (contains the symlinks)
COPY --from=installer /app/node_modules ./node_modules

# 2. Copy the package.json files (sometimes needed for resolution)
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/permissions/package.json ./packages/permissions/

# 3. Copy the ACTUAL SOURCE of the shared package
# This is what the symlink inside node_modules is looking for
COPY packages/permissions ./packages/permissions

# 4. Copy the backend source
COPY apps/backend ./apps/backend

# Set the working directory to the backend app
WORKDIR /app/apps/backend

EXPOSE 3001
CMD ["bun", "run", "start"]
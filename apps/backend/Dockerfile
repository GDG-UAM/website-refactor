FROM oven/bun:slim AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build (if you have a build step, otherwise skip)
RUN bun x turbo run build --filter=backend

EXPOSE 3000
# Run directly with Bun
CMD ["bun", "run", "apps/backend/src/index.ts"]
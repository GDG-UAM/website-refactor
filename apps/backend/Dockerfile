FROM oven/bun:slim AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/permissions/package.json ./packages/permissions/
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3001

# Start backend directly
CMD ["bun", "run", "--cwd", "apps/backend", "start"]

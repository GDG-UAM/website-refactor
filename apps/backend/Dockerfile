FROM oven/bun:slim AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/permissions/package.json ./packages/permissions/
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3000

# Start backend directly
CMD ["bun", "run", "start"]

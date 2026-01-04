FROM oven/bun:latest AS base
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
# Base stage
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build arguments
ARG NEXT_PUBLIC_PEER_SERVER_HOST
ARG NEXT_PUBLIC_PEER_SERVER_PORT
ARG NEXT_PUBLIC_PEER_SERVER_PATH
ARG NEXT_PUBLIC_PEER_SERVER_SECURE

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Copy necessary files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Copy standalone build FIRST (includes minimal node_modules and server.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Install production dependencies (ensures http-proxy and others are present)
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated ./lib/generated

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application (server.js is compiled from server.ts)
CMD ["node", "server.js"]

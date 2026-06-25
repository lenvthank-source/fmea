# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Install openssl for Prisma build compatibility
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package configuration files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy Prisma schema first
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the backend code
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build the NestJS application
RUN npm run build

# Prune dev dependencies to keep production image light
RUN npm prune --production

# Stage 2: Production Run
FROM node:20-slim AS runner

WORKDIR /usr/src/app

# Install runtime openssl dependency
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and runtime dependencies
COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

# Expose backend port
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Command to run the application
CMD ["node", "dist/main.js"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Dummy DATABASE_URL placeholder to satisfy Prisma schema validation during docker build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npm run prisma:generate
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

CMD sh -c "npx prisma db push --accept-data-loss && npm run start:prod"

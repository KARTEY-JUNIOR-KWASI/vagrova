FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/ui/package.json ./packages/ui/package.json

RUN pnpm install --frozen-lockfile --filter @vagrova/api...

COPY apps/api ./apps/api

RUN pnpm --filter @vagrova/api exec prisma generate
RUN pnpm --filter @vagrova/api build

WORKDIR /app/apps/api
EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss=false && node dist/main"]

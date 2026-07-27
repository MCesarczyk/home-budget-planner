FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0 \
    PORT=5173

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json

EXPOSE 5173

USER node

CMD ["node", "build"]

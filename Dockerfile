FROM node:lts-slim as builder

WORKDIR /build

# Enable Corepack to use pnpm
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:lts-slim as server

# Enable Corepack to use pnpm
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

COPY --from=builder /build/package.json /build/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /build/dist ./dist

EXPOSE 80

CMD ["pnpm", "start"]
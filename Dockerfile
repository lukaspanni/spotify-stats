FROM node:16 as builder

WORKDIR /build

COPY . .
RUN npm ci
RUN npm run build

FROM node:16 as server

COPY --from=builder /build/package*.json .
RUN npm ci --only=production

COPY --from=builder /build/dist ./dist

EXPOSE 80

CMD ["npm", "start"]
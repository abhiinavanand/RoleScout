FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY server/package*.json server/
RUN npm ci
COPY . .
RUN npm run prisma:generate --workspace server && npm run build --workspace server

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/server/package*.json server/
RUN npm ci --omit=dev --workspace server
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/prisma server/prisma
USER node
EXPOSE 4000
CMD ["node", "server/dist/server.js"]

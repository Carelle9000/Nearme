FROM node:20-alpine AS build
WORKDIR /app

# Dépendances
COPY package*.json ./
RUN npm ci

# Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Code source + compilation TypeScript
COPY . .
RUN npm run build

# ── Image de production ────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

RUN mkdir -p /app/uploads
EXPOSE 8080

# Appliquer les migrations Prisma puis démarrer
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

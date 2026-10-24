FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.js ./
RUN npx prisma generate

COPY src ./src
ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
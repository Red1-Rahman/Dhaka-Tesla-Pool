FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl


FROM base AS deps

COPY package.json package-lock.json* ./

RUN npm ci


FROM deps AS build

COPY . .

RUN npx prisma generate

RUN npm run build

RUN npx tsc -p tsconfig.seed.json


FROM base AS runtime

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/seed/seed.js && node dist/src/main.js"]

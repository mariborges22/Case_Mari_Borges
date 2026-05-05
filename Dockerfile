# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências de build se necessário
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 2: Production (Hardened)
FROM node:20-alpine

# Segurança: Define ambiente como produção
ENV NODE_ENV=production

# Instala curl para o smoke test (Alpine não tem por padrão)
RUN apk add --no-cache curl

WORKDIR /app

# Segurança: Garante que as permissões pertençam ao usuário 'node'
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/scripts/smoke-test.sh ./scripts/smoke-test.sh

RUN chmod +x ./scripts/smoke-test.sh

# Segurança: TROCA PARA USUÁRIO NÃO-ROOT
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ./scripts/smoke-test.sh || exit 1

# Usa node diretamente para melhor gestão de sinais (SIGTERM/SIGINT)
CMD ["node", "dist/infrastructure/http/server.js"]

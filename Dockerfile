FROM node:22-alpine AS builder

WORKDIR /app

# Dependências primeiro (aproveita cache do Docker)
COPY package.json package-lock.json ./
RUN npm ci

# Código fonte
COPY . .
RUN npm run build

# ─── Stage 2: Servir ─────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# user não-root
RUN addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 app

# Só o necessário pra servir
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

USER app

EXPOSE 4321

# Astro preview pra servir os arquivos estáticos
CMD ["npx", "astro", "preview", "--host", "0.0.0.0", "--port", "4321"]

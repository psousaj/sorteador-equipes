FROM node:20-alpine AS builder

WORKDIR /app

# Dependências primeiro (aproveita cache do Docker)
COPY package.json package-lock.json ./
RUN npm ci

# Código fonte
COPY . .
RUN npm run build

# ─── Stage 2: Servir ─────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# user não-root
RUN addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 app

# Só o necessário pra servir
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

USER app

EXPOSE 5173

# Usando vite preview pra servir os arquivos estáticos
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]

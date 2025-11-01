# Dockerfile para Backend Vision (server.js e server-vision-streaming.js)
# Suporta TensorFlow.js com COCO-SSD para detecção de objetos

FROM node:18-bullseye

# Instalar dependências do sistema para canvas e TensorFlow
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar pnpm e dependências
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Recompilar TensorFlow.js native bindings
RUN npm rebuild @tensorflow/tfjs-node --build-addon-from-source

# Copiar código fonte
COPY . .

# Criar diretório para logs
RUN mkdir -p /app/logs

# Expor portas
EXPOSE 3000 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando padrão: rodar server-vision-streaming.js
CMD ["node", "server-vision-streaming.js"]

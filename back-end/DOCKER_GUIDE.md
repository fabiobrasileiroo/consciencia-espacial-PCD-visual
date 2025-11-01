# 🐳 Guia Docker - Sistema de Detecção de Objetos

## 📋 Visão Geral

Este guia explica como rodar os servidores de visão usando Docker e Docker Compose.

### Servidores Disponíveis:

1. **vision-streaming** (Recomendado) - `server-vision-streaming.js`

   - TensorFlow COCO-SSD completo
   - Server-Sent Events (SSE)
   - Tracking de ESP32s
   - Sistema de alertas
   - Porta: 3000 (HTTP) + 8080 (WebSocket)

2. **vision-basic** (Opcional) - `server.js`
   - Versão básica sem SSE
   - Porta: 3001 (HTTP) + 8081 (WebSocket)
   - Só inicia com `--profile full`

---

## 🚀 Início Rápido

### 1. Instalar Docker e Docker Compose

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Configurar IP do ESP32-CAM

Edite o arquivo `.env.docker`:

```bash
nano .env.docker
```

Altere o IP do ESP32-CAM:

```
ESP32_CAM_IP=192.168.100.56  # Substitua pelo IP correto
```

### 3. Rodar apenas o servidor principal (Recomendado)

```bash
docker-compose up -d vision-streaming
```

### 4. Rodar ambos os servidores

```bash
docker-compose --profile full up -d
```

---

## 📦 Comandos Docker Compose

### Construir e Iniciar

```bash
# Construir a imagem
docker-compose build

# Iniciar serviços
docker-compose up -d

# Iniciar apenas vision-streaming
docker-compose up -d vision-streaming

# Iniciar ambos (full profile)
docker-compose --profile full up -d
```

### Gerenciar Serviços

```bash
# Ver logs
docker-compose logs -f vision-streaming

# Ver logs com timestamp
docker-compose logs -f --timestamps vision-streaming

# Parar serviços
docker-compose stop

# Parar e remover containers
docker-compose down

# Parar e remover tudo (incluindo volumes)
docker-compose down -v
```

### Reconstruir

```bash
# Reconstruir após mudanças no código
docker-compose build --no-cache

# Reconstruir e reiniciar
docker-compose up -d --build
```

### Status e Informações

```bash
# Ver status dos containers
docker-compose ps

# Ver recursos (CPU, RAM)
docker stats

# Inspecionar container
docker inspect vision-streaming

# Ver portas mapeadas
docker-compose port vision-streaming 3000
```

---

## 🔧 Comandos Docker (sem Compose)

### Construir Imagem

```bash
docker build -t vision-backend:latest .
```

### Rodar Container

```bash
# Rodar server-vision-streaming.js (padrão)
docker run -d \
  --name vision-streaming \
  -p 3000:3000 \
  -p 8080:8080 \
  -e ESP32_CAM_IP=192.168.100.56 \
  --restart unless-stopped \
  vision-backend:latest

# Rodar server.js
docker run -d \
  --name vision-basic \
  -p 3001:3000 \
  -p 8081:8080 \
  -e ESP32_CAM_IP=192.168.100.56 \
  --restart unless-stopped \
  vision-backend:latest \
  node server.js
```

### Gerenciar Containers

```bash
# Ver containers rodando
docker ps

# Ver todos os containers
docker ps -a

# Parar container
docker stop vision-streaming

# Iniciar container
docker start vision-streaming

# Remover container
docker rm -f vision-streaming

# Ver logs
docker logs -f vision-streaming

# Executar comando dentro do container
docker exec -it vision-streaming bash

# Reiniciar container
docker restart vision-streaming
```

---

## 📊 Verificar se está funcionando

### 1. Healthcheck

```bash
# Via Docker
docker-compose ps

# Status deve ser "healthy" após ~60 segundos
```

### 2. Testar API

```bash
# Health check
curl http://localhost:3000/health

# Status do servidor
curl http://localhost:3000/api/system/status | jq

# Testar ESP32-CAM
curl http://localhost:3000/api/esp32/test

# Swagger UI
xdg-open http://localhost:3000/api/docs
```

### 3. Testar SSE

```bash
# Ver eventos em tempo real
curl -N http://localhost:3000/api/stream/events

# Com filtro (apenas current-detection)
curl -N http://localhost:3000/api/stream/events | grep "current-detection" -A 1
```

### 4. Abrir Interface HTML

```bash
# Viewer
xdg-open http://localhost:3000/viewer.html

# SSE Test
xdg-open http://localhost:3000/test-sse.html
```

---

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs completos
docker-compose logs vision-streaming

# Ver últimas 100 linhas
docker-compose logs --tail=100 vision-streaming

# Seguir logs em tempo real
docker-compose logs -f vision-streaming
```

### TensorFlow não carrega

```bash
# Entrar no container
docker exec -it vision-streaming bash

# Verificar módulo nativo
ls -la /app/node_modules/@tensorflow/tfjs-node/deps/lib/

# Recompilar TensorFlow
npm rebuild @tensorflow/tfjs-node --build-addon-from-source
```

### ESP32-CAM não conecta

```bash
# Verificar se ESP32 está acessível do container
docker exec -it vision-streaming curl http://192.168.100.56/

# Se não funcionar, usar network host:
docker run -d \
  --name vision-streaming \
  --network host \
  -e ESP32_CAM_IP=192.168.100.56 \
  vision-backend:latest
```

### Porta já em uso

```bash
# Ver o que está usando a porta 3000
sudo lsof -i :3000

# Matar processo
sudo kill -9 <PID>

# Ou mudar porta no .env.docker
PORT=3005
```

### Container reinicia constantemente

```bash
# Ver logs de erro
docker logs vision-streaming

# Desabilitar restart
docker update --restart=no vision-streaming

# Verificar memória disponível
docker stats vision-streaming
```

---

## 🔒 Segurança e Performance

### Limitar Recursos

Edite `docker-compose.yml`:

```yaml
services:
  vision-streaming:
    # ... outras configs ...
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
        reservations:
          cpus: "1.0"
          memory: 1G
```

### Usar Multi-stage Build (Produção)

Crie `Dockerfile.prod`:

```dockerfile
# Stage 1: Build
FROM node:18-bullseye AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Stage 2: Runtime
FROM node:18-slim
RUN apt-get update && apt-get install -y \
    libcairo2 libpango-1.0-0 libjpeg62-turbo libgif7 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["node", "server-vision-streaming.js"]
```

### Variáveis de Ambiente Sensíveis

Use arquivo `.env` (não commitar):

```bash
# Criar .env a partir do template
cp .env.docker .env

# Editar com valores reais
nano .env

# Docker Compose vai ler automaticamente
```

---

## 📈 Monitoramento

### Ver uso de recursos

```bash
# CPU, RAM, Network
docker stats vision-streaming

# Modo contínuo
watch -n 2 'docker stats --no-stream'
```

### Logs estruturados

```bash
# JSON logs
docker-compose logs --json vision-streaming

# Com grep
docker-compose logs -f vision-streaming | grep "🎯 DETECÇÃO"

# Salvar logs em arquivo
docker-compose logs vision-streaming > logs/docker-$(date +%Y%m%d).log
```

### Healthcheck manual

```bash
# Ver status de saúde
docker inspect --format='{{.State.Health.Status}}' vision-streaming

# Ver últimos 5 healthchecks
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' vision-streaming
```

---

## 🚢 Deploy em Produção

### 1. Docker Swarm (Orquestração)

```bash
# Inicializar swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml vision

# Listar serviços
docker service ls

# Escalar serviço
docker service scale vision_vision-streaming=3

# Ver logs
docker service logs -f vision_vision-streaming
```

### 2. Portainer (Interface Web)

```bash
# Instalar Portainer
docker run -d \
  -p 9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce

# Acessar: http://localhost:9000
```

### 3. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/vision
server {
    listen 80;
    server_name vision.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoints precisam de timeouts maiores
    location /api/stream/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

---

## 🎯 Exemplos de Uso

### Rodar em background e ver logs

```bash
docker-compose up -d && docker-compose logs -f
```

### Reiniciar após mudanças no código

```bash
docker-compose restart vision-streaming
```

### Atualizar apenas uma variável de ambiente

```bash
docker-compose up -d -e ESP32_CAM_IP=192.168.100.100
```

### Backup de logs

```bash
docker-compose logs --no-color > backup-$(date +%Y%m%d-%H%M%S).log
```

### Executar shell no container

```bash
# Bash
docker exec -it vision-streaming bash

# Node REPL
docker exec -it vision-streaming node

# Testar imports
docker exec -it vision-streaming node -e "console.log(require('@tensorflow/tfjs-node'))"
```

---

## ✅ Checklist de Deploy

- [ ] Docker e Docker Compose instalados
- [ ] IP do ESP32-CAM configurado (`.env`)
- [ ] Build da imagem sem erros
- [ ] Container inicia corretamente
- [ ] Healthcheck passa após 60s
- [ ] API responde em `http://localhost:3000/health`
- [ ] ESP32-CAM conecta (`/api/esp32/test`)
- [ ] TensorFlow carrega modelo COCO-SSD
- [ ] SSE funciona (`curl -N /api/stream/events`)
- [ ] Swagger UI acessível (`/api/docs`)
- [ ] Logs estão sendo gerados
- [ ] Restart automático funciona

---

## 📚 Referências

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Criado:** 01/11/2025  
**Versão:** 1.0.0  
**Autor:** InovaTech 2025

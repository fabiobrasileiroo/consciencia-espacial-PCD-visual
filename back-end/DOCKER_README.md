# 🐳 Docker - Início Rápido

## 🚀 Comandos Essenciais

```bash
# Iniciar servidor principal
make up

# Ver logs
make logs

# Parar servidor
make down

# Ver todos os comandos
make help
```

---

## 📦 Instalação

### 1. Instalar Docker (Ubuntu/Debian)

```bash
make install-docker
# OU manualmente:
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Configurar ESP32-CAM

Edite `.env.docker`:

```bash
ESP32_CAM_IP=192.168.100.56  # Seu IP aqui
```

---

## 🎯 Uso Básico

### Iniciar

```bash
# Servidor principal (vision-streaming)
docker-compose up -d

# Ou usando Makefile
make up
```

### Verificar

```bash
# Status
make ps

# Logs
make logs

# Saúde
make health

# Testar API
make test
```

### Parar

```bash
# Parar containers
make down

# Limpar tudo
make clean
```

---

## 🌐 URLs Importantes

| Serviço     | URL                                     |
| ----------- | --------------------------------------- |
| API Health  | http://localhost:3000/health            |
| Swagger UI  | http://localhost:3000/api/docs          |
| SSE Stream  | http://localhost:3000/api/stream/events |
| Viewer HTML | http://localhost:3000/viewer.html       |
| SSE Test    | http://localhost:3000/test-sse.html     |

---

## 🛠️ Comandos Úteis

```bash
# Reconstruir após mudanças
make rebuild

# Ver uso de CPU/RAM
make stats

# Abrir shell no container
make shell

# Backup de logs
make backup-logs

# Abrir Swagger no navegador
make swagger

# Testar SSE
make test-sse
```

---

## 📋 Checklist

- [ ] Docker instalado
- [ ] IP do ESP32 configurado (`.env.docker`)
- [ ] `make up` executado
- [ ] `make health` retorna OK
- [ ] Swagger acessível (`make swagger`)

---

## 🐛 Problemas Comuns

### Container não inicia

```bash
make logs  # Ver o erro
```

### Porta 3000 em uso

```bash
sudo lsof -i :3000  # Ver quem está usando
# Ou mudar porta em .env.docker
```

### ESP32 não conecta

```bash
# Verificar IP
ping 192.168.100.56

# Testar do container
make shell
curl http://192.168.100.56/
```

---

## 📚 Documentação Completa

Ver: [DOCKER_GUIDE.md](./DOCKER_GUIDE.md)

---

**Criado:** 01/11/2025  
**InovaTech 2025**

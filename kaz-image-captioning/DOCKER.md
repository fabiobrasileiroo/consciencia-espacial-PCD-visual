# 🐳 Guia Docker - Image Captioning

## 📋 Pré-requisitos

- Docker instalado
- Docker Compose instalado
- Modelo baixado em `checkpoints/kaz_model.pth`

---

## 🚀 Início Rápido

### 1️⃣ Build da Imagem

```bash
docker-compose build
```

⏱️ **Tempo:** ~5-10 minutos (primeira vez)

---

### 2️⃣ Verificar Instalação

```bash
docker-compose run check
```

Verifica se tudo está configurado corretamente.

---

### 3️⃣ Executar com Webcam

#### Opção A: Legendas em Kazakh

```bash
docker-compose up webcam
```

#### Opção B: Legendas com Tradução (Recomendado) ⭐

```bash
docker-compose up webcam-translate
```

**Controles:**

- Pressione **'c'** para capturar
- Pressione **'ESC'** para sair

---

### 4️⃣ Processar Imagem Única

```bash
# Copiar imagem para pasta examples
cp minha_foto.jpg examples/

# Processar
docker-compose run single-image python3 test_single_image.py /app/input/minha_foto.jpg
```

---

## 🖥️ Configuração Display (Linux)

Para usar a webcam com interface gráfica no Docker:

```bash
# Permitir conexões X11
xhost +local:docker

# Executar container
docker-compose up webcam-translate

# Após terminar, remover permissão (segurança)
xhost -local:docker
```

---

## 📁 Volumes e Mapeamentos

```yaml
Volumes mapeados: ./checkpoints     → /app/checkpoints      (modelo)
  ./examples        → /app/input            (imagens de entrada)
  ./output          → /app/output           (resultados)
  ./captured_images → /app/captured_images  (capturas da webcam)
```

---

## 🔧 Comandos Úteis

### Ver logs

```bash
docker-compose logs -f webcam-translate
```

### Parar containers

```bash
docker-compose down
```

### Limpar tudo

```bash
docker-compose down -v
docker rmi image-captioning:latest
```

### Executar comando personalizado

```bash
docker-compose run webcam-translate bash
```

---

## 🐛 Solução de Problemas Docker

### Erro: "Cannot connect to X server"

**Solução:**

```bash
xhost +local:docker
export DISPLAY=:0
```

### Erro: "Cannot open /dev/video0"

**Solução:** Verifique se a webcam está disponível

```bash
ls -la /dev/video*
# Adicionar seu usuário ao grupo video
sudo usermod -aG video $USER
```

### Erro: "No space left on device"

**Solução:** Limpar imagens antigas do Docker

```bash
docker system prune -a
```

### Performance lenta no Docker

- Docker não tem acesso direto à GPU por padrão
- Para usar GPU no Docker, use NVIDIA Container Toolkit:
  ```bash
  # Instalar nvidia-docker2
  # Ver: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html
  ```

---

## 🎯 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Display para X11
DISPLAY=:0

# Dispositivo de vídeo
VIDEO_DEVICE=/dev/video0
```

---

## 📊 Build Multi-stage (Otimizado)

Para produção, use build otimizado:

```dockerfile
# Adicione ao Dockerfile
FROM python:3.10-slim as builder
# ... instalar dependências

FROM python:3.10-slim
COPY --from=builder ...
# Imagem final menor
```

---

## 🌐 Docker Hub

Para compartilhar sua imagem:

```bash
# Tag
docker tag image-captioning:latest seu-usuario/image-captioning:latest

# Push
docker push seu-usuario/image-captioning:latest

# Pull (outros usuários)
docker pull seu-usuario/image-captioning:latest
```

---

## 📝 Notas Importantes

⚠️ **GPU no Docker:** Requer NVIDIA Container Toolkit

⚠️ **Webcam no Docker:** Pode ter limitações dependendo do sistema

⚠️ **Performance:** Docker pode ser ~10-20% mais lento que nativo

✅ **Melhor para:** Testes isolados, CI/CD, produção

✅ **Para desenvolvimento:** Use ambiente virtual nativo

---

## 🆘 Suporte

- **Docker oficial:** https://docs.docker.com/
- **NVIDIA Container Toolkit:** https://github.com/NVIDIA/nvidia-docker
- **Issues do projeto:** https://github.com/IS2AI/kaz-image-captioning/issues

---

**Docker configurado e pronto para uso! 🐳**

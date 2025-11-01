# 🎯 Vision API - Detecção de Objetos com TensorFlow

## 🚀 Recursos Implementados

### ✨ Novidades

- ✅ **TensorFlow.js** integrado com COCO-SSD
- ✅ **Canvas Node** para desenhar bounding boxes
- ✅ **Captura automática** do ESP32-CAM
- ✅ **API de imagem** com detecções desenhadas
- ✅ **Visualizador Web** interativo
- ✅ **Traduções para português**
- ✅ **Processamento em tempo real**

## 📦 Instalação

### 1. Instalar dependências

```bash
cd nest-vision-api
pnpm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure o IP do seu ESP32-CAM:

```env
ESP32_CAM_IP=192.168.100.56
ESP32_CAM_PORT=81
VISION_MIN_CONFIDENCE=0.5
VISION_CAPTURE_INTERVAL=2000
VISION_USE_STREAMING=false
VISION_DEBUG=true
```

### 3. Iniciar servidor

```bash
pnpm start:dev
```

Ou com Docker:

```bash
docker-compose up -d
```

## 🎯 Endpoints Disponíveis

### 📸 Captura de Imagem com Detecções

```bash
GET /api/vision/esp32/capture-image
```

Retorna imagem JPEG com bounding boxes desenhadas.

**Exemplo:**

```bash
curl http://localhost:3000/api/vision/esp32/capture-image --output detection.jpg
```

**Headers de resposta:**

- `X-Objects-Detected`: Número de objetos
- `X-Description`: Descrição em português
- `X-Frame-Number`: Número do frame

### 📊 Captura de Dados JSON

```bash
GET /api/vision/esp32/capture
```

Retorna dados das detecções sem a imagem.

**Exemplo de resposta:**

```json
{
  "success": true,
  "description": "Detectados 2 objetos: pessoa (95%), cadeira (87%)",
  "objects": [
    {
      "class": "person",
      "classPortuguese": "pessoa",
      "confidence": 0.95,
      "bbox": [100, 150, 200, 400]
    },
    {
      "class": "chair",
      "classPortuguese": "cadeira",
      "confidence": 0.87,
      "bbox": [300, 200, 150, 180]
    }
  ],
  "imageInfo": {
    "width": 640,
    "height": 480
  },
  "timestamp": 1730476800000
}
```

### ▶️ Controle de Captura Automática

**Iniciar captura automática:**

```bash
POST /api/vision/esp32/auto-capture/start
```

**Parar captura automática:**

```bash
POST /api/vision/esp32/auto-capture/stop
```

**Status da captura:**

```bash
GET /api/vision/esp32/auto-capture/status
```

### 🔧 Testar Conexão ESP32

```bash
GET /api/vision/esp32/test
```

Verifica se o ESP32-CAM está acessível.

## 🖼️ Visualizador Web

Acesse o visualizador interativo em seu navegador:

```
http://localhost:3000/viewer/viewer.html
```

### Recursos do Visualizador:

- 📷 Captura manual
- ▶️ Auto refresh configurável
- 📊 Painel de informações
- ⏱️ Controle de intervalo
- 🎨 Interface moderna

## 🛠️ Configurações

### ESP32-CAM

Configure o IP do ESP32-CAM no arquivo `.env`:

```env
ESP32_CAM_IP=192.168.100.56
ESP32_CAM_PORT=81
```

### TensorFlow

Ajuste a confiança mínima e número máximo de detecções:

```env
VISION_MIN_CONFIDENCE=0.5
VISION_MAX_DETECTIONS_PER_FRAME=5
```

### Captura Automática

Configure o intervalo de captura (em milissegundos):

```env
VISION_CAPTURE_INTERVAL=2000
```

## 📚 Documentação Completa

Acesse a documentação Swagger em:

```
http://localhost:3000/api/docs
```

## 🐳 Docker

### Construir imagem

```bash
docker build -t vision-api:latest .
```

### Executar container

```bash
docker run -p 3000:3000 --env-file .env vision-api:latest
```

### Docker Compose

```bash
docker-compose up -d
```

## 🧪 Testar API

### Com cURL

```bash
# Capturar imagem
curl http://localhost:3000/api/vision/esp32/capture-image --output test.jpg

# Obter dados JSON
curl http://localhost:3000/api/vision/esp32/capture

# Testar conexão
curl http://localhost:3000/api/vision/esp32/test

# Iniciar captura automática
curl -X POST http://localhost:3000/api/vision/esp32/auto-capture/start
```

### Com JavaScript/Fetch

```javascript
// Capturar e exibir imagem
async function captureImage() {
  const response = await fetch(
    "http://localhost:3000/api/vision/esp32/capture-image"
  );
  const blob = await response.blob();
  const imageUrl = URL.createObjectURL(blob);

  // Informações nos headers
  const objectsDetected = response.headers.get("X-Objects-Detected");
  const description = response.headers.get("X-Description");

  console.log(`Detectados: ${objectsDetected} objetos`);
  console.log(`Descrição: ${description}`);

  // Exibir imagem
  document.getElementById("image").src = imageUrl;
}
```

## 🎨 Objetos Detectáveis

O modelo COCO-SSD detecta 80 classes de objetos, incluindo:

- 👤 Pessoas (person)
- 🚗 Veículos (car, motorcycle, bicycle, truck, bus)
- 🪑 Mobília (chair, couch, table, bed)
- 🐕 Animais (dog, cat, bird, horse)
- 📱 Eletrônicos (phone, laptop, tv, keyboard, mouse)
- 📚 Objetos comuns (book, bottle, cup, bowl)
- E muitos outros...

Todos os nomes são traduzidos automaticamente para português!

## 🚀 Performance

### Otimizações implementadas:

- ✅ Backend TensorFlow.js Node (CPU/GPU)
- ✅ Processamento assíncrono
- ✅ Cache de modelo carregado
- ✅ Controle de intervalo mínimo
- ✅ Verificação de mudanças antes de broadcast

### Métricas esperadas:

- Tempo de detecção: ~500-1500ms (dependendo do hardware)
- FPS: 0.5-2 FPS (modo captura)
- Uso de memória: ~300-500MB (com modelo carregado)

## 🔍 Debugging

Ative logs detalhados:

```env
VISION_DEBUG=true
```

Logs exibidos:

- 📡 Captura de frames
- 🎯 Objetos detectados
- ⏱️ Tempo de processamento
- 📦 Tamanho dos frames
- ⚠️ Erros e avisos

## 📝 Notas

1. **Primeira inicialização** pode demorar ~10-30 segundos para carregar o modelo TensorFlow
2. **Canvas** requer dependências nativas do sistema (instaladas automaticamente)
3. **ESP32-CAM** deve estar na mesma rede
4. **Captura automática** inicia automaticamente se `VISION_USE_STREAMING=false`

## 🆘 Troubleshooting

### Erro ao carregar modelo TensorFlow

```bash
# Reinstalar dependências
rm -rf node_modules
pnpm install
```

### ESP32-CAM não encontrado

```bash
# Verificar conexão
ping 192.168.100.56

# Testar endpoint
curl http://192.168.100.56/capture --output test.jpg
```

### Canvas não instala

```bash
# Ubuntu/Debian
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Reinstalar canvas
pnpm install canvas --force
```

## 📄 Licença

MIT

## 👨‍💻 Autor

Fabio Brasileiro

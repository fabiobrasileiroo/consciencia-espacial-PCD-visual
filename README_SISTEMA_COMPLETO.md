# 🎯 Sistema de Detecção de Objetos para PCD Visual

Sistema completo de assistência para pessoas com deficiência visual usando ESP32-CAM, TensorFlow e React Native.

## 📋 Arquitetura do Sistema

```
┌─────────────────┐
│   ESP32-CAM     │ ──► Captura vídeo
│  (Hardware)     │     Stream MJPEG
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Servidor Node   │ ──► Processa com TensorFlow
│ + TensorFlow.js │     Detecta objetos (COCO-SSD)
│  (Backend)      │
└────────┬────────┘
         │
         ▼ WebSocket
┌─────────────────┐
│  App Mobile     │ ──► Recebe detecções
│  React Native   │     Feedback de voz
│   (Frontend)    │     Interface acessível
└─────────────────┘
```

## 🔧 Componentes

### 1️⃣ ESP32-CAM (Hardware)

- **Localização**: `/esp-32-cam/esp-32-cam.ino`
- **Função**: Captura imagens/vídeo e transmite via HTTP
- **Modos**:
  - Stream MJPEG contínuo (`:81/stream`)
  - Captura individual (`/capture`)

### 2️⃣ Servidor Backend (Node.js + TensorFlow)

- **Localização**: `/deprecated/back-end/server-vision-streaming.js`
- **Função**: Processa frames com IA e detecta objetos
- **Tecnologias**:
  - Express (HTTP Server)
  - WebSocket (comunicação real-time)
  - TensorFlow.js + COCO-SSD (detecção de objetos)
  - Canvas (processamento de imagens)

### 3️⃣ App Mobile (React Native)

- **Localização**: `/pdc-visual-app/`
- **Função**: Interface para usuário final
- **Features**:
  - Feedback de voz (TTS)
  - Histórico de detecções
  - Conexão Bluetooth com dispositivo
  - WebSocket para dados real-time

## 🚀 Quick Start

### Passo 1: ESP32-CAM

#### Opção A: Arduino IDE

```bash
# 1. Abra esp-32-cam/esp-32-cam.ino
# 2. Configure WiFi no código:
#    const char* ssid = "SUA_REDE";
#    const char* password = "SUA_SENHA";
# 3. Upload para ESP32-CAM
```

#### Opção B: PlatformIO (Recomendado)

```bash
# Instalar PlatformIO
cd esp-32-cam
pio init --board esp32cam

# Criar platformio.ini
cat > platformio.ini << 'EOF'
[env:esp32cam]
platform = espressif32
board = esp32cam
framework = arduino
monitor_speed = 115200

lib_deps =
    esp32-camera

build_flags =
    -DBOARD_HAS_PSRAM
    -mfix-esp32-psram-cache-issue
EOF

# Upload
pio run --target upload
pio device monitor
```

### Passo 2: Servidor Backend

```bash
cd deprecated/back-end

# Instalar dependências
pnpm install

# Reconstruir pacotes nativos
pnpm rebuild canvas @tensorflow/tfjs-node

# Configurar IP do ESP32-CAM (editar server-vision-streaming.js)
# Linha 19-20:
const ESP32_CAM_CONFIG = {
  ip: '192.168.1.XXX',  # ← Coloque o IP do seu ESP32-CAM
  useStreaming: false,   # false = captura, true = streaming
  captureInterval: 2000,
  minConfidence: 0.5
};

# Iniciar servidor
./start.fish
# ou
node server-vision-streaming.js
```

### Passo 3: App Mobile

```bash
cd pdc-visual-app

# Instalar dependências
pnpm install

# Configurar WebSocket (contexts/AppContext.tsx)
# Linha 118:
url: 'ws://SEU_IP_LOCAL:8080',  # ← IP do servidor backend

# Iniciar app
pnpm start

# Em outro terminal (opcional: servidor mock)
node server/websocket-test-server.js
```

## 🔌 Endpoints da API

### Servidor Backend (porta 3000)

#### Status

```bash
GET http://localhost:3000/api/status
```

#### Testar ESP32-CAM

```bash
GET http://localhost:3000/api/esp32/test
```

#### Capturar e processar frame

```bash
GET http://localhost:3000/api/esp32/capture
```

#### Configurar ESP32-CAM

```bash
POST http://localhost:3000/api/esp32/config
Content-Type: application/json

{
  "ip": "192.168.1.100",
  "useStreaming": false,
  "captureInterval": 2000,
  "minConfidence": 0.5
}
```

#### Histórico de detecções

```bash
GET http://localhost:3000/api/history?limit=50
DELETE http://localhost:3000/api/history
```

### WebSocket (porta 8080)

#### Conectar

```javascript
const ws = new WebSocket("ws://localhost:8080");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

#### Mensagens recebidas

```javascript
// Nova detecção
{
  "type": "vision",
  "data": {
    "id": 1730000000000,
    "timestamp": 1730000000000,
    "description": "Detectados 2 objetos: pessoa (95%), celular (87%)",
    "objects": [
      {
        "class": "person",
        "confidence": 0.95,
        "bbox": [x, y, width, height]
      }
    ],
    "deviceId": "esp32-cam",
    "receivedAt": "2025-11-01T10:30:00.000Z"
  }
}

// Histórico
{
  "type": "history",
  "data": [ /* últimas 10 detecções */ ]
}

// Estado atual
{
  "type": "current",
  "data": {
    "description": "...",
    "objects": [...]
  }
}
```

## 📱 Fluxo de Dados

### Modo Captura (Padrão)

```
ESP32-CAM               Backend                  App Mobile
    │                      │                         │
    │◄─── GET /capture ────│                         │
    │                      │                         │
    │───── JPEG image ────►│                         │
    │                      │                         │
    │                      │── TensorFlow detect ──►│
    │                      │                         │
    │                      │── WebSocket message ───►│
    │                      │                         │
    │                      │                    [TTS: "Pessoa"]
```

### Modo Streaming

```
ESP32-CAM               Backend                  App Mobile
    │                      │                         │
    │◄─── GET :81/stream ──│                         │
    │                      │                         │
    │─── MJPEG stream ────►│                         │
    │  (contínuo)          │                         │
    │                      │── Process frames ──►    │
    │                      │   (a cada 2s)           │
    │                      │                         │
    │                      │── WebSocket ───────────►│
    │                      │   (quando detectar)     │
```

## 🛠️ Configurações

### ESP32-CAM

**WiFi**:

```cpp
// esp-32-cam.ino
const char* ssid = "SUA_REDE";
const char* password = "SUA_SENHA";
```

**Qualidade da câmera**:

```cpp
config.frame_size = FRAMESIZE_VGA;  // 640x480
config.jpeg_quality = 10;           // 0-63 (menor = melhor)
```

### Backend

**Configuração ESP32-CAM** (`server-vision-streaming.js`):

```javascript
const ESP32_CAM_CONFIG = {
  ip: "192.168.1.100", // IP do ESP32-CAM
  useStreaming: false, // false = captura, true = stream
  captureInterval: 2000, // ms entre processamentos
  minConfidence: 0.5, // Confiança mínima (0-1)
  maxDetectionsPerFrame: 5, // Máximo de objetos por frame
  streamTimeout: 10000, // Timeout do stream (ms)
};
```

**Portas**:

```javascript
const PORT = 3000; // HTTP Server
const WS_PORT = 8080; // WebSocket Server
```

### App Mobile

**WebSocket URL** (`contexts/AppContext.tsx`):

```typescript
url: 'ws://192.168.1.100:8080',  // IP do servidor backend
autoConnect: false,               // Conectar manualmente
```

## 🧪 Testes

### 1. Testar ESP32-CAM standalone

```bash
# Ver o stream no navegador
http://SEU_ESP32_IP:81/stream

# Capturar uma foto
curl http://SEU_ESP32_IP/capture --output foto.jpg
```

### 2. Testar Backend

```bash
# Status do servidor
curl http://localhost:3000/api/status

# Testar conexão com ESP32-CAM
curl http://localhost:3000/api/esp32/test

# Processar um frame manualmente
curl http://localhost:3000/api/esp32/capture
```

### 3. Testar WebSocket

```bash
# Instalar wscat
npm install -g wscat

# Conectar ao WebSocket
wscat -c ws://localhost:8080

# Aguardar mensagens...
```

### 4. Testar App Mobile

```bash
cd pdc-visual-app

# Usar servidor mock (sem ESP32-CAM)
node server/websocket-test-server.js

# Em outro terminal
pnpm start

# No app: conectar ao WebSocket mock em ws://SEU_IP:3001
```

## 🐛 Troubleshooting

### ESP32-CAM não conecta no WiFi

- Verificar SSID e senha
- Distância do roteador
- Canal WiFi (ESP32 só funciona em 2.4GHz)
- Usar monitor serial: `pio device monitor`

### Backend não encontra ESP32-CAM

```bash
# Descobrir IP do ESP32-CAM
# 1. Ver no monitor serial
# 2. Ver no roteador (DHCP)
# 3. Scan de rede:
nmap -p 80,81 192.168.1.0/24
```

### Erro ao instalar TensorFlow

```bash
# Instalar dependências do sistema (Ubuntu/Debian)
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Reconstruir
cd deprecated/back-end
pnpm rebuild canvas @tensorflow/tfjs-node
```

### App não conecta no WebSocket

- Verificar IP do servidor (não usar localhost no mobile)
- Verificar firewall
- Testar com `wscat` primeiro
- Ver logs do servidor

## 📝 Modelo de Detecção (COCO-SSD)

### Objetos detectáveis (80 classes):

- **Pessoas**: person
- **Veículos**: car, bicycle, motorcycle, bus, truck, boat, airplane, train
- **Animais**: dog, cat, bird, horse, sheep, cow, elephant, bear, zebra, giraffe
- **Objetos**: bottle, cup, fork, knife, spoon, bowl, chair, couch, table, bed, phone, laptop, mouse, keyboard, book, clock, door (via bag), bag, backpack, umbrella, TV

### Tradução PT-BR

O servidor já traduz automaticamente os nomes dos objetos para português (ver função `generateDescription()`).

## 🎨 PlatformIO Configuração Completa

### platformio.ini

```ini
[platformio]
default_envs = esp32cam

[env:esp32cam]
platform = espressif32
board = esp32cam
framework = arduino
monitor_speed = 115200
monitor_filters = esp32_exception_decoder

lib_deps =
    esp32-camera

build_flags =
    -DBOARD_HAS_PSRAM
    -mfix-esp32-psram-cache-issue
    -DCORE_DEBUG_LEVEL=3

upload_speed = 921600
```

### Comandos úteis

```bash
# Build
pio run

# Upload
pio run --target upload

# Monitor serial
pio device monitor

# Build + Upload + Monitor
pio run --target upload && pio device monitor

# Limpar build
pio run --target clean
```

## 📚 Recursos Adicionais

- [TensorFlow.js Models](https://github.com/tensorflow/tfjs-models)
- [COCO-SSD Demo](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)
- [ESP32-CAM Examples](https://github.com/espressif/arduino-esp32/tree/master/libraries/ESP32/examples/Camera)
- [PlatformIO ESP32](https://docs.platformio.org/en/latest/boards/espressif32/esp32cam.html)

## 📄 Licença

MIT License - InovaTech 2025

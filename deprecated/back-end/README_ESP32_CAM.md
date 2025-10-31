# 📸 Integração ESP32-CAM + TensorFlow

## 🎯 Visão Geral

Este servidor captura frames da ESP32-CAM via HTTP, processa com TensorFlow.js (modelo COCO-SSD) e envia as detecções para o app mobile via WebSocket.

## 🔧 Instalação

```bash
# Instalar dependências
npm install express ws cors axios canvas @tensorflow-models/coco-ssd @tensorflow/tfjs-node

# Ou com yarn
yarn add express ws cors axios canvas @tensorflow-models/coco-ssd @tensorflow/tfjs-node
```

## ⚙️ Configuração do ESP32-CAM

### 1. Configurar IP no código

Edite o arquivo `server-vision-cam.js`:

```javascript
const ESP32_CAM_CONFIG = {
  ip: "192.168.1.100", // 👈 COLOQUE O IP DO SEU ESP32-CAM AQUI
  streamPort: 81,
  captureInterval: 2000, // Capturar a cada 2 segundos
  minConfidence: 0.5,
  maxDetectionsPerFrame: 5,
};
```

### 2. Código Arduino para ESP32-CAM

```cpp
#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";

WebServer server(80);

// Configuração dos pinos da câmera AI-Thinker
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

void setupCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Qualidade da imagem
  config.frame_size = FRAMESIZE_VGA; // 640x480
  config.jpeg_quality = 12;
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x", err);
    return;
  }
}

void handleCapture() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }

  server.send_P(200, "image/jpeg", (const char *)fb->buf, fb->len);
  esp_camera_fb_return(fb);
}

void handleStatus() {
  String json = "{\"status\":\"online\",\"ip\":\"" + WiFi.localIP().toString() + "\"}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);

  // Conectar WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Configurar câmera
  setupCamera();

  // Rotas HTTP
  server.on("/capture", handleCapture);
  server.on("/status", handleStatus);

  server.begin();
  Serial.println("Servidor HTTP iniciado!");
}

void loop() {
  server.handleClient();
}
```

## 🚀 Como Usar

### 1. Iniciar o servidor

```bash
node server-vision-cam.js
```

### 2. Testar conexão com ESP32-CAM

```bash
curl http://localhost:3000/api/esp32/test
```

### 3. Capturar e processar manualmente

```bash
curl http://localhost:3000/api/esp32/capture
```

### 4. Ver status do servidor

```bash
curl http://localhost:3000/api/status
```

### 5. Configurar IP dinamicamente

```bash
curl -X POST http://localhost:3000/api/esp32/config \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.150", "captureInterval": 3000}'
```

## 📡 Endpoints API

| Método | Endpoint                | Descrição                            |
| ------ | ----------------------- | ------------------------------------ |
| GET    | `/api/esp32/test`       | Testa conexão com ESP32-CAM          |
| GET    | `/api/esp32/capture`    | Captura e processa frame manualmente |
| POST   | `/api/esp32/config`     | Configura IP e parâmetros            |
| GET    | `/api/status`           | Status do servidor e modelo          |
| GET    | `/api/history?limit=50` | Histórico de detecções               |
| DELETE | `/api/history`          | Limpar histórico                     |

## 🔌 WebSocket (Cliente Mobile)

O servidor envia automaticamente as detecções para clientes conectados:

```javascript
const ws = new WebSocket("ws://localhost:8080");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "vision") {
    console.log("Nova detecção:", data.data.description);
    // Enviar para TTS (text-to-speech)
  }

  if (data.type === "history") {
    console.log("Histórico:", data.data);
  }
};
```

## 🎯 Como Funciona

```
┌─────────────┐        HTTP GET         ┌──────────────┐
│  ESP32-CAM  │ ◄──────────────────────  │   Servidor   │
│  (Stream)   │                          │   Node.js    │
└─────────────┘                          └──────────────┘
       │                                        │
       │  JPEG Frame                            │
       └────────────────────────────────────────►
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │ TensorFlow  │
                                          │  COCO-SSD   │
                                          └─────────────┘
                                                 │
                                                 │ Detecções
                                                 ▼
                                          ┌─────────────┐
                                          │  WebSocket  │
                                          │   Clients   │
                                          └─────────────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │ App Mobile  │
                                          │  (TTS)      │
                                          └─────────────┘
```

### Fluxo de Processamento

1. **Captura**: Servidor faz requisição HTTP GET para `/capture` do ESP32-CAM
2. **Recebe**: ESP32-CAM retorna frame JPEG
3. **Processa**: TensorFlow analisa imagem e detecta objetos
4. **Filtra**: Remove detecções com baixa confiança
5. **Traduz**: Converte nomes para português
6. **Broadcast**: Envia via WebSocket para todos os clientes
7. **TTS**: App mobile converte texto em voz

## ⚡ Otimizações

### Ajustar Intervalo de Captura

```javascript
// Capturar mais rápido (mais processamento)
captureInterval: 1000; // 1 segundo

// Capturar mais devagar (menos processamento)
captureInterval: 5000; // 5 segundos
```

### Ajustar Confiança Mínima

```javascript
// Mais restritivo (menos falsos positivos)
minConfidence: 0.7; // 70%

// Menos restritivo (mais detecções)
minConfidence: 0.3; // 30%
```

### Qualidade da Imagem no ESP32

```cpp
// Alta qualidade (mais lento)
config.frame_size = FRAMESIZE_SVGA; // 800x600
config.jpeg_quality = 10;

// Baixa qualidade (mais rápido)
config.frame_size = FRAMESIZE_QVGA; // 320x240
config.jpeg_quality = 15;
```

## 🐛 Troubleshooting

### ESP32-CAM não responde

1. Verifique se o IP está correto
2. Ping no ESP32-CAM: `ping 192.168.1.100`
3. Teste no navegador: `http://192.168.1.100/status`

### Modelo TensorFlow muito lento

1. Use `@tensorflow/tfjs-node-gpu` se tiver GPU
2. Aumente o `captureInterval`
3. Reduza resolução da imagem no ESP32

### Muitas detecções falsas

1. Aumente `minConfidence` para 0.6 ou 0.7
2. Reduza `maxDetectionsPerFrame`
3. Melhore iluminação da cena

### WebSocket não conecta

1. Verifique firewall
2. Teste: `wscat -c ws://localhost:8080`
3. Veja logs do servidor

## 📊 Objetos Detectáveis (COCO-SSD)

O modelo pode detectar 80 classes de objetos:

**Pessoas e Animais**: person, dog, cat, bird, horse, cow, sheep, etc.

**Veículos**: car, bicycle, motorcycle, bus, truck, train, boat, airplane

**Objetos do Dia-a-Dia**: bottle, cup, fork, knife, spoon, bowl, chair, table, laptop, phone, book, clock, scissors, etc.

## 🎨 Exemplo de Resposta

```json
{
  "id": 1698765432000,
  "timestamp": 1698765432000,
  "description": "Detectados 3 objetos: pessoa (92%), notebook (87%), xícara (76%)",
  "objects": [
    {
      "class": "person",
      "confidence": 0.92,
      "bbox": [10, 20, 300, 400]
    },
    {
      "class": "laptop",
      "confidence": 0.87,
      "bbox": [100, 250, 200, 150]
    },
    {
      "class": "cup",
      "confidence": 0.76,
      "bbox": [350, 300, 50, 80]
    }
  ],
  "deviceId": "esp32-cam",
  "receivedAt": "2025-10-31T19:10:32.000Z"
}
```

## 📝 Notas

- O servidor processa automaticamente em loop
- Só envia atualizações quando detecta mudanças
- Mantém histórico das últimas 100 detecções
- Suporta múltiplos clientes WebSocket simultâneos
- Tradução automática para português

## 🔗 Links Úteis

- [ESP32-CAM Guide](https://randomnerdtutorials.com/esp32-cam-video-streaming-web-server/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [COCO-SSD Model](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)

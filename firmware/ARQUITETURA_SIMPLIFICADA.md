# 🎯 Arquitetura Simplificada - Sistema de Detecção

## 📋 Visão Geral

Sistema dividido em **duas comunicações independentes**:

1. **ESP32-PAI** → Recebe sensor e controla motor via **ESP-NOW** → Envia dados ao servidor via **WebSocket**
2. **ESP32-CAM** → Servidor captura imagens via **HTTP** → Processa com TensorFlow

```
┌─────────────────────────────────────────────────────────────┐
│                    REDE LOCAL (192.168.100.x)               │
│                                                              │
│  ┌────────────────┐                                         │
│  │  ESP32-SENSOR  │ (Módulo 1)                              │
│  │  (Distância)   │                                         │
│  └───────┬────────┘                                         │
│          │ ESP-NOW                                          │
│          │ (Distância)                                      │
│          ▼                                                  │
│  ┌────────────────┐        WebSocket                       │
│  │  ESP32-PAI     │◄──────────────────┐                    │
│  │  (Mestre)      │                    │                    │
│  └───────┬────────┘                    │                    │
│          │ ESP-NOW                     │                    │
│          │ (Vibração)                  │                    │
│          ▼                             │                    │
│  ┌────────────────┐                    │                    │
│  │  ESP32-MOTOR   │ (Módulo 3)         │                    │
│  └────────────────┘                    │                    │
│                                         │                    │
│  ┌────────────────┐         HTTP       ▼                    │
│  │  ESP32-CAM     │◄────┐   ┌──────────────────┐           │
│  │  (Câmera)      │     └───│ Servidor Node.js │           │
│  └────────────────┘         │  + TensorFlow    │           │
│      192.168.100.56         └────────┬─────────┘           │
│                                       │                     │
│                                       │ SSE/WebSocket       │
│                                       ▼                     │
│                              ┌─────────────────┐            │
│                              │   App Mobile    │            │
│                              └─────────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxos de Comunicação

### 1️⃣ Fluxo do Sensor (ESP-NOW + WebSocket)

```
ESP32-Sensor ──ESP-NOW──► ESP32-PAI ──WebSocket──► Servidor ──SSE──► App
   (distância)            (processa)     (alerta)    (broadcast)
                               │
                          ESP-NOW
                               │
                               ▼
                          ESP32-Motor
                          (vibração)
```

**Dados transmitidos:**

- Distância medida (cm)
- Nível de vibração calculado (0-3)
- Alertas (info, warning, danger)
- RSSI do WiFi

### 2️⃣ Fluxo da Câmera (HTTP + TensorFlow)

```
Servidor ──HTTP GET──► ESP32-CAM
   │                    (192.168.100.56/capture)
   │
   └─► Imagem JPEG
       │
       ▼
   TensorFlow.js
   (COCO-SSD)
       │
       ▼
   Detecção de Objetos
       │
       ▼
   SSE Broadcast
       │
       ▼
   App Mobile
```

**Dados transmitidos:**

- Imagem JPEG capturada
- Objetos detectados com bounding boxes
- Descrição em português
- Timestamp da detecção

---

## 📡 Módulos do Sistema

### ESP32-PAI (Mestre)

**Função:** Coordenador central, ponte entre ESP-NOW e Internet

**Recebe via ESP-NOW:**

- ✅ Sensor de distância (Módulo 1)

**Envia via ESP-NOW:**

- ✅ Comandos de vibração para motor (Módulo 3)

**Envia via WebSocket ao servidor:**

- ✅ Distância atual
- ✅ Alertas baseados na distância
- ✅ RSSI e status do sistema

**NÃO recebe:**

- ❌ Dados da câmera (comunicação direta com servidor)

### ESP32-CAM (Módulo 2)

**Função:** Servidor HTTP de imagens

**Fornece:**

- ✅ Servidor HTTP na porta 80
- ✅ Endpoint `/capture` para captura única
- ✅ Endpoint `/stream` para stream MJPEG

**NÃO faz:**

- ❌ ESP-NOW (comunicação direta com servidor)
- ❌ Processamento de imagens (feito no servidor)

### ESP32-Sensor (Módulo 1)

**Função:** Medição de distância

**Envia via ESP-NOW:**

- ✅ Distância em cm
- ✅ ID do módulo (1)

### ESP32-Motor (Módulo 3)

**Função:** Feedback tátil

**Recebe via ESP-NOW:**

- ✅ Nível de vibração (0-3)
- ✅ Comandos do PAI

---

## 🔧 Configuração dos Módulos

### ESP32-PAI (`firmware/esp32-pai-mestre/src/main.cpp`)

```cpp
// WiFi
const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";

// WebSocket (Local)
const char* wsServer = "192.168.100.11";  // IP do PC
const int wsPort = 3000;
const char* wsPath = "/esp32";
const bool useSSL = false;

// MAC Addresses (obter do Serial Monitor)
uint8_t modulo1Address[] = {0xD0, 0xEF, 0x76, 0x15, 0x8F, 0x04};  // Sensor
uint8_t modulo3Address[] = {0xEC, 0x64, 0xC9, 0x7B, 0x99, 0x8C};  // Motor
```

**Lógica de Vibração:**

```cpp
if (distancia < 20 cm)   → vibLevel = 3 (FORTE)   + Alerta DANGER
if (distancia < 50 cm)   → vibLevel = 2 (MÉDIO)   + Alerta WARNING
if (distancia < 100 cm)  → vibLevel = 1 (BAIXO)   + Alerta INFO
if (distancia >= 100 cm) → vibLevel = 0 (PARADO)
```

### ESP32-CAM (`esp-32-cam/src/main.cpp`)

```cpp
// WiFi
const char *ssid = "SEU_WIFI";
const char *password = "SUA_SENHA";
```

**Endpoints disponíveis:**

- `http://192.168.100.56/capture` - Captura uma imagem JPEG
- `http://192.168.100.56/stream` - Stream MJPEG contínuo
- `http://192.168.100.56/status` - Status da câmera

### Servidor Node.js (`back-end/server-vision-streaming.js`)

```bash
# Variáveis de ambiente
PORT=3000
ESP32_CAM_IP=192.168.100.56
NODE_ENV=development
```

**Configuração automática:**

- ✅ WebSocket em `ws://localhost:3000/esp32` (ESP32-PAI)
- ✅ WebSocket em `ws://localhost:3000/ws` (App Mobile)
- ✅ SSE em `http://localhost:3000/api/stream/events`
- ✅ Captura da câmera via HTTP a cada 1.5s

---

## 📊 Mensagens WebSocket

### 🔼 ESP32-PAI → Servidor

#### Identificação

```json
{
  "type": "identify",
  "deviceId": "ESP32-PAI-MESTRE",
  "mac": "EC:64:C9:7C:38:30",
  "timestamp": 12345
}
```

#### Status do Sensor

```json
{
  "type": "status",
  "module": "sensor",
  "distance": 45,
  "rssi": -65,
  "timestamp": 12345,
  "lastSensorUpdate": 1200
}
```

#### Alerta

```json
{
  "type": "alert",
  "level": "warning",
  "msg": "⚠️ ATENÇÃO! Objeto próximo",
  "distance": 45,
  "timestamp": 12345
}
```

### 🔽 Servidor → ESP32-PAI

#### Comando

```json
{
  "type": "command",
  "command": "test_motor",
  "timestamp": 12345
}
```

---

## 🚀 Como Rodar

### 1. Iniciar Servidor Node.js

```bash
cd back-end
node server-vision-streaming.js
```

### 2. Upload ESP32-PAI

```bash
cd firmware/esp32-pai-mestre
pio run --target upload
pio device monitor
```

**Monitor Serial esperado:**

```
╔════════════════════════════════════╗
║  ESP32-PAI - MESTRE + WEBSOCKET  ║
╚════════════════════════════════════╝

✅ WiFi conectado!
   IP: 192.168.100.10
   MAC: EC:64:C9:7C:38:30
✅ ESP-NOW inicializado!
✅ Motor registrado como peer
✅ WebSocket conectado a: 192.168.100.11
📤 Identificação enviada ao servidor
📡 ESP-NOW: Aguardando dados do Módulo 1 (Sensor)
```

### 3. Upload ESP32-CAM

```bash
cd esp-32-cam
pio run --target upload
pio device monitor
```

**Monitor Serial esperado:**

```
WiFi connected
Camera Ready! Use 'http://192.168.100.56' to connect
```

### 4. Verificar no Servidor

**Terminal do servidor mostrará:**

```
🤝 ESP32 conectado: ::ffff:192.168.100.10
✅ ESP32-PAI identificado: ESP32-PAI-MESTRE
🔄 Processando frame #1...
🎯 DETECÇÃO TENSORFLOW - Frame #1
📝 Descrição: Detectados 2 objetos: pessoa (95%), cadeira (87%)
```

### 5. Testar com Sensor

Quando o sensor enviar dados:

**ESP32-PAI:**

```
╔════════════════════════════════╗
║     SENSOR (Módulo 1)          ║
╚════════════════════════════════╝
📍 MAC: D0:EF:76:15:8F:04
📏 Distância: 45 cm
🟡 Intensidade: MÉDIA (nível 2)
✅ Comando enviado ao Motor
════════════════════════════════
```

**Servidor:**

```
📥 Mensagem ESP32 (status):
📏 Sensor: 45cm | RSSI: -65dBm

📥 Mensagem ESP32 (alert):
🚨 ALERTA warning: ⚠️ ATENÇÃO! Objeto próximo
```

---

## 📱 App Mobile

**Conectar ao servidor:**

```javascript
// SSE (recomendado para dados em tempo real)
const evtSource = new EventSource(
  "http://192.168.100.11:3000/api/stream/events"
);

evtSource.addEventListener("esp32-status", (event) => {
  const data = JSON.parse(event.data);
  console.log("Sensor:", data.distance, "cm");
});

evtSource.addEventListener("alert", (event) => {
  const alert = JSON.parse(event.data);
  // Vibrar celular ou tocar som baseado em alert.level
});

evtSource.addEventListener("current-detection", (event) => {
  const detection = JSON.parse(event.data);
  console.log("Objetos:", detection.description);
  // Narrar objetos detectados via TTS
});
```

---

## 🎯 Vantagens da Arquitetura

✅ **Simples e eficiente**

- Cada módulo tem uma função específica
- Sem dependências complexas entre câmera e PAI

✅ **Escalável**

- Fácil adicionar mais sensores via ESP-NOW
- Servidor processa múltiplas fontes de dados

✅ **Resiliente**

- Se câmera cair, sensor continua funcionando
- Se sensor cair, câmera continua funcionando

✅ **Baixa latência**

- ESP-NOW: ~10ms entre ESP32s
- WebSocket: ~50ms entre PAI e servidor
- HTTP: ~200ms para captura de imagem

---

## ✅ Checklist

- [ ] Servidor Node.js rodando
- [ ] ESP32-PAI conectado ao WiFi
- [ ] ESP32-PAI conectado ao servidor via WebSocket
- [ ] ESP32-PAI recebendo dados do sensor via ESP-NOW
- [ ] ESP32-CAM conectado ao WiFi
- [ ] ESP32-CAM respondendo em http://192.168.100.56
- [ ] Servidor capturando imagens da câmera
- [ ] TensorFlow detectando objetos
- [ ] App mobile recebendo dados via SSE

---

**Sistema simplificado e funcional! 🎉**

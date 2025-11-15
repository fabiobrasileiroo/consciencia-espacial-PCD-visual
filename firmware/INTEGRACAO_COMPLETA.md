# 🔌 Integração Completa: ESP32-PAI + ESP32-CAM + Servidor Node.js

## 📋 Visão Geral

Este documento descreve a integração completa entre os módulos ESP32 e o servidor Node.js via **WebSocket** e **ESP-NOW**.

### Fluxo de Dados

```
ESP32-CAM (Módulo 2)
     │ ESP-NOW (Heartbeat a cada 3s)
     ├──────────────────┐
     │                  │
     ▼                  ▼
ESP32 Sensor ─────► ESP32-PAI ─────► Servidor Node.js ─────► App Mobile
(Módulo 1)         (Mestre)          (WebSocket)              (SSE/WebSocket)
     │                  │
     │ ESP-NOW          │ WebSocket
     │ (Distância)      │ (Status + Alertas)
     │                  │
     └──────────────────┼──────────────► Motor de Vibração
                                         (Módulo 3)
```

---

## 🎯 Funcionalidades Implementadas

### ESP32-PAI (Mestre)

- ✅ Recebe dados do **Sensor** (Módulo 1) via ESP-NOW
- ✅ Recebe heartbeat da **Câmera** (Módulo 2) via ESP-NOW
- ✅ Envia comandos ao **Motor** (Módulo 3) via ESP-NOW
- ✅ Conecta ao servidor Node.js via **WebSocket**
- ✅ Envia status em tempo real ao servidor
- ✅ Envia alertas baseados na distância
- ✅ Recebe comandos remotos do servidor

### ESP32-CAM (Módulo 2)

- ✅ Mantém servidor HTTP para captura de imagens
- ✅ Envia heartbeat via ESP-NOW ao PAI a cada 3s
- ✅ Informa status: uptime, RSSI, frameCount

### Servidor Node.js

- ✅ Aceita conexões WebSocket do ESP32-PAI
- ✅ Recebe dados em tempo real dos módulos
- ✅ Broadcast via SSE para apps mobile
- ✅ Envia comandos remotos ao ESP32-PAI

---

## 🔧 Configuração

### 1. ESP32-PAI (esp32-pai-mestre/src/main.cpp)

**Configurar WiFi:**

```cpp
const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";
```

**Configurar WebSocket (Desenvolvimento Local):**

```cpp
const char* wsServer = "192.168.100.11";  // IP do seu PC
const int wsPort = 3000;
const char* wsPath = "/esp32";
const bool useSSL = false;
```

**Configurar WebSocket (Produção - Render):**

```cpp
const char* wsServer = "seu-servico.onrender.com";
const int wsPort = 443;
const char* wsPath = "/esp32";
const bool useSSL = true;
```

**Configurar MAC Addresses:**

```cpp
// MAC do Módulo 1 (Sensor) - obtenha rodando o código do sensor
uint8_t modulo1Address[] = {0xD0, 0xEF, 0x76, 0x15, 0x8F, 0x04};

// MAC do Módulo 3 (Motor) - obtenha rodando o código do motor
uint8_t modulo3Address[] = {0xEC, 0x64, 0xC9, 0x7B, 0x99, 0x8C};
```

### 2. ESP32-CAM (esp-32-cam/src/main.cpp)

**Configurar WiFi:**

```cpp
const char *ssid = "SEU_WIFI";
const char *password = "SUA_SENHA";
```

**Configurar MAC do PAI:**

```cpp
// SUBSTITUA pelo MAC do seu ESP32-PAI (mostrado no Serial Monitor)
uint8_t paiMacAddress[] = {0xEC, 0x64, 0xC9, 0x7C, 0x38, 0x30};
```

### 3. Servidor Node.js (back-end/server-vision-streaming.js)

**Já está configurado!** ✅

O servidor agora aceita conexões WebSocket em:

- Local: `ws://localhost:3000/esp32`
- Produção: `wss://seu-servico.onrender.com/esp32`

---

## 📥 Compilar e Upload

### ESP32-PAI

```bash
cd firmware/esp32-pai-mestre

# Instalar dependências (primeira vez)
pio lib install

# Compilar
pio run

# Upload (com ESP32 conectado via USB)
pio run --target upload

# Monitor Serial
pio device monitor
```

### ESP32-CAM

```bash
cd esp-32-cam

# Compilar
pio run

# Upload
pio run --target upload

# Monitor Serial
pio device monitor
```

---

## 📊 Mensagens WebSocket

### 🔼 ESP32-PAI → Servidor

#### 1. Identificação (ao conectar)

```json
{
  "type": "identify",
  "deviceId": "ESP32-PAI-MESTRE",
  "mac": "EC:64:C9:7C:38:30",
  "timestamp": 12345
}
```

#### 2. Status do Sensor

```json
{
  "type": "status",
  "module": "sensor",
  "distance": 45,
  "rssi": -65,
  "timestamp": 12345,
  "lastSensorUpdate": 1200,
  "lastCameraUpdate": 800
}
```

#### 3. Status da Câmera

```json
{
  "type": "status",
  "module": "camera",
  "capturing": true,
  "frameCount": 142,
  "rssi": -58,
  "uptime": 123456,
  "timestamp": 12345
}
```

#### 4. Alerta

```json
{
  "type": "alert",
  "level": "danger",
  "msg": "⚠️ PERIGO! Objeto muito próximo",
  "distance": 15,
  "timestamp": 12345
}
```

### 🔽 Servidor → ESP32-PAI

#### 1. Confirmação de Identificação

```json
{
  "type": "identify-ack",
  "message": "Servidor reconheceu o PAI",
  "timestamp": 12345
}
```

#### 2. Comando

```json
{
  "type": "command",
  "command": "test_motor",
  "timestamp": 12345
}
```

**Comandos disponíveis:**

- `test_motor`: Testa o motor com vibração média
- `get_status`: Solicita envio imediato de status

---

## 🧪 Testar a Integração

### 1. Iniciar o Servidor Node.js

```bash
cd back-end
node server-vision-streaming.js
```

Você verá:

```
✅ ESP-NOW inicializado!
🔌 WebSocket para ESP32-PAI: ws://localhost:3000/esp32
```

### 2. Upload no ESP32-CAM

O ESP32-CAM vai:

1. Conectar ao WiFi
2. Iniciar servidor HTTP
3. Enviar heartbeat ao PAI a cada 3s via ESP-NOW

**Monitor Serial esperado:**

```
✅ ESP-NOW inicializado com sucesso
✅ ESP32-PAI adicionado como peer
   MAC: EC:64:C9:7C:38:30
📡 ESP-NOW: Enviando heartbeat a cada 3 segundos
💓 Heartbeat enviado - Frames: 1, RSSI: -58 dBm
```

### 3. Upload no ESP32-PAI

O ESP32-PAI vai:

1. Conectar ao WiFi
2. Inicializar ESP-NOW
3. Conectar ao servidor via WebSocket
4. Aguardar dados dos módulos

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
🔌 Conectando ao WebSocket...
✅ WebSocket conectado a: 192.168.100.11
📤 Identificação enviada ao servidor
```

### 4. Verificar no Servidor

No terminal do servidor Node.js, você verá:

```
🤝 ESP32 conectado: ::ffff:192.168.100.10
📥 Mensagem ESP32 (identify):
✅ ESP32-PAI identificado: ESP32-PAI-MESTRE
```

### 5. Testar Sensor

Quando o Módulo 1 (Sensor) enviar dados:

**ESP32-PAI:**

```
=== SENSOR (Módulo 1) ===
MAC: D0:EF:76:15:8F:04
Distância: 45 cm
🟡 Intensidade: MÉDIA
✅ Comando enviado ao Motor
========================
```

**Servidor Node.js:**

```
📥 Mensagem ESP32 (status):
📏 Sensor: 45cm | RSSI: -65dBm
```

### 6. Testar Câmera

A cada 3 segundos, a câmera envia heartbeat:

**ESP32-PAI:**

```
=== CÂMERA (Módulo 2) ===
MAC: EC:64:C9:7C:38:2C
Capturing: SIM
Frames: 15
RSSI: -58 dBm
Uptime: 45000 ms
=======================
```

**Servidor Node.js:**

```
📥 Mensagem ESP32 (status):
📷 Camera: 15 frames, RSSI: -58dBm
```

---

## 🐛 Troubleshooting

### ESP32-PAI não conecta ao WebSocket

**Sintomas:**

```
❌ WebSocket desconectado
```

**Soluções:**

1. Verificar se o servidor Node.js está rodando
2. Confirmar IP do servidor em `wsServer`
3. Testar ping: `ping 192.168.100.11`
4. Verificar firewall/antivírus

### ESP32-CAM não envia heartbeat

**Sintomas:**

- PAI não recebe mensagens da câmera

**Soluções:**

1. Verificar MAC do PAI no código da câmera
2. Confirmar que ambos estão na mesma rede WiFi
3. Ver Serial Monitor da câmera:
   - Deve mostrar "📤 Heartbeat enviado..."

### Servidor não recebe mensagens ESP-NOW

**Isso é normal!** ESP-NOW é comunicação direta entre ESP32s.

O servidor recebe dados via WebSocket do ESP32-PAI, que retransmite o que recebeu via ESP-NOW.

### Comandos do servidor não funcionam

**Verificar:**

1. WebSocket está conectado?
2. JSON do comando está correto?
3. Usar rota HTTP para testar:

```bash
curl -X POST http://localhost:3000/api/esp32/command \
  -H "Content-Type: application/json" \
  -d '{"command":"test_motor"}'
```

---

## 📱 Integração com App Mobile

O app mobile pode:

1. **Conectar via SSE** (Server-Sent Events):

   ```javascript
   const evtSource = new EventSource(
     "http://192.168.100.11:3000/api/stream/events"
   );

   evtSource.addEventListener("esp32-status", (event) => {
     const data = JSON.parse(event.data);
     console.log("Status:", data);
   });

   evtSource.addEventListener("alert", (event) => {
     const alert = JSON.parse(event.data);
     console.log("Alerta:", alert);
   });
   ```

2. **Conectar via WebSocket**:

   ```javascript
   const ws = new WebSocket("ws://192.168.100.11:3000/ws");

   ws.onmessage = (event) => {
     const data = JSON.parse(event.data);
     console.log("Mensagem:", data);
   };
   ```

---

## 🚀 Deploy em Produção (Render)

### 1. Atualizar código do ESP32-PAI

```cpp
const char* wsServer = "seu-servico.onrender.com";
const int wsPort = 443;
const char* wsPath = "/esp32";
const bool useSSL = true;
```

### 2. Fazer upload no ESP32-PAI

### 3. Aguardar conexão

O ESP32-PAI tentará conectar via WSS (WebSocket Secure) na porta 443.

**Atenção:** O ESP32 precisa estar na internet (não apenas rede local).

---

## 📊 Estrutura de Dados ESP-NOW

### Sensor → PAI

```cpp
struct struct_sensor_data {
  int distance;    // Distância em cm
  int moduleId;    // ID do módulo (1)
}
```

### Câmera → PAI

```cpp
struct struct_camera_status {
  int moduleId;           // ID do módulo (2)
  bool capturing;         // Se está capturando
  int frameCount;         // Contador de frames
  long rssi;              // Sinal WiFi
  unsigned long uptime;   // Tempo ligado (ms)
}
```

### PAI → Motor

```cpp
struct struct_motor_command {
  int vibrationLevel;  // 0=parado, 1=baixo, 2=médio, 3=forte
  int moduleId;        // ID do módulo (3)
}
```

---

## ✅ Checklist de Integração

- [ ] Servidor Node.js rodando
- [ ] ESP32-PAI com WiFi configurado
- [ ] ESP32-PAI com WebSocket configurado
- [ ] ESP32-PAI com MACs corretos
- [ ] ESP32-CAM com WiFi configurado
- [ ] ESP32-CAM com MAC do PAI correto
- [ ] ESP32-CAM enviando heartbeat
- [ ] Sensor enviando distância
- [ ] Motor respondendo a comandos
- [ ] Servidor recebendo mensagens WebSocket
- [ ] App mobile recebendo SSE/WebSocket

---

**Integração completa! 🎉**

Agora você tem um sistema de visão para PCD totalmente funcional com comunicação em tempo real entre ESP32s e servidor Node.js!

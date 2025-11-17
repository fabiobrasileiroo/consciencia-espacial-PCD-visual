# 🔄 Sistema de Modo de Operação (Realtime/Manual)

## 📋 Visão Geral

O sistema agora suporta **dois modos de operação** controlados dinamicamente:

1. **🔴 REALTIME** - Captura automática a cada 5 segundos
2. **🔵 MANUAL** - Captura sob demanda via botão no app

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐
│  📱 App Mobile  │
│   React Native  │
└────────┬────────┘
         │ HTTP POST /api/operation-mode
         │ HTTP POST /api/esp32-cam/capture-now
         │ WebSocket (recebe detecções)
         ▼
┌─────────────────┐
│  🖥️  Backend    │
│   Node.js       │
│   teste-web.js  │
└────────┬────────┘
         │ HTTP GET /api/operation-mode (polling a cada 2s)
         │ HTTP GET /api/esp32-cam/capture-status
         │ HTTP POST /api/esp32-cam/send-description
         ▼
┌─────────────────┐
│  🐍 Python      │
│  esp32_to_      │
│  server.py      │
└────────┬────────┘
         │ MJPEG Stream
         ▼
┌─────────────────┐
│  📷 ESP32-CAM   │
│  :81/stream     │
└─────────────────┘
```

## 🔄 Fluxo de Operação

### Modo REALTIME (Automático)

1. **App** ou **Backend** define modo como `realtime`
2. **Python** detecta mudança de modo (polling a cada 2s)
3. **Python** captura frame a cada 5 segundos
4. **Python** processa com IA e envia para backend
5. **Backend** distribui via WebSocket
6. **App** recebe e exibe transcrição

### Modo MANUAL (Sob Demanda)

1. **App** define modo como `manual`
2. **Python** pausa capturas automáticas
3. **Usuário** clica em "📸 Capturar Agora"
4. **App** chama `POST /api/esp32-cam/capture-now`
5. **Backend** define flag `global.manualCaptureRequested = true`
6. **Python** verifica flag (polling a cada 0.5s)
7. **Python** captura, processa e envia
8. **Backend** reseta flag e distribui via WebSocket
9. **App** recebe transcrição

## 🛠️ Endpoints da API

### Backend (Node.js - porta 3000)

#### 1. Gerenciar Modo de Operação

**GET** `/api/operation-mode`

```json
{
  "mode": "realtime", // ou "manual"
  "lastChanged": 1234567890,
  "changedBy": "mobile-app"
}
```

**POST** `/api/operation-mode`

```json
// Request
{
  "mode": "manual",
  "triggeredBy": "mobile-app"
}

// Response
{
  "success": true,
  "mode": "manual",
  "timestamp": 1234567890
}
```

#### 2. Solicitar Captura Manual

**POST** `/api/esp32-cam/capture-now`

```json
// Response
{
  "success": true,
  "message": "Sinal de captura manual enviado",
  "timestamp": 1234567890
}
```

#### 3. Status de Captura (para Python)

**GET** `/api/esp32-cam/capture-status`

```json
{
  "shouldCapture": true,
  "timestamp": 1234567890,
  "mode": "manual"
}
```

#### 4. Enviar Detecção (Python → Backend)

**POST** `/api/esp32-cam/send-description`

```json
// Request
{
  "description_pt": "Um cachorro marrom correndo no parque",
  "description_kz": "Саябақта жүгіріп жүрген қоңыр ит",
  "objects": ["cachorro", "parque", "correndo"],
  "confidence": 0.85
}

// Response
{
  "success": true,
  "message": "Descrição recebida e distribuída",
  "receivedAt": 1234567890
}
```

## 📱 Código do App (React Native)

### Alternar Modo

```typescript
const toggleOperationMode = async () => {
  const newMode = operationMode === "realtime" ? "manual" : "realtime";

  const response = await fetch("http://localhost:3000/api/operation-mode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: newMode,
      triggeredBy: "mobile-app",
    }),
  });

  if (response.ok) {
    setOperationMode(newMode);
    showToast(`Modo ${newMode} ativado`, "success");
  }
};
```

### Capturar Manualmente

```typescript
const captureManualDetection = async () => {
  setIsCapturing(true);

  const response = await fetch(
    "http://localhost:3000/api/esp32-cam/capture-now",
    {
      method: "POST",
    }
  );

  if (response.ok) {
    showToast("Captura solicitada!", "success");
    // Aguarda detecção via WebSocket
  }
};
```

## 🐍 Código Python (esp32_to_server.py)

### Verificar Modo

```python
def get_operation_mode(base_url):
    server_base = base_url.rsplit('/api/', 1)[0]
    mode_url = f"{server_base}/api/operation-mode"

    response = requests.get(mode_url, timeout=2)
    data = response.json()
    return data.get('mode', 'realtime')
```

### Verificar Captura Manual

```python
def check_manual_capture_request(base_url):
    server_base = base_url.rsplit('/api/', 1)[0]
    status_url = f"{server_base}/api/esp32-cam/capture-status"

    response = requests.get(status_url, timeout=2)
    data = response.json()
    return data.get('shouldCapture', False), data.get('timestamp', 0)
```

### Loop Principal

```python
# Verificar modo a cada 2 segundos
if current_time - last_mode_check >= 2:
    new_mode = get_operation_mode(server_url)
    if new_mode != current_mode:
        current_mode = new_mode
        print(f"🔄 Modo alterado: {current_mode.upper()}")

# REALTIME: Capturar automaticamente
if current_mode == 'realtime' and current_time - last_capture >= interval:
    should_capture = True
    capture_reason = "REALTIME"

# MANUAL: Verificar solicitação
elif current_mode == 'manual' and current_time - last_manual_check >= 0.5:
    manual_requested, _ = check_manual_capture_request(server_url)
    if manual_requested:
        should_capture = True
        capture_reason = "MANUAL"
```

## 🚀 Como Usar

### 1. Iniciar Backend

```bash
cd back-end
node teste-web.js
```

### 2. Iniciar Script Python

```bash
cd kaz-image-captioning
source venv/bin/activate
python esp32_to_server.py \
  --esp32-url http://192.168.100.57:81/stream \
  --server-url http://192.168.100.11:3000/api/esp32-cam/send-description \
  --interval 5
```

### 3. Iniciar App Mobile

```bash
cd pdc-visual-app
npx expo start
```

### 4. Usar no App

#### Modo Realtime (Automático)

1. Conecte ao WebSocket
2. Verifique se câmera está conectada
3. Clique em "Mudar para Manual" para ativar modo realtime
4. Aguarde detecções automáticas a cada 5s

#### Modo Manual (Sob Demanda)

1. Conecte ao WebSocket
2. Verifique se câmera está conectada
3. Clique em "Mudar para Tempo Real" para ativar modo manual
4. Clique em "📸 Capturar Agora" quando desejar
5. Aguarde processamento (3-5s)

## 🔍 Debugging

### Verificar Modo Atual

```bash
curl http://localhost:3000/api/operation-mode
```

### Alterar Modo Manualmente

```bash
# Ativar REALTIME
curl -X POST http://localhost:3000/api/operation-mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "realtime", "triggeredBy": "curl"}'

# Ativar MANUAL
curl -X POST http://localhost:3000/api/operation-mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "manual", "triggeredBy": "curl"}'
```

### Solicitar Captura Manual

```bash
curl -X POST http://localhost:3000/api/esp32-cam/capture-now
```

### Verificar Status de Captura (Python)

```bash
curl http://localhost:3000/api/esp32-cam/capture-status
```

## 📊 Logs do Sistema

### Backend (Node.js)

```
📸 Captura manual solicitada via API
🔄 Modo alterado: MANUAL → REALTIME
📡 Detecção recebida e distribuída via WS
```

### Python (esp32_to_server.py)

```
🔄 Modo alterado: REALTIME
▶️  Captura automática ativada (intervalo: 5s)

📸 Captura #15 (frame 4532) [REALTIME]
⏰ 14:32:10
🤖 Gerando legenda...
📝 Descrição (Português): Um cachorro marrom correndo no parque
📤 ✅ Enviado: Um cachorro marrom correndo no parque...
✅ Detecção #15 processada

🔄 Modo alterado: MANUAL
⏸️  Captura automática pausada. Aguardando comando manual...

📸 Captura #16 (frame 5210) [MANUAL]
⏰ 14:35:42
🤖 Gerando legenda...
📝 Descrição (Português): Uma pessoa caminhando na rua
📤 ✅ Enviado: Uma pessoa caminhando na rua...
✅ Detecção #16 processada
```

## ⚙️ Configurações

### Intervalos de Verificação

- **Modo de operação**: 2 segundos (Python verifica backend)
- **Captura realtime**: 5 segundos (configurável via `--interval`)
- **Captura manual**: 0.5 segundos (Python verifica flag)
- **Timeout HTTP**: 2-5 segundos

### Performance

- **Latência modo realtime**: ~3-5s (processamento IA)
- **Latência modo manual**: ~4-6s (verificação + processamento)
- **CPU Python**: ~30-50% durante inferência
- **Memória Python**: ~1.5GB (modelo carregado)

## 🐛 Troubleshooting

### Python não detecta mudança de modo

- Verificar se backend está rodando em `localhost:3000`
- Verificar logs de `get_operation_mode()`
- Testar endpoint manualmente com `curl`

### Captura manual não funciona

- Verificar se modo está em `manual`
- Verificar logs do backend (`manualCaptureRequested`)
- Verificar polling do Python (0.5s)

### Detecções não chegam no app

- Verificar conexão WebSocket
- Verificar se backend recebeu via POST
- Verificar console do app para mensagens WS

## 📚 Documentação Adicional

- [README_BACKEND.md](app/README_BACKEND.md) - Detalhes do servidor Node.js
- [MODO_MANUAL_REALTIME.md](MODO_MANUAL_REALTIME.md) - Documentação original
- [README_SISTEMA_COMPLETO.md](README_SISTEMA_COMPLETO.md) - Arquitetura geral

# 🚀 Guia Rápido - Sistema de Detecção de Objetos

## ✅ Status Atual

### App Mobile (React Native) - ✅ FUNCIONANDO
- **Localização**: `/pdc-visual-app/`
- **Status**: Todos os erros corrigidos
- **Features implementadas**:
  - ✅ SafeArea nas tabs (não sobrepõe botões do sistema)
  - ✅ Sistema de Toast elegante (substitui alerts)
  - ✅ Bluetooth permission e scanning
  - ✅ WebSocket com auto-reconnect
  - ✅ Stats dinâmicas (temperatura, avisos, tempo de uso)
  - ✅ Pull-to-refresh nas telas principais
  - ✅ Indicador de conexão do servidor

**Como iniciar**:
```bash
cd pdc-visual-app
pnpm start
```

**Servidor WebSocket Mock** (para testes sem hardware):
```bash
cd pdc-visual-app
node server/websocket-test-server.js
# URL: ws://localhost:3001
```

### API NestJS - ✅ RECOMENDADO USAR
- **Localização**: `/nest-vision-api/`
- **Status**: Pronto para usar (moderno, profissional)
- **Features**:
  - ✅ API RESTful completa
  - ✅ WebSocket (Socket.IO) para ESP32
  - ✅ SSE para streaming
  - ✅ Swagger docs em `/api/docs`
  - ✅ Docker ready

**Como iniciar**:
```bash
cd nest-vision-api

# Método 1: NPM (se pnpm não funcionar)
npm install
npm run start:dev

# Método 2: Docker
docker-compose up

# Acesse:
# - API: http://localhost:3000
# - Docs: http://localhost:3000/api/docs
```

### Backend Node antigo - ⚠️ PROBLEMA COM DEPENDÊNCIAS
- **Localização**: `/deprecated/back-end/`
- **Status**: Problemas ao compilar TensorFlow e Canvas
- **Problema**: pnpm não compila binários nativos corretamente
- **Recomendação**: **Use o nest-vision-api** em vez deste

## 📱 Como Conectar Tudo

### Cenário 1: Teste Completo (sem hardware)

```bash
# Terminal 1: Mock WebSocket
cd pdc-visual-app
node server/websocket-test-server.js

# Terminal 2: App Mobile
cd pdc-visual-app
pnpm start

# No app, configure: ws://SEU_IP_LOCAL:3001
```

### Cenário 2: Com ESP32-CAM (Produção)

```bash
# Terminal 1: API NestJS
cd nest-vision-api
npm install
npm run start:dev
# ou
docker-compose up

# Terminal 2: App Mobile
cd pdc-visual-app
pnpm start

# Configurar no app: ws://SEU_IP_LOCAL:3000
```

### Cenário 3: Integração Completa

```
ESP32-CAM (Hardware)
    │
    ▼ HTTP POST ou WebSocket
NestJS API (Backend)
    │
    ▼ WebSocket
App React Native (Mobile)
```

## 🔧 ESP32-CAM Setup

### Arquivos
- **Arduino**: `/esp-32-cam/esp-32-cam.ino`
- **PlatformIO**: `/esp-32-cam/platformio.ini`

### PlatformIO (Recomendado)

```bash
cd esp-32-cam

# Iniciar projeto PlatformIO
pio init --board esp32cam

# platformio.ini já está criado!

# Upload para ESP32
pio run --target upload

# Monitor serial
pio device monitor
```

### Configuração WiFi (esp-32-cam.ino)

```cpp
const char* ssid = "SUA_REDE";
const char* password = "SUA_SENHA";
```

### URLs do ESP32-CAM

Após conectar, o ESP32 mostra o IP no Serial Monitor:

- **Stream**: `http://SEU_ESP32_IP:81/stream`
- **Captura**: `http://SEU_ESP32_IP/capture`
- **Status**: `http://SEU_ESP32_IP/status`

## 🌐 Endpoints da API NestJS

### Vision API

```bash
# Enviar detecção (POST)
curl -X POST http://localhost:3000/api/vision \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "ESP32_CAM_001",
    "objects": [
      {"name": "pessoa", "confidence": 95}
    ]
  }'

# Ver histórico (GET)
curl http://localhost:3000/api/vision/history

# Estatísticas (GET)
curl http://localhost:3000/api/vision/statistics

# Stream SSE (GET)
curl -N http://localhost:3000/api/vision/stream

# Health check (GET)
curl http://localhost:3000/api/health
```

### WebSocket (Socket.IO)

```javascript
// ESP32 Arduino
#include <SocketIOclient.h>

SocketIOclient socketIO;
socketIO.begin("192.168.1.100", 3000, "/socket.io/?EIO=4");

// Registrar módulo
socketIO.sendEVENT("{\"event\":\"register_esp32\",\"moduleId\":\"ESP32_CAM_001\"}");

// Enviar detecção
socketIO.sendEVENT("{\"event\":\"detection\",\"data\":{...}}");
```

## 🔍 Troubleshooting

### Problema: `pnpm` não encontrado no fish shell

**Solução 1: Usar npm**
```bash
# Em vez de pnpm, use npm
npm install
npm run start:dev
```

**Solução 2: Ativar nvm primeiro**
```bash
nvm use 22
pnpm start:dev
```

**Solução 3: Usar script bash**
```bash
bash start.sh  # Use os scripts .sh em vez de .fish
```

### Problema: TensorFlow não compila (`deprecated/back-end`)

**Solução**: Use o `nest-vision-api` que não depende de TensorFlow local

```bash
cd nest-vision-api
npm install
npm run start:dev
```

### Problema: ESP32 não conecta no WiFi

1. Verificar SSID e senha
2. ESP32 só funciona em WiFi 2.4GHz (não 5GHz)
3. Ver monitor serial: `pio device monitor`
4. Reduzir distância do roteador

### Problema: App não conecta no WebSocket

1. Verificar IP do servidor (não usar `localhost` no mobile)
2. Verificar firewall
3. Testar com `curl` ou navegador primeiro
4. Ver logs do servidor

### Problema: Canvas ou TensorFlow error

**Não tente corrigir** - Use o `nest-vision-api` que é mais moderno e não tem essas dependências problemáticas.

## 📝 Configurações Importantes

### App Mobile (`pdc-visual-app/contexts/AppContext.tsx`)

```typescript
// Linha 118
url: 'ws://192.168.1.100:3001',  // ← Altere para seu IP
autoConnect: false,
```

### API NestJS (`.env`)

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

### ESP32-CAM (`esp-32-cam.ino`)

```cpp
const char* ssid = "SUA_REDE";
const char* password = "SUA_SENHA";
const char* serverUrl = "http://192.168.1.100:3000/api/vision";
```

## 📚 Documentação Completa

- **Sistema Completo**: `/README_SISTEMA_COMPLETO.md`
- **App Mobile**: `/pdc-visual-app/README.md`
- **API NestJS**: `/nest-vision-api/README.md`
- **ESP32 Setup**: `/docs/README_HARDWARE.md`
- **Troubleshooting**: `/docs/TROUBLESHOOTING.md`

## 🎯 Próximos Passos

### 1. Testar sistema completo

```bash
# 1. Iniciar API NestJS
cd nest-vision-api
npm run start:dev

# 2. Iniciar App Mobile
cd pdc-visual-app
pnpm start

# 3. Upload ESP32-CAM
cd esp-32-cam
pio run --target upload
```

### 2. Desenvolver features

- [ ] Implementar detecção de objetos real (TensorFlow no servidor)
- [ ] Adicionar Text-to-Speech no app
- [ ] Melhorar feedback háptico
- [ ] Adicionar modo offline
- [ ] Implementar persistência de dados

### 3. Deploy

- [ ] Build do app para produção
- [ ] Deploy da API com Docker
- [ ] Configurar domínio/HTTPS
- [ ] Monitoramento e logs

## 🤔 Qual Backend Usar?

| Feature | nest-vision-api ✅ | deprecated/back-end ⚠️ |
|---------|-------------------|----------------------|
| Status | ✅ Funcionando | ⚠️ Problemas de build |
| Tecnologia | NestJS moderno | Express básico |
| WebSocket | ✅ Socket.IO | ✅ ws |
| TensorFlow | ❌ (adicionar depois) | ✅ (mas não compila) |
| Docker | ✅ Pronto | ❌ |
| Documentação | ✅ Swagger | ❌ |
| Recomendação | **USE ESTE** | Não recomendado |

## 🚀 Comando Único para Iniciar

```bash
# API
cd nest-vision-api && npm run start:dev

# OU

# Mock (para testes)
cd pdc-visual-app && node server/websocket-test-server.js
```

---

**Dúvidas?** Leia `/README_SISTEMA_COMPLETO.md` ou `/nest-vision-api/README.md`

# 🚀 Deploy no Render - Configuração Completa

## ✅ Mudanças Aplicadas

### 1. **Porta Dinâmica (Render-Ready)**

- ✅ `PORT` agora usa `process.env.PORT || 3000`
- ✅ Funciona tanto localmente quanto no Render

### 2. **Swagger com BASE_URL Dinâmica**

- ✅ `BASE_URL` configurável via variável de ambiente
- ✅ Swagger UI mostrará a URL correta em produção
- ✅ Evita mixed-content (HTTP/HTTPS) em produção

### 3. **WebSockets Unificados (Compatível com Render)**

- ✅ WebSocket para App Mobile: `ws://seu-host:PORT/ws`
- ✅ WebSocket para ESP32-PAI: `ws://seu-host:PORT/esp32`
- ✅ Ambos rodam no mesmo servidor HTTP (mesma porta)
- ✅ Render expõe apenas 1 porta - agora funciona!

### 4. **Docker Build Corrigido**

- ✅ Dockerfile usa `npm ci` se `package-lock.json` existir
- ✅ Fallback para `npm install` se não houver lock file
- ✅ `.dockerignore` atualizado para garantir que lockfiles sejam copiados

### 5. **Handler SIGINT Corrigido**

- ✅ Graceful shutdown sem erros ao pressionar Ctrl+C

---

## 🎯 Como Testar Localmente

```bash
# Testar com porta padrão (3000)
node server-vision-streaming.js

# Testar com porta customizada (simular Render)
PORT=8080 node server-vision-streaming.js

# Testar com BASE_URL (simular produção)
PORT=3000 BASE_URL=https://meu-projeto.onrender.com node server-vision-streaming.js
```

---

## 🐳 Build Docker Local

```bash
cd /home/fabiotrocados/inovatech2025/sistema_de_dectacao_de_objetos/back-end

# Build da imagem
docker build -t vision-backend:latest .

# Rodar container
docker run -p 3000:3000 -p 8080:8080 \
  -e PORT=3000 \
  -e BASE_URL=http://localhost:3000 \
  -e ESP32_CAM_IP=192.168.100.56 \
  vision-backend:latest

# Testar
curl http://localhost:3000/health
curl http://localhost:3000/api/docs.json
```

---

## ☁️ Deploy no Render

### 1. **Criar Novo Web Service**

- Vá em https://dashboard.render.com/
- Clique em "New +" → "Web Service"
- Conecte seu repositório GitHub

### 2. **Configurações do Serviço**

| Campo               | Valor                              |
| ------------------- | ---------------------------------- |
| **Name**            | `vision-backend` (ou seu nome)     |
| **Environment**     | `Docker`                           |
| **Region**          | `Oregon (US West)` ou mais próximo |
| **Branch**          | `main`                             |
| **Dockerfile Path** | `back-end/Dockerfile`              |
| **Docker Context**  | `back-end`                         |

### 3. **Variáveis de Ambiente**

Configure no painel do Render:

```bash
# Obrigatórias
NODE_ENV=production
ESP32_CAM_IP=192.168.100.56  # ou IP público do ESP32

# Opcionais (Render define BASE_URL automaticamente)
BASE_URL=https://seu-servico.onrender.com
```

**IMPORTANTE:** A variável `PORT` é definida automaticamente pelo Render - **NÃO adicione manualmente!**

### 4. **Build & Deploy**

- Clique em "Create Web Service"
- Render fará o build automaticamente (pode levar 5-10 minutos)
- Aguarde o build de `@tensorflow/tfjs-node` (mais demorado)

### 5. **URLs Disponíveis Após Deploy**

Substitua `seu-servico` pelo nome do seu app:

```
✅ Health Check:    https://seu-servico.onrender.com/health
✅ API Status:      https://seu-servico.onrender.com/api/status
✅ Swagger UI:      https://seu-servico.onrender.com/api/docs
✅ Swagger JSON:    https://seu-servico.onrender.com/api/docs.json
✅ SSE Stream:      https://seu-servico.onrender.com/api/stream/events
✅ WebSocket App:   wss://seu-servico.onrender.com/ws
✅ WebSocket ESP32: wss://seu-servico.onrender.com/esp32
```

---

## 📱 Conectar App Mobile ao Render

No seu app React Native, use:

```javascript
// HTTP API
const API_URL = "https://seu-servico.onrender.com";

// WebSocket
const WS_URL = "wss://seu-servico.onrender.com/ws";

// SSE (Server-Sent Events)
const SSE_URL = "https://seu-servico.onrender.com/api/stream/events";
```

---

## 🔧 Conectar ESP32-PAI ao Render

Atualize o firmware do ESP32-PAI:

```cpp
// Trocar de:
const char* wsServer = "192.168.100.11";
const int wsPort = 8081;

// Para:
const char* wsServer = "seu-servico.onrender.com";
const int wsPort = 443;  // HTTPS/WSS porta 443
const char* wsPath = "/esp32";
const bool useSSL = true;  // Obrigatório no Render
```

**Atenção:** Render usa HTTPS/WSS - você precisará incluir suporte SSL no ESP32:

```cpp
#include <WiFiClientSecure.h>

WiFiClientSecure client;
client.setInsecure();  // Para desenvolvimento (desabilita validação SSL)
```

---

## 🎯 Resposta à Pergunta Original

> **"Se eu subir no Render, o Swagger vai funcionar em qualquer endpoint que ele me der?"**

✅ **SIM!** Agora funciona perfeitamente porque:

1. ✅ A porta é dinâmica (`process.env.PORT`)
2. ✅ O Swagger usa `BASE_URL` configurável
3. ✅ WebSockets estão no mesmo servidor HTTP
4. ✅ Todas as URLs são relativas ou configuráveis

### **URLs que funcionarão no Render:**

```
Swagger UI:  https://seu-app.onrender.com/api/docs     ← FUNCIONA! ✅
Swagger API: https://seu-app.onrender.com/api/docs.json ← FUNCIONA! ✅
Todas APIs:  https://seu-app.onrender.com/api/*        ← FUNCIONA! ✅
WebSockets:  wss://seu-app.onrender.com/ws             ← FUNCIONA! ✅
SSE Stream:  https://seu-app.onrender.com/api/stream/* ← FUNCIONA! ✅
```

---

## ⚠️ Limitações do Plano Free do Render

- ⏱️ **Inatividade:** Serviço "dorme" após 15 min sem uso (primeiro acesso demora ~30s)
- 💾 **RAM:** 512MB (suficiente para TensorFlow.js)
- ⏰ **Tempo:** 750h/mês de uptime (suficiente)
- 🔄 **Build:** ~5-10 min (rebuild do TensorFlow nativo)

---

## 🐛 Troubleshooting

### Build falha com "Cannot find package-lock.json"

```bash
# Regenerar lockfile localmente
cd back-end
rm -f package-lock.json
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### WebSocket não conecta

- Verifique se está usando `wss://` (não `ws://`)
- Confirme que o path está correto: `/ws` ou `/esp32`

### Swagger mostra URLs erradas

- Configure `BASE_URL` nas variáveis de ambiente do Render
- Ou deixe vazio - o Swagger usará a origem atual

### ESP32 não conecta

- Render está na internet pública - ESP32 precisa de internet
- Use `wss://` com SSL/TLS (porta 443)
- Considere usar ngrok/cloudflare tunnel para desenvolvimento local

---

## 📊 Monitoramento

No dashboard do Render:

- **Logs:** Ver output em tempo real
- **Metrics:** CPU, RAM, requests/s
- **Events:** Deploy history
- **Shell:** Acessar container via SSH

---

## 🎉 Próximos Passos

1. ✅ Faça o deploy no Render
2. ✅ Teste o Swagger em `https://seu-app.onrender.com/api/docs`
3. ✅ Configure BASE_URL se quiser URLs explícitas
4. ✅ Atualize o app mobile com as novas URLs
5. ✅ Configure ESP32-PAI com WSS (SSL)

---

**Boa sorte com o deploy! 🚀**

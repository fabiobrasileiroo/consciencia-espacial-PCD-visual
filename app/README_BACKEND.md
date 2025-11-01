# 🖥️ Backend - Servidor de Visão

Servidor Node.js que recebe detecções de objetos do ESP32-CAM e distribui para apps mobile via WebSocket.

## 📦 Instalação

### 1. Instalar Node.js

Certifique-se de ter Node.js 14+ instalado:

```bash
node --version  # Deve retornar v14.0.0 ou superior
```

Se não tiver, instale em: https://nodejs.org/

### 2. Instalar Dependências

```bash
cd app
cp backend-package.json package-backend.json
npm install express ws cors --prefix backend/
```

Ou manualmente:

```bash
npm install express@^4.18.2 ws@^8.14.2 cors@^2.8.5
```

### 3. Iniciar Servidor

```bash
node server-vision.js
```

Ou com auto-reload (desenvolvimento):

```bash
npm install -g nodemon
nodemon server-vision.js
```

## 🚀 Usando o Servidor

### Servidor iniciado com sucesso

Você verá:

```
╔══════════════════════════════════════════╗
║  👁️  SERVIDOR DE VISÃO PARA PCD        ║
╚══════════════════════════════════════════╝

🌐 HTTP Server: http://localhost:3000
🔌 WebSocket: ws://localhost:8080

📋 Endpoints disponíveis:
   POST   http://localhost:3000/api/vision
   GET    http://localhost:3000/api/status
   GET    http://localhost:3000/api/history
   DELETE http://localhost:3000/api/history

✅ Servidor pronto para receber detecções!
```

## 🔌 Endpoints

### POST /api/vision

Recebe detecções do ESP32-CAM.

**Request:**
```json
{
  "timestamp": 12345678,
  "description": "Detectado 1 objeto: pessoa (95%). ao centro",
  "confidence": 0.95,
  "deviceId": "EC:64:C9:7C:38:30"
}
```

**Response:**
```json
{
  "success": true,
  "clientsNotified": 2,
  "detectionId": 1703847291234
}
```

### GET /api/status

Verifica status do servidor.

**Response:**
```json
{
  "status": "online",
  "uptime": 3600.5,
  "totalDetections": 142,
  "connectedClients": 2,
  "lastDetection": {
    "description": "Detectado 1 objeto: pessoa (95%)",
    "timestamp": 1703847291234
  }
}
```

### GET /api/history?limit=50

Retorna histórico de detecções.

**Response:**
```json
{
  "total": 142,
  "detections": [
    {
      "id": 1703847291234,
      "timestamp": 1703847291234,
      "description": "Detectado 1 objeto: pessoa (95%)",
      "confidence": 0.95,
      "deviceId": "EC:64:C9:7C:38:30",
      "receivedAt": "2024-12-29T14:21:31.234Z"
    }
  ]
}
```

### DELETE /api/history

Limpa histórico de detecções.

**Response:**
```json
{
  "success": true,
  "cleared": 142
}
```

## 🔌 WebSocket

Cliente pode conectar em `ws://localhost:8080` para receber detecções em tempo real.

### Mensagem ao conectar (histórico)

```json
{
  "type": "history",
  "data": [
    { "description": "...", "timestamp": 123 }
  ]
}
```

### Mensagem de nova detecção

```json
{
  "type": "vision",
  "data": {
    "id": 1703847291234,
    "description": "Detectado 1 objeto: pessoa (95%). ao centro",
    "confidence": 0.95,
    "deviceId": "EC:64:C9:7C:38:30",
    "timestamp": 1703847291234
  }
}
```

## 🧪 Testando

### Teste 1: Status do servidor

```bash
curl http://localhost:3000/api/status
```

### Teste 2: Enviar detecção simulada

```bash
curl -X POST http://localhost:3000/api/vision \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": 12345678,
    "description": "Detectado 1 objeto: pessoa (95%). ao centro",
    "confidence": 0.95,
    "deviceId": "ESP32-TEST"
  }'
```

### Teste 3: Verificar histórico

```bash
curl http://localhost:3000/api/history?limit=10
```

### Teste 4: WebSocket (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('✅ Conectado ao servidor');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📨 Recebido:', data);
  
  if (data.type === 'vision') {
    // Tocar áudio com descrição
    speak(data.data.description);
  }
};
```

## 🔧 Configuração do ESP32

No arquivo `firmware/module2-camera/src/main.cpp`, configure:

```cpp
const char* serverUrl = "http://SEU_IP:3000/api/vision";
```

**Exemplo com IP local:**
```cpp
const char* serverUrl = "http://192.168.1.100:3000/api/vision";
```

Para descobrir seu IP:

**Linux/Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig | findstr IPv4
```

## 🌐 Deploy em Produção

### Opção 1: Servidor Local (LAN)

Já funciona! Basta usar o IP local da máquina.

### Opção 2: Heroku

```bash
# 1. Criar app
heroku create pcd-vision-server

# 2. Deploy
git push heroku main

# 3. Verificar logs
heroku logs --tail
```

### Opção 3: Render.com

1. Criar conta em render.com
2. Conectar repositório GitHub
3. Configurar como Web Service
4. Start command: `node server-vision.js`

### Opção 4: VPS (DigitalOcean, AWS, etc)

```bash
# 1. Instalar Node.js no servidor
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clonar projeto
git clone https://github.com/seu-repo/projeto.git
cd projeto/app

# 3. Instalar dependências
npm install express ws cors

# 4. Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# 5. Iniciar servidor
pm2 start server-vision.js --name pcd-vision

# 6. Auto-start ao reiniciar
pm2 startup
pm2 save
```

## 🔒 Segurança (Produção)

### 1. Adicionar autenticação

```javascript
const API_KEY = 'sua-chave-secreta';

app.post('/api/vision', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  // ... resto do código
});
```

No ESP32:
```cpp
http.addHeader("X-API-Key", "sua-chave-secreta");
```

### 2. Rate limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100 // 100 requests por minuto
});

app.use('/api/', limiter);
```

### 3. HTTPS (SSL)

Use Let's Encrypt ou Cloudflare para obter certificado SSL gratuito.

## 📊 Logs

O servidor exibe logs formatados:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 [EC:64:C9:7C:38:30] Detectado 1 objeto: pessoa (95%). ao centro
⏰ 2024-12-29T14:21:31.234Z
📊 Confiança: 95.0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🐛 Troubleshooting

### Erro: "EADDRINUSE"

Porta já em uso. Mate o processo:

```bash
# Encontrar processo
lsof -ti:3000

# Matar processo
kill -9 $(lsof -ti:3000)
```

Ou mude a porta no código:
```javascript
const PORT = 3001; // Mudar para porta disponível
```

### ESP32 não consegue conectar

1. Verificar se servidor está rodando: `curl http://localhost:3000/health`
2. Verificar firewall
3. Usar IP local (192.168.x.x) ao invés de localhost
4. Verificar se ESP32 e servidor estão na mesma rede

### WebSocket desconectando

Verifique se há firewall bloqueando porta 8080:

```bash
sudo ufw allow 8080
```

## 📚 Recursos

- [Express.js Docs](https://expressjs.com/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Desenvolvido para o projeto PCD Visual - InovaTech 2025**

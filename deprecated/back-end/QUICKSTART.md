# 🚀 Guia Rápido - ESP32-CAM + TensorFlow

## ⚡ Setup Rápido

### 1️⃣ Configurar ESP32-CAM

```cpp
// No arquivo esp32-cam.ino, modifique:
const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";
```

**Upload para ESP32-CAM:**

- Abra no Arduino IDE
- Selecione: Tools > Board > ESP32 > AI Thinker ESP32-CAM
- Conecte com FTDI (TX->RX, RX->TX, GND->GND, 5V->5V)
- Pressione GPIO0 ao fazer upload
- Abra Serial Monitor (115200 baud)
- Copie o IP exibido (ex: `192.168.1.100`)

### 2️⃣ Configurar Servidor Node.js

```javascript
// No arquivo server-vision-cam.js, linha 26:
const ESP32_CAM_CONFIG = {
  ip: "192.168.1.100", // 👈 COLE O IP DO SEU ESP32 AQUI
  streamPort: 81,
  captureInterval: 2000,
  minConfidence: 0.5,
  maxDetectionsPerFrame: 5,
};
```

### 3️⃣ Instalar Dependências

```bash
cd deprecated/back-end
npm install
# Ou se já estiver instalado, apenas rode:
node server-vision-cam.js
```

### 4️⃣ Testar

**Testar ESP32-CAM:**

```bash
# No navegador
http://192.168.1.100

# Ou via curl
curl http://192.168.1.100/status
```

**Iniciar Servidor:**

```bash
node server-vision-cam.js
```

**Saída esperada:**

```
╔══════════════════════════════════════════╗
║  👁️  SERVIDOR DE VISÃO COM ESP32-CAM   ║
╚══════════════════════════════════════════╝

🌐 HTTP Server: http://localhost:3000
🔌 WebSocket: ws://localhost:8080
📡 ESP32-CAM IP: 192.168.1.100
📸 Captura: http://192.168.1.100/capture
⏱️  Intervalo: 2000ms
```

**Testar Conexão:**

```bash
curl http://localhost:3000/api/esp32/test
```

**Capturar Manualmente:**

```bash
curl http://localhost:3000/api/esp32/capture
```

## 📊 Monitoramento

**Ver Status:**

```bash
curl http://localhost:3000/api/status | json_pp
```

**Ver Histórico:**

```bash
curl http://localhost:3000/api/history?limit=10 | json_pp
```

**Logs em Tempo Real:**
O servidor exibirá automaticamente:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Detectados 2 objetos: pessoa (89%), notebook (78%)
⏰ 2025-10-31T19:15:23.456Z
   📦 person: 89.2%
   📦 laptop: 78.5%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔧 Ajustes Rápidos

### Mudar Velocidade de Captura

```bash
curl -X POST http://localhost:3000/api/esp32/config \
  -H "Content-Type: application/json" \
  -d '{"captureInterval": 3000}'
```

### Mudar IP do ESP32

```bash
curl -X POST http://localhost:3000/api/esp32/config \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.200"}'
```

## 📱 Conectar App Mobile

```javascript
const ws = new WebSocket("ws://SEU_IP_DO_SERVIDOR:8080");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "vision") {
    // Nova detecção!
    const text = data.data.description;
    console.log("Falar:", text);
    // Enviar para Text-to-Speech
  }
};
```

## ⚠️ Troubleshooting

**Erro: "Camera capture failed"**

- Reinicie o ESP32-CAM
- Verifique alimentação (precisa de 5V com boa corrente)

**Erro: "ESP32-CAM offline"**

- Ping no ESP32: `ping 192.168.1.100`
- Verifique WiFi
- Verifique IP no código

**Erro: "Canvas installation failed"**

```bash
# Ubuntu/Debian
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Depois reinstale
npm install canvas
```

**Modelo TensorFlow lento?**

- Aumente `captureInterval` para 5000ms
- Reduza resolução no ESP32 para QVGA
- Use `@tensorflow/tfjs-node-gpu` se tiver GPU

## 🎯 Objetos Detectáveis

**Mais comuns:**

- person (pessoa)
- car (carro)
- bicycle (bicicleta)
- dog (cachorro)
- cat (gato)
- bottle (garrafa)
- cup (xícara)
- chair (cadeira)
- laptop (notebook)
- cell phone (celular)
- book (livro)
- clock (relógio)
- bag (bolsa)

Total: 80 classes do COCO dataset

## 🔗 URLs Importantes

- **Servidor**: http://localhost:3000
- **WebSocket**: ws://localhost:8080
- **ESP32-CAM**: http://192.168.1.100
- **Status**: http://localhost:3000/api/status
- **Captura Manual**: http://localhost:3000/api/esp32/capture

## 💡 Dicas

1. **Iluminação**: Ambiente bem iluminado melhora detecção
2. **Distância**: Objeto a 1-3m da câmera funciona melhor
3. **Ângulo**: Câmera na altura dos olhos é ideal
4. **Estabilidade**: Fixe a ESP32-CAM (não na mão)
5. **Performance**: Comece com 2000ms de intervalo

## 📄 Arquivos Principais

- `server-vision-cam.js` - Servidor Node.js com TensorFlow
- `esp32-cam.ino` - Código Arduino para ESP32-CAM
- `README_ESP32_CAM.md` - Documentação completa
- `QUICKSTART.md` - Este arquivo

---

**Pronto!** 🎉 Agora você tem um sistema completo de visão computacional para PCD visual.

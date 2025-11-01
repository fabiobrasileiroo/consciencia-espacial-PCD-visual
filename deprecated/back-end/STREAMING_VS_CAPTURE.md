# 🎬 Guia: Streaming vs Captura - ESP32-CAM

## 📊 Duas Opções Disponíveis

### Opção 1: 📸 MODO CAPTURA (Recomendado para começar)

- Servidor faz requisições HTTP individuais para `/capture`
- ESP32-CAM captura 1 foto por requisição
- **Mais simples e confiável**
- Menor uso de banda
- Melhor para processamento pesado (TensorFlow)

### Opção 2: 📹 MODO STREAMING

- Servidor conecta ao stream MJPEG em `/stream`
- ESP32-CAM envia frames continuamente
- **Mais rápido, mas mais complexo**
- Maior uso de banda
- Melhor para detecção em tempo real

---

## 🚀 Como Usar

### 1️⃣ Configurar o ESP32-CAM

Seu código **JÁ ESTÁ PRONTO!** ✅

O firmware que você tem no `esp-32-cam.ino` já inclui:

- ✅ Servidor HTTP na porta 80
- ✅ Stream MJPEG na porta 81 (`/stream`)
- ✅ Captura individual (`/capture`)
- ✅ Interface web (`/`)

**Apenas faça o upload e anote o IP exibido no Serial Monitor!**

---

### 2️⃣ Escolher o Modo no Servidor Node.js

#### 📸 MODO CAPTURA (arquivo: `server-vision-cam.js`)

```javascript
const ESP32_CAM_CONFIG = {
  ip: "10.178.228.139", // Seu IP
  useStreaming: false, // 👈 CAPTURA
  captureInterval: 2000, // A cada 2 segundos
  minConfidence: 0.5,
  maxDetectionsPerFrame: 5,
};
```

**Iniciar:**

```bash
node server-vision-cam.js
```

#### 📹 MODO STREAMING (arquivo: `server-vision-streaming.js`)

```javascript
const ESP32_CAM_CONFIG = {
  ip: "10.178.228.139", // Seu IP
  useStreaming: true, // 👈 STREAMING
  captureInterval: 2000, // Intervalo entre processamentos
  minConfidence: 0.5,
  maxDetectionsPerFrame: 5,
};
```

**Iniciar:**

```bash
node server-vision-streaming.js
```

---

## 🔄 Mudar de Modo Dinamicamente

Você pode mudar sem reiniciar o servidor (apenas no `server-vision-streaming.js`):

**Ativar STREAMING:**

```bash
curl -X POST http://localhost:3000/api/esp32/config \
  -H "Content-Type: application/json" \
  -d '{"useStreaming": true}'
```

**Desativar STREAMING (usar captura):**

```bash
curl -X POST http://localhost:3000/api/esp32/config \
  -H "Content-Type: application/json" \
  -d '{"useStreaming": false}'
```

---

## 📋 Comparação Detalhada

| Aspecto            | 📸 CAPTURA         | 📹 STREAMING    |
| ------------------ | ------------------ | --------------- |
| **Complexidade**   | ⭐ Simples         | ⭐⭐⭐ Complexo |
| **Confiabilidade** | ⭐⭐⭐ Alta        | ⭐⭐ Média      |
| **Latência**       | ~500ms             | ~200ms          |
| **Uso de Banda**   | 🟢 Baixo           | 🔴 Alto         |
| **CPU (ESP32)**    | 🟢 Baixo           | 🔴 Alto         |
| **CPU (Servidor)** | 🟢 Controlado      | 🔴 Variável     |
| **Bateria**        | 🟢 Economiza       | 🔴 Gasta mais   |
| **Ideal para**     | Detecção periódica | Tempo real      |

---

## 🎯 Qual Escolher?

### Use 📸 CAPTURA se:

- ✅ Primeiro uso / aprendendo
- ✅ Quer estabilidade
- ✅ Processamento a cada 2-5 segundos é OK
- ✅ Quer economizar bateria/banda
- ✅ WiFi não é muito rápido

### Use 📹 STREAMING se:

- ✅ Precisa de baixa latência
- ✅ Detecção em tempo real é crítica
- ✅ WiFi é rápido e estável
- ✅ Tem alimentação constante (não bateria)
- ✅ Já testou e funciona bem

---

## 🔧 Testar o ESP32-CAM

### 1. Via Navegador

```
http://10.178.228.139/
```

Interface web do ESP32-CAM

```
http://10.178.228.139:81/stream
```

Stream MJPEG (verá o vídeo no navegador)

```
http://10.178.228.139/capture
```

Captura uma foto (JPEG)

### 2. Via cURL

**Testar captura:**

```bash
curl http://10.178.228.139/capture --output test.jpg
open test.jpg
```

**Testar status:**

```bash
curl http://10.178.228.139/status
```

**Testar stream (verá dados binários):**

```bash
curl http://10.178.228.139:81/stream | head -c 1000
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to ESP32-CAM"

**Teste básico:**

```bash
ping 10.178.228.139
```

**Ver se a porta está aberta:**

```bash
nc -zv 10.178.228.139 80
nc -zv 10.178.228.139 81
```

### Streaming não funciona / trava

1. **Reduza qualidade no ESP32:**

   ```cpp
   s->set_framesize(s, FRAMESIZE_QVGA);  // Menor resolução
   s->set_quality(s, 15);                 // Menor qualidade
   ```

2. **Aumente intervalo no servidor:**

   ```javascript
   captureInterval: 5000; // 5 segundos
   ```

3. **Teste modo CAPTURA primeiro**

### "Buffer muito grande, limpando..."

Isso é normal no streaming. Significa que frames estão chegando mais rápido que o processamento.

**Solução:**

- Aumente `captureInterval`
- Reduza resolução no ESP32
- Use GPU: `@tensorflow/tfjs-node-gpu`

---

## 💡 Otimização Recomendada

### Setup Inicial (Começar aqui)

```javascript
// server-vision-cam.js
const ESP32_CAM_CONFIG = {
  ip: "10.178.228.139",
  useStreaming: false, // 📸 Captura
  captureInterval: 3000, // 3 segundos
  minConfidence: 0.6, // Mais confiante
  maxDetectionsPerFrame: 3,
};
```

### Depois de Testar (Otimizar)

```javascript
// server-vision-streaming.js
const ESP32_CAM_CONFIG = {
  ip: "10.178.228.139",
  useStreaming: true, // 📹 Streaming
  captureInterval: 2000, // 2 segundos
  minConfidence: 0.5,
  maxDetectionsPerFrame: 5,
};
```

---

## 📊 Logs Esperados

### 📸 Modo CAPTURA

```
📸 Iniciando processamento em modo CAPTURA...
📡 URL: http://10.178.228.139/capture

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Detectados 2 objetos: pessoa (89%), notebook (78%)
⏰ 2025-10-31T19:30:15.123Z
   📦 person: 89.2%
   📦 laptop: 78.5%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 📹 Modo STREAMING

```
📡 Conectando ao stream MJPEG...
🔗 URL: http://10.178.228.139:81/stream
✅ Conectado ao stream!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Detectado: pessoa (92%)
⏰ 2025-10-31T19:30:17.456Z
   📦 person: 92.1%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎬 Arquivos Criados

1. **`server-vision-cam.js`** - Modo CAPTURA (simples)
2. **`server-vision-streaming.js`** - Modo STREAMING + opção de mudar dinamicamente
3. **`esp-32-cam/esp-32-cam.ino`** - Firmware do ESP32 (já pronto!)

---

## ✅ Checklist

- [ ] ESP32-CAM conectado ao WiFi
- [ ] IP anotado (ex: `10.178.228.139`)
- [ ] Testado no navegador: `http://IP/`
- [ ] Testado stream: `http://IP:81/stream`
- [ ] Testado captura: `curl http://IP/capture`
- [ ] IP configurado no servidor Node.js
- [ ] Servidor rodando: `node server-vision-cam.js`
- [ ] Teste de conexão: `curl http://localhost:3000/api/esp32/test`
- [ ] Vendo logs de detecção no console

---

## 🎯 Recomendação Final

**COMECE COM MODO CAPTURA!** 📸

É mais simples, mais confiável e perfeito para aprender. Depois que estiver funcionando bem, você pode experimentar o streaming se precisar de mais velocidade.

```bash
# Rodar modo captura
node server-vision-cam.js

# OU rodar modo streaming
node server-vision-streaming.js
```

Ambos funcionam com o mesmo firmware do ESP32-CAM! 🚀

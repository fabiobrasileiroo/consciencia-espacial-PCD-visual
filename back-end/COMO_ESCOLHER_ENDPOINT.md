# 🎯 Como Escolher Entre /capture e /stream

## 📡 Diferenças Entre os Endpoints

### 📸 `/capture` (Padrão - RECOMENDADO)

- **O que faz:** Captura uma foto única a cada requisição
- **Quando usar:** Detecção de objetos com análise TensorFlow
- **Vantagens:**
  - ✅ Melhor para processar com IA (menos consumo)
  - ✅ Controle preciso do intervalo
  - ✅ Menor uso de CPU/RAM
  - ✅ Imagens de melhor qualidade
  - ✅ Mais estável para TensorFlow
- **Desvantagens:**
  - ❌ Não é vídeo em tempo real
  - ❌ FPS limitado pelo intervalo

### 📹 `/stream` (Experimental)

- **O que faz:** Stream MJPEG contínuo (vídeo)
- **Quando usar:** Visualização em tempo real sem processamento
- **Vantagens:**
  - ✅ Vídeo fluido e contínuo
  - ✅ Melhor para monitoramento visual
  - ✅ FPS mais alto
- **Desvantagens:**
  - ❌ Alto consumo de banda/CPU
  - ❌ Mais pesado para TensorFlow processar
  - ❌ Pode sobrecarregar o ESP32
  - ❌ Instável com detecção IA

---

## 🔧 Como Configurar

### Método 1: Arquivo de Configuração (Recomendado)

Edite o arquivo `server-vision-streaming.js` na linha ~27:

```javascript
const ESP32_CAM_CONFIG = {
  ip: "192.168.100.56",
  port: 81,
  endpoint: "capture", // 👈 MUDE AQUI: 'capture' ou 'stream'
  useStreaming: false, // false = captura, true = streaming
  captureInterval: 2000, // Intervalo em ms
  minConfidence: 0.5,
  maxDetectionsPerFrame: 5,
  streamTimeout: 10000,
  debug: true,
};
```

### Método 2: Via API (Dinâmico)

Mude em tempo de execução:

```bash
curl -X POST http://localhost:3000/api/esp32/config \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "stream",
    "useStreaming": true,
    "captureInterval": 1000
  }'
```

---

## 🎯 Casos de Uso

### 🤖 Para Detecção com IA (TensorFlow)

```javascript
const ESP32_CAM_CONFIG = {
  endpoint: "capture", // ✅ Use capture
  useStreaming: false, // ✅ Modo captura
  captureInterval: 2000, // ✅ 2 segundos (ajustável)
  minConfidence: 0.6, // ✅ 60% confiança
  debug: true,
};
```

**Melhor para:**

- 🎯 Detecção de objetos
- 👤 Reconhecimento de pessoas
- 🚗 Contagem de veículos
- 📦 Identificação de produtos
- 🐕 Detecção de animais

### 📹 Para Monitoramento Visual

```javascript
const ESP32_CAM_CONFIG = {
  endpoint: "stream", // ✅ Use stream
  useStreaming: true, // ✅ Modo streaming
  captureInterval: 500, // ⚠️ Menor intervalo (mais FPS)
  minConfidence: 0.5,
  debug: false, // ⚠️ Menos logs
};
```

**Melhor para:**

- 👀 Visualização ao vivo
- 🎥 Gravação de vídeo
- 🔴 Transmissão em tempo real
- 📺 Dashboard de monitoramento

---

## 📊 Comparação de Performance

| Métrica          | `/capture`         | `/stream`         |
| ---------------- | ------------------ | ----------------- |
| **FPS**          | 0.5-2 FPS          | 5-15 FPS          |
| **Latência**     | Média (500-1500ms) | Baixa (100-300ms) |
| **CPU**          | 30-50%             | 60-90%            |
| **RAM**          | 300-500MB          | 500-800MB         |
| **Banda**        | Baixa (~100KB/s)   | Alta (~500KB/s)   |
| **Qualidade IA** | ⭐⭐⭐⭐⭐         | ⭐⭐⭐            |
| **Estabilidade** | ⭐⭐⭐⭐⭐         | ⭐⭐⭐            |

---

## 🚀 Testando Cada Modo

### Teste 1: Modo Captura (Padrão)

1. Configure:

```javascript
endpoint: 'capture',
useStreaming: false,
captureInterval: 2000
```

2. Inicie o servidor:

```bash
cd deprecated/back-end
node server-vision-streaming.js
```

3. Aguarde ver:

```
📍 Endpoint ESP32: /capture 📸
🎬 Modo: 📸 CAPTURA
```

4. Teste a API:

```bash
# Ver dados JSON
curl http://localhost:3000/api/esp32/capture

# Baixar imagem com detecções
curl http://localhost:3000/api/esp32/capture-image --output teste.jpg
```

5. Veja os logs:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DETECÇÃO TENSORFLOW - Frame #1
📝 Descrição: Detectados 2 objetos: pessoa (87%), cadeira (76%)
📦 Objetos detectados (2):
   1. person (pessoa): 87.3%
      📍 BBox: [100, 150, 200, 300]
   2. chair (cadeira): 76.1%
      📍 BBox: [350, 200, 150, 180]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Teste 2: Modo Stream (Experimental)

1. Configure:

```javascript
endpoint: 'stream',
useStreaming: true,
captureInterval: 1000  // Mais rápido
```

2. Reinicie o servidor

3. Aguarde ver:

```
📍 Endpoint ESP32: /stream 📹
🎬 Modo: 📹 STREAMING
📡 Conectando ao stream MJPEG...
```

4. Abra no navegador:

```
http://localhost:3000/viewer
```

---

## ⚙️ Configurações Recomendadas

### Para ESP32-CAM em Produção

```javascript
const ESP32_CAM_CONFIG = {
  ip: "192.168.100.56",
  port: 81,
  endpoint: "capture", // Estável
  useStreaming: false,
  captureInterval: 3000, // 3 segundos
  minConfidence: 0.65, // 65% confiança
  maxDetectionsPerFrame: 3, // Máximo 3 objetos
  debug: false, // Menos logs
};
```

### Para Desenvolvimento/Testes

```javascript
const ESP32_CAM_CONFIG = {
  ip: "192.168.100.56",
  port: 81,
  endpoint: "capture",
  useStreaming: false,
  captureInterval: 2000, // 2 segundos
  minConfidence: 0.5, // 50% confiança
  maxDetectionsPerFrame: 5,
  debug: true, // Logs detalhados
};
```

### Para Alta Frequência (Experimental)

```javascript
const ESP32_CAM_CONFIG = {
  ip: "192.168.100.56",
  port: 81,
  endpoint: "capture",
  useStreaming: false,
  captureInterval: 1000, // 1 segundo
  minConfidence: 0.7, // 70% confiança (evitar falsos positivos)
  maxDetectionsPerFrame: 3,
  debug: false,
};
```

---

## 🐛 Troubleshooting

### Problema: "Nothing matches the given URI /stream"

**Causa:** O ESP32 não tem o handler `/stream` registrado ou está na porta errada.

**Solução:**

1. Verifique se o ESP32 está configurado:

```cpp
httpd_uri_t stream_uri = {
    .uri = "/stream",
    .method = HTTP_GET,
    .handler = stream_handler,
    .user_ctx = NULL
};
httpd_register_uri_handler(camera_httpd, &stream_uri);
```

2. Teste direto no navegador:

```
http://192.168.100.56:81/stream
```

3. Se não funcionar, use `/capture`:

```javascript
endpoint: "capture";
```

### Problema: TensorFlow não retorna detecções

**Sintomas:**

```
📸 Frame #1: Nenhum objeto detectado
📸 Frame #2: Nenhum objeto detectado
```

**Soluções:**

1. **Reduzir confiança mínima:**

```javascript
minConfidence: 0.3,  // Mais sensível
```

2. **Aumentar debug:**

```javascript
debug: true;
```

3. **Verificar se o modelo carregou:**

```
✅ Modelo COCO-SSD carregado com sucesso!
```

4. **Testar com imagem conhecida:**

```bash
# Coloque uma pessoa na frente da câmera
curl http://localhost:3000/api/esp32/capture
```

### Problema: Alto consumo de CPU

**Causa:** Intervalo muito curto ou modo streaming.

**Solução:**

```javascript
captureInterval: 5000,     // Aumentar para 5 segundos
useStreaming: false,       // Usar captura
maxDetectionsPerFrame: 2,  // Reduzir máximo
```

---

## 📝 Resumo

✅ **Use `/capture`** para:

- Detecção de objetos com IA
- Economia de recursos
- Estabilidade

✅ **Use `/stream`** para:

- Visualização em tempo real
- FPS mais alto
- Monitoramento visual

**Recomendação final:** Use **`/capture`** para 99% dos casos com TensorFlow! 🎯

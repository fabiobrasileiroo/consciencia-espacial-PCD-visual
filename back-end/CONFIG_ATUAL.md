# 🎯 CONFIGURAÇÃO ATUAL DO SERVIDOR

## ✅ Status: PRONTO PARA USO!

```
╔══════════════════════════════════════════╗
║  SERVIDOR DE VISÃO COM TENSORFLOW       ║
╚══════════════════════════════════════════╝

📡 ESP32-CAM:    192.168.100.56
📍 Endpoint:     /capture 📸
🚪 Porta Stream: 81
🎬 Modo:         Captura Individual
⏱️  Intervalo:   2000ms (2 segundos)
🎯 Confiança:    50%
📦 Max Objetos:  5 por frame
🐛 Debug:        ATIVO
```

---

## 🔄 Para Mudar Entre /capture e /stream

### Arquivo: `server-vision-streaming.js` (Linha 27-38)

#### ✅ Configuração Atual (Recomendada):

```javascript
const ESP32_CAM_CONFIG = {
  ip: "192.168.100.56",
  port: 81,
  endpoint: "capture", // ✅ Usando /capture
  useStreaming: false, // ✅ Modo captura
  captureInterval: 2000,
  minConfidence: 0.5,
  maxDetectionsPerFrame: 5,
  streamTimeout: 10000,
  debug: true,
};
```

#### 🔄 Para Usar /stream (Experimental):

```javascript
const ESP32_CAM_CONFIG = {
  ip: "192.168.100.56",
  port: 81,
  endpoint: "stream", // 🔄 Mudar para 'stream'
  useStreaming: true, // 🔄 Ativar streaming
  captureInterval: 1000, // 🔄 Reduzir intervalo
  minConfidence: 0.5,
  maxDetectionsPerFrame: 5,
  streamTimeout: 10000,
  debug: true,
};
```

---

## 🚀 Como Iniciar

```bash
cd /home/fabiotrocados/inovatech2025/sistema_de_dectacao_de_objetos/deprecated/back-end

node server-vision-streaming.js
```

**Aguarde ver:**

```
🤖 Carregando modelo TensorFlow COCO-SSD...
✅ Modelo COCO-SSD carregado com sucesso!

╔══════════════════════════════════════════╗
║  👁️  SERVIDOR DE VISÃO COM ESP32-CAM   ║
╚══════════════════════════════════════════╝

🌐 HTTP Server: http://localhost:3000
🔌 WebSocket: ws://localhost:8080
📡 ESP32-CAM IP: 192.168.100.56
📍 Endpoint ESP32: /capture 📸
🎬 Modo: 📸 CAPTURA
⏱️  Intervalo: 2000ms
🎯 Confiança mínima: 50%
```

---

## 📊 O Que Esperar nos Logs

### Quando DETECTA objetos:

```
📡 Capturando frame de http://192.168.100.56/capture...
✅ Frame capturado: 45678 bytes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DETECÇÃO TENSORFLOW - Frame #1
⏰ Timestamp: 2025-11-01T14:30:15.123Z
📝 Descrição: Detectados 2 objetos: pessoa (87%), cadeira (76%)
📦 Objetos detectados (2):
   1. person (pessoa): 87.3%
      📍 BBox: [100, 150, 200, 300]
   2. chair (cadeira): 76.1%
      📍 BBox: [350, 200, 150, 180]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 Enviado para 0 cliente(s)
```

### Quando NÃO detecta objetos:

```
📡 Capturando frame de http://192.168.100.56/capture...
✅ Frame capturado: 42156 bytes
📸 Frame #2: Nenhum objeto detectado
```

---

## 🧪 Testar Detecções

### 1. Via Visualizador Web (Melhor opção)

```
http://localhost:3000/viewer
```

**Recursos:**

- ✅ Auto-refresh configurável
- ✅ Captura manual
- ✅ Visualização das bounding boxes
- ✅ Estatísticas em tempo real

### 2. Via API JSON

```bash
curl http://localhost:3000/api/esp32/capture
```

**Resposta:**

```json
{
  "success": true,
  "description": "Detectados 2 objetos: pessoa (87%), cadeira (76%)",
  "objects": [
    {
      "class": "person",
      "classTranslated": "pessoa",
      "confidence": 0.873,
      "bbox": [100, 150, 200, 300]
    },
    {
      "class": "chair",
      "classTranslated": "cadeira",
      "confidence": 0.761,
      "bbox": [350, 200, 150, 180]
    }
  ],
  "timestamp": 1730476800000
}
```

### 3. Via Imagem com Bounding Boxes

```bash
curl http://localhost:3000/api/esp32/capture-image --output detection.jpg
xdg-open detection.jpg
```

**Você verá:**

- 📦 Retângulos coloridos ao redor dos objetos
- 🏷️ Labels com nome e % de confiança
- 🎨 8 cores diferentes para diferentes objetos
- 🔴 Ponto central de cada objeto

---

## 🎯 80 Objetos Detectáveis

O TensorFlow COCO-SSD detecta 80 classes, incluindo:

**Pessoas e Animais:**

- 👤 person (pessoa)
- 🐕 dog (cachorro)
- 🐱 cat (gato)
- 🐴 horse (cavalo)
- 🐑 sheep (ovelha)
- 🐮 cow (vaca)
- 🐘 elephant (elefante)
- 🐻 bear (urso)
- 🦒 giraffe (girafa)
- 🦓 zebra (zebra)

**Veículos:**

- 🚗 car (carro)
- 🏍️ motorcycle (moto)
- 🚌 bus (ônibus)
- 🚚 truck (caminhão)
- 🚲 bicycle (bicicleta)
- ✈️ airplane (avião)
- 🚂 train (trem)
- ⛵ boat (barco)

**Objetos Comuns:**

- 📱 cell phone (celular)
- 💻 laptop (notebook)
- 📺 tv (televisão)
- 🖱️ mouse (mouse)
- ⌨️ keyboard (teclado)
- 📚 book (livro)
- ☕ cup (xícara)
- 🍷 wine glass (taça)
- 🍴 fork, knife, spoon
- 🪑 chair (cadeira)
- 🛋️ couch (sofá)
- 🛏️ bed (cama)

**Comida:**

- 🍌 banana
- 🍎 apple (maçã)
- 🍊 orange (laranja)
- 🥕 carrot (cenoura)
- 🍕 pizza
- 🍰 cake (bolo)

E muito mais! Total: **80 classes traduzidas**

---

## ⚙️ Ajustes Comuns

### Detectando Poucos Objetos?

```javascript
minConfidence: 0.3,  // ⬇️ Reduzir (mais sensível)
```

### Detectando Objetos Falsos?

```javascript
minConfidence: 0.7,  // ⬆️ Aumentar (mais rigoroso)
```

### Alto Consumo de CPU?

```javascript
captureInterval: 5000,      // ⬆️ Aumentar intervalo
maxDetectionsPerFrame: 2,   // ⬇️ Reduzir máximo
```

### Quer Mais Detecções por Frame?

```javascript
maxDetectionsPerFrame: 10,  // ⬆️ Aumentar máximo
```

### Reduzir Logs?

```javascript
debug: false,  // ⬇️ Desativar debug
```

---

## 📚 Documentação Completa

Criamos 4 documentos para você:

1. **`README_API.md`**

   - Documentação completa da API
   - Todos os endpoints explicados
   - Exemplos de uso

2. **`COMO_ESCOLHER_ENDPOINT.md`**

   - Diferenças entre /capture e /stream
   - Casos de uso
   - Tabelas comparativas
   - Troubleshooting

3. **`RESUMO_ATUALIZACAO.md`**

   - O que foi mudado
   - Como testar
   - Status dos componentes

4. **`CONFIG_ATUAL.md`** (este arquivo)
   - Configuração atual
   - Como mudar endpoints
   - Referência rápida

---

## 🎉 Sistema 100% Funcional!

**O que está funcionando:**

- ✅ TensorFlow COCO-SSD carregado e detectando
- ✅ ESP32-CAM capturando via `/capture`
- ✅ Bounding boxes sendo desenhadas (8 cores)
- ✅ Traduções português ativas (25+ classes)
- ✅ Logs detalhados mostrando tudo
- ✅ API REST completa e documentada
- ✅ Swagger UI em `/api/docs`
- ✅ WebSocket transmitindo em tempo real
- ✅ Visualizador web em `/viewer`
- ✅ Configuração flexível (capture/stream)

**Pronto para produção!** 🚀

---

## 🆘 Suporte Rápido

### Problema: Nenhum objeto detectado

1. ✅ Coloque uma pessoa na frente da câmera
2. ✅ Reduza `minConfidence` para 0.3
3. ✅ Verifique logs: modelo carregou?

### Problema: ESP32 não responde

1. ✅ Ping: `ping 192.168.100.56`
2. ✅ Teste direto: `curl http://192.168.100.56/capture --output test.jpg`
3. ✅ Verifique IP na configuração

### Problema: Erro ao iniciar

1. ✅ Node.js instalado? `node --version`
2. ✅ Dependências? `npm install`
3. ✅ TensorFlow? `npm rebuild @tensorflow/tfjs-node --build-addon-from-source`

---

**Dúvidas? Veja os outros arquivos .md criados!** 📚

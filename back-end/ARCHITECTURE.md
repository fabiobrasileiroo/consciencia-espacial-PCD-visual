# 📊 Arquitetura do Sistema - ESP32-CAM + TensorFlow + App Mobile

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SISTEMA COMPLETO                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  ESP32-CAM   │  ◄── Captura vídeo em tempo real
│  (Hardware)  │      Resolução: 640x480 (VGA)
└──────┬───────┘      Formato: JPEG
       │
       │ ① HTTP GET /capture (a cada 2s)
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SERVIDOR NODE.JS                               │
│  ┌────────────────────────────────────────────────────────┐      │
│  │  📥 Recebe JPEG do ESP32-CAM                          │      │
│  └─────────────────┬──────────────────────────────────────┘      │
│                    │                                              │
│                    ▼                                              │
│  ┌────────────────────────────────────────────────────────┐      │
│  │  🖼️  Converte JPEG → Canvas (usando node-canvas)     │      │
│  └─────────────────┬──────────────────────────────────────┘      │
│                    │                                              │
│                    ▼                                              │
│  ┌────────────────────────────────────────────────────────┐      │
│  │  🧠 TensorFlow.js + COCO-SSD                          │      │
│  │     - Detecta objetos na imagem                        │      │
│  │     - Retorna: [classe, confiança, bbox]              │      │
│  └─────────────────┬──────────────────────────────────────┘      │
│                    │                                              │
│                    ▼                                              │
│  ┌────────────────────────────────────────────────────────┐      │
│  │  🔍 Filtragem                                          │      │
│  │     - Remove detecções < 50% confiança                │      │
│  │     - Limita a 5 objetos por frame                    │      │
│  │     - Verifica mudanças desde última detecção         │      │
│  └─────────────────┬──────────────────────────────────────┘      │
│                    │                                              │
│                    ▼                                              │
│  ┌────────────────────────────────────────────────────────┐      │
│  │  🇧🇷 Tradução para Português                          │      │
│  │     person → pessoa                                    │      │
│  │     car → carro                                        │      │
│  │     laptop → notebook                                  │      │
│  └─────────────────┬──────────────────────────────────────┘      │
│                    │                                              │
│                    ▼                                              │
│  ┌────────────────────────────────────────────────────────┐      │
│  │  📝 Geração de Descrição                              │      │
│  │     "Detectados 2 objetos: pessoa (89%), carro (76%)" │      │
│  └─────────────────┬──────────────────────────────────────┘      │
│                    │                                              │
│                    ▼                                              │
│  ┌────────────────────────────────────────────────────────┐      │
│  │  💾 Salva no Histórico (últimas 100 detecções)        │      │
│  └─────────────────┬──────────────────────────────────────┘      │
│                    │                                              │
│                    ▼                                              │
│  ┌────────────────────────────────────────────────────────┐      │
│  │  📡 WebSocket Broadcast                                │      │
│  │     Envia para TODOS os clientes conectados            │      │
│  └─────────────────┬──────────────────────────────────────┘      │
│                    │                                              │
└────────────────────┼──────────────────────────────────────────────┘
                     │
                     │ ② WebSocket Message
                     │    { type: 'vision', data: {...} }
                     │
                     ▼
        ┌────────────────────────┐
        │   APP MOBILE (React    │
        │   Native / Expo)       │
        ├────────────────────────┤
        │  📱 Recebe descrição   │
        │  🔊 Text-to-Speech     │
        │  📳 Vibração (haptic)  │
        │  📊 Exibe histórico    │
        └────────────────────────┘


## 🎯 Exemplo Prático

### Cenário: Usuário entra em uma sala

**Tempo: T0 (início)**
```

ESP32-CAM → Captura imagem da sala
→ Envia JPEG (23 KB) via HTTP

```

**Tempo: T0 + 100ms**
```

Servidor → Recebe JPEG
→ Converte para Canvas
→ TensorFlow detecta: - person (0.92 confiança) - chair (0.87 confiança) - table (0.76 confiança) - laptop (0.68 confiança)

```

**Tempo: T0 + 300ms**
```

Servidor → Filtra (todos > 0.5)
→ Traduz para português
→ Gera descrição:
"Detectados 4 objetos: pessoa (92%),
cadeira (87%), mesa (76%), notebook (68%)"

```

**Tempo: T0 + 320ms**
```

Servidor → Envia via WebSocket para app

```

**Tempo: T0 + 350ms**
```

App → Recebe mensagem
→ TTS fala: "Detectados 4 objetos..."
→ Vibra feedback
→ Atualiza tela

```

**Tempo: T0 + 2000ms**
```

Loop reinicia → Nova captura...

````

## 📊 Performance

### Tempos Médios

| Etapa | Tempo | Notas |
|-------|-------|-------|
| Captura ESP32 | ~100ms | Depende da resolução |
| Transferência HTTP | ~50ms | Depende da rede WiFi |
| TensorFlow Detecção | ~200ms | Depende da CPU/GPU |
| Processamento Total | ~300-400ms | Por frame |
| Intervalo entre Capturas | 2000ms | Configurável |

### Otimizações Possíveis

**🟢 Baixa Latência (< 1s total)**
```javascript
captureInterval: 1000     // Capturar a cada 1s
minConfidence: 0.6        // Mais restritivo
````

```cpp
config.frame_size = FRAMESIZE_QVGA;  // 320x240 (mais rápido)
config.jpeg_quality = 15;             // Menor qualidade
```

**🟡 Balanceado (2-3s total)**

```javascript
captureInterval: 2000; // Capturar a cada 2s
minConfidence: 0.5; // Moderado
```

```cpp
config.frame_size = FRAMESIZE_VGA;   // 640x480 (recomendado)
config.jpeg_quality = 12;             // Boa qualidade
```

**🔴 Alta Qualidade (> 3s total)**

```javascript
captureInterval: 5000; // Capturar a cada 5s
minConfidence: 0.4; // Menos restritivo
```

```cpp
config.frame_size = FRAMESIZE_SVGA;  // 800x600 (mais lento)
config.jpeg_quality = 10;             // Alta qualidade
```

## 🔌 Comunicação

### 1. ESP32-CAM → Servidor (HTTP)

**Request:**

```http
GET /capture HTTP/1.1
Host: 192.168.1.100
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: image/jpeg
Content-Length: 23456

[JPEG binary data]
```

### 2. Servidor → App (WebSocket)

**Message:**

```json
{
  "type": "vision",
  "data": {
    "id": 1698765432000,
    "timestamp": 1698765432000,
    "description": "Detectados 2 objetos: pessoa (89%), carro (76%)",
    "objects": [
      {
        "class": "person",
        "confidence": 0.89,
        "bbox": [100, 150, 200, 400]
      },
      {
        "class": "car",
        "confidence": 0.76,
        "bbox": [300, 200, 150, 100]
      }
    ],
    "deviceId": "esp32-cam",
    "receivedAt": "2025-10-31T19:23:52.000Z"
  }
}
```

## 🧠 Modelo COCO-SSD

### Classes Detectáveis (80 total)

**Pessoas & Animais (12):**
person, bicycle, car, motorcycle, airplane, bus, train, truck, boat, bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe

**Objetos do Cotidiano (28):**
backpack, umbrella, handbag, tie, suitcase, frisbee, skis, snowboard, sports ball, kite, baseball bat, baseball glove, skateboard, surfboard, tennis racket

**Móveis & Eletrônicos (15):**
bottle, wine glass, cup, fork, knife, spoon, bowl, banana, apple, sandwich, orange, broccoli, carrot, hot dog, pizza, donut, cake

**Móveis (8):**
chair, couch, potted plant, bed, dining table, toilet, tv, laptop, mouse, remote, keyboard, cell phone

**Outros (17):**
microwave, oven, toaster, sink, refrigerator, book, clock, vase, scissors, teddy bear, hair drier, toothbrush

### Acurácia por Categoria

| Categoria        | Acurácia Média | Notas              |
| ---------------- | -------------- | ------------------ |
| Pessoas          | ~95%           | Muito confiável    |
| Veículos         | ~90%           | Bom em externos    |
| Animais          | ~85%           | Depende da espécie |
| Objetos grandes  | ~80%           | (mesa, cadeira)    |
| Objetos pequenos | ~60%           | (caneta, moeda) ❌ |

## 💡 Boas Práticas

### ✅ FAÇA

- Use boa iluminação
- Mantenha objetos a 1-3m da câmera
- Fixe a ESP32-CAM em local estável
- Comece com `captureInterval: 2000`
- Use `minConfidence: 0.5` no início

### ❌ NÃO FAÇA

- Não use em ambientes muito escuros
- Não espere detectar objetos muito pequenos
- Não capture em movimento rápido
- Não use `captureInterval < 1000` sem necessidade
- Não ignore erros de conexão WiFi

## 🔧 Debugging

### Ver logs em tempo real

**Servidor Node.js:**

```bash
node server-vision-cam.js
# Verá: 🎯 Detectados X objetos...
```

**ESP32-CAM (Serial Monitor):**

```
📸 Capturando imagem...
✅ Imagem capturada: 23456 bytes
```

### Testar componentes individualmente

**1. Testar apenas ESP32-CAM:**

```bash
curl http://192.168.1.100/capture --output test.jpg
open test.jpg  # Ver se a imagem está boa
```

**2. Testar apenas TensorFlow:**

```bash
curl http://localhost:3000/api/esp32/capture
# Verá: {"description": "Detectados X objetos..."}
```

**3. Testar WebSocket:**

```bash
# Instalar wscat: npm install -g wscat
wscat -c ws://localhost:8080
# Aguardar mensagens...
```

---

**Sistema completo de visão computacional para acessibilidade!** 🚀👁️

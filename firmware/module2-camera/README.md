# 👁️ Módulo 2 - Câmera com Detecção de Objetos

## 📋 Descrição

Sistema de visão computacional para pessoas com deficiência visual (PCD), capaz de detectar objetos em tempo real e convertê-los em descrições textuais para posterior conversão em áudio (text-to-speech).

## 🎯 Funcionalidades

- ✅ Captura de imagens via ESP32-CAM (OV2640)
- ✅ Detecção de múltiplos objetos simultaneamente
- ✅ Conversão automática para texto descritivo em português
- ✅ Envio de descrições para servidor via HTTP/JSON
- ✅ 80+ categorias de objetos detectáveis (COCO Dataset)
- ✅ Informação de posição espacial (esquerda, centro, direita)
- ✅ Modo offline quando WiFi não disponível

## 🔧 Hardware Necessário

| Componente             | Descrição                   |
| ---------------------- | --------------------------- |
| **ESP32-S3-DevKitM-1** | Microcontrolador com PSRAM  |
| **Câmera OV2640**      | Módulo de câmera compatível |
| **Fonte 5V**           | Mínimo 1A (2A recomendado)  |

## 📊 Objetos Detectáveis

### Pessoas e Animais

- pessoa, cachorro, gato, pássaro, cavalo, vaca, elefante, urso, zebra, girafa

### Veículos

- carro, moto, bicicleta, ônibus, trem, caminhão, avião, barco

### Mobília

- cadeira, sofá, cama, mesa_jantar, vaso_sanitário

### Eletrônicos

- tv, laptop, celular, mouse, teclado, controle_remoto, microondas

### Alimentos

- banana, maçã, laranja, pizza, sanduíche, bolo, donut

### Objetos Pessoais

- mochila, bolsa, mala, guarda-chuva, livro, relógio

_...e mais 50+ categorias!_

## 🚀 Configuração

### 1. Configurar WiFi

Edite em `src/main.cpp`:

```cpp
const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";
```

### 2. Configurar Servidor

```cpp
const char* serverUrl = "http://SEU_SERVIDOR/api/vision";
```

### 3. Compilar e Enviar

```bash
cd firmware/module2-camera
pio run --target upload
pio device monitor
```

## 📡 Formato de Envio (JSON)

```json
{
  "timestamp": 12345678,
  "description": "Detectado 2 objetos: pessoa (95%), cadeira (87%). à esquerda",
  "confidence": 0.9,
  "deviceId": "EC:64:C9:7C:38:30"
}
```

## 🎯 Exemplo de Descrições Geradas

### Cenário 1: Pessoa em frente

```
Detectado 1 objeto: pessoa (95%). ao centro
```

### Cenário 2: Múltiplos objetos

```
Detectado 3 objetos: pessoa (92%), cadeira (87%), mesa_jantar (83%). à esquerda
```

### Cenário 3: Nada detectado

```
Nenhum objeto detectado na cena
```

## ⚙️ Parâmetros Ajustáveis

### Intervalo de Detecção

```cpp
const unsigned long DETECTION_INTERVAL = 2000; // milissegundos
```

- **2000ms (padrão)**: Equilibra performance e bateria
- **1000ms**: Detecção mais rápida, maior consumo
- **5000ms**: Economia de energia

### Resolução da Câmera

```cpp
config.frame_size = FRAMESIZE_QVGA; // 320x240
```

Opções:

- `FRAMESIZE_QQVGA` (160x120) - Mais rápido, menor precisão
- `FRAMESIZE_QVGA` (320x240) - **Recomendado**
- `FRAMESIZE_VGA` (640x480) - Mais lento, maior precisão

### Qualidade JPEG

```cpp
config.jpeg_quality = 12; // 0-63 (menor = melhor)
```

## 🧠 Integração de Modelos ML

### Opção 1: TensorFlow Lite Micro (Local)

```cpp
#include <TensorFlowLite_ESP32.h>
#include "model.h"

// Carregar modelo
tflite::MicroInterpreter* interpreter;
const tflite::Model* model = tflite::GetModel(g_model);
```

### Opção 2: Edge Impulse (Local)

```cpp
#include <edge-impulse-sdk.h>

ei_impulse_result_t result;
run_classifier(&signal, &result, false);
```

### Opção 3: API Externa (Cloud)

- Google Cloud Vision
- AWS Rekognition
- Roboflow Inference
- Azure Computer Vision

## 📊 Performance

| Métrica            | Valor                       |
| ------------------ | --------------------------- |
| **FPS**            | ~0.5 (detecção a cada 2s)   |
| **Latência**       | ~1-2 segundos               |
| **Consumo RAM**    | ~180KB                      |
| **Consumo PSRAM**  | ~2MB                        |
| **Taxa de acerto** | ~85-95% (modelo dependente) |

## 🐛 Troubleshooting

### Erro: "Falha ao capturar frame"

**Causa**: Câmera não inicializada corretamente

**Solução**:

1. Verificar conexão física da câmera
2. Confirmar GPIO correto (veja pinout)
3. Reiniciar ESP32

### Erro: "WiFi não conectado"

**Causa**: Credenciais incorretas ou sinal fraco

**Solução**:

1. Verificar SSID e senha
2. Aproximar do roteador
3. Sistema funciona em modo offline (não envia para servidor)

### Detecções imprecisas

**Causa**: Iluminação ruim ou objetos muito pequenos

**Solução**:

1. Melhorar iluminação do ambiente
2. Aproximar objetos da câmera
3. Aumentar resolução (FRAMESIZE_VGA)

### Erro: "PSRAM não disponível"

**Causa**: Board sem PSRAM ou não habilitado

**Solução**:

1. Confirmar que board é ESP32-S3 com PSRAM
2. Verificar `platformio.ini`:

```ini
build_flags =
    -DBOARD_HAS_PSRAM
```

## 🔗 Integração com Servidor

### Backend Node.js (Exemplo)

```javascript
const express = require("express");
const app = express();

app.post("/api/vision", (req, res) => {
  const { description, timestamp, deviceId } = req.body;

  console.log(`[${deviceId}] ${description}`);

  // Enviar para app mobile via WebSocket
  wss.clients.forEach((client) => {
    client.send(
      JSON.stringify({
        type: "vision",
        text: description,
        timestamp: timestamp,
      })
    );
  });

  res.json({ success: true });
});

app.listen(3000);
```

### App Mobile (Text-to-Speech)

```javascript
// React Native exemplo
import Tts from "react-native-tts";

socket.on("vision", (data) => {
  Tts.speak(data.text, {
    language: "pt-BR",
    rate: 0.8,
  });
});
```

## 📚 Recursos Adicionais

- [TensorFlow Lite Micro para ESP32](https://github.com/tensorflow/tflite-micro)
- [Edge Impulse ESP32 Tutorial](https://docs.edgeimpulse.com/docs/deployment/running-your-impulse-esp32)
- [Eloquent Arduino ML](https://github.com/eloquentarduino/EloquentArduino)
- [COCO Dataset Classes](https://cocodataset.org/#home)

## 📄 Licença

MIT License - Veja arquivo LICENSE na raiz do projeto

## 👥 Contribuição

Contribuições são bem-vindas! Especialmente:

- Modelos ML otimizados para ESP32
- Novos idiomas para descrições
- Melhorias de performance
- Testes com usuários PCD

---

**Desenvolvido com ❤️ para acessibilidade**

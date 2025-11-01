# 🎯 API de Detecções em Tempo Real

## ✨ NOVO Endpoint: `/api/detections/current`

Endpoint **específico para apps** que retorna os objetos detectados AGORA em formato simples para transcrição/narração.

---

## 🚀 Como Usar

### Requisição:

```bash
GET http://localhost:3000/api/detections/current
```

### Resposta (COM objetos):

```json
{
  "detecting": true,
  "count": 2,
  "description": "Detectados 2 objetos: pessoa, cadeira",
  "objects": [
    {
      "name": "pessoa",
      "confidence": 87,
      "position": "centro"
    },
    {
      "name": "cadeira",
      "confidence": 76,
      "position": "direita"
    }
  ],
  "timestamp": "2025-11-01T21:20:09.058Z",
  "secondsAgo": 2
}
```

### Resposta (SEM objetos):

```json
{
  "detecting": false,
  "count": 0,
  "description": "Nenhum objeto detectado no momento",
  "objects": [],
  "timestamp": "2025-11-01T21:25:30.123Z",
  "secondsAgo": null
}
```

---

## 📱 Integração com App

### React Native / JavaScript:

```javascript
// Função para buscar detecções
async function getDetections() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/detections/current"
    );
    const data = await response.json();

    if (data.detecting) {
      // TEM objetos detectados
      console.log("✅", data.description);
      console.log("📦", data.objects);

      // Para transcrição/narração
      speak(data.description);
    } else {
      // NÃO TEM objetos
      console.log("❌ Nenhum objeto detectado");
    }
  } catch (error) {
    console.error("Erro:", error);
  }
}

// Polling a cada 1 segundo
setInterval(getDetections, 1000);
```

### React Native com TTS (Text-to-Speech):

```javascript
import * as Speech from "expo-speech";

async function checkAndSpeak() {
  const response = await fetch(
    "http://192.168.100.11:3000/api/detections/current"
  );
  const data = await response.json();

  if (data.detecting) {
    // Narrar objetos detectados
    Speech.speak(data.description, {
      language: "pt-BR",
      pitch: 1.0,
      rate: 1.0,
    });

    // Detalhar posição
    data.objects.forEach((obj) => {
      const text = `${obj.name} à ${obj.position}, confiança ${obj.confidence} porcento`;
      Speech.speak(text, { language: "pt-BR" });
    });
  }
}

// Atualizar a cada 2 segundos
setInterval(checkAndSpeak, 2000);
```

### Flutter:

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_tts/flutter_tts.dart';

class DetectionService {
  final FlutterTts flutterTts = FlutterTts();

  Future<void> checkDetections() async {
    try {
      final response = await http.get(
        Uri.parse('http://192.168.100.11:3000/api/detections/current')
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['detecting'] == true) {
          // Narrar detecções
          await flutterTts.setLanguage('pt-BR');
          await flutterTts.speak(data['description']);

          print('✅ ${data['count']} objetos detectados');
          print('📦 ${data['objects']}');
        } else {
          print('❌ Nenhum objeto no momento');
        }
      }
    } catch (e) {
      print('Erro: $e');
    }
  }
}

// Usar
void startDetectionLoop() {
  Timer.periodic(Duration(seconds: 2), (timer) {
    DetectionService().checkDetections();
  });
}
```

---

## 🎙️ Exemplo de Narração

### Formato Simples (campo `description`):

```
"Detectado: pessoa"
"Detectados 2 objetos: pessoa, cadeira"
"Nenhum objeto detectado no momento"
```

### Formato Detalhado (com posição):

```javascript
const data = await fetch("/api/detections/current").then((r) => r.json());

if (data.detecting) {
  data.objects.forEach((obj) => {
    const text = `${obj.name} à ${obj.position} com ${obj.confidence}% de certeza`;
    speak(text);
    // Ex: "pessoa à esquerda com 87% de certeza"
  });
}
```

---

## 📊 Campos da Resposta

| Campo                  | Tipo    | Descrição                      | Exemplo                                   |
| ---------------------- | ------- | ------------------------------ | ----------------------------------------- |
| `detecting`            | boolean | Se está detectando algo agora  | `true`                                    |
| `count`                | number  | Quantidade de objetos          | `2`                                       |
| `description`          | string  | Descrição pronta para narração | `"Detectados 2 objetos: pessoa, cadeira"` |
| `objects`              | array   | Lista de objetos com detalhes  | `[...]`                                   |
| `objects[].name`       | string  | Nome em português              | `"pessoa"`                                |
| `objects[].confidence` | number  | Confiança (0-100)              | `87`                                      |
| `objects[].position`   | string  | Posição na imagem              | `"esquerda"` / `"centro"` / `"direita"`   |
| `timestamp`            | string  | Hora da detecção               | `"2025-11-01T21:20:09.058Z"`              |
| `secondsAgo`           | number  | Há quantos segundos            | `2`                                       |

---

## ⚡ Polling vs WebSocket

### Polling (HTTP - Simples):

```javascript
// Consultar a cada 1 segundo
setInterval(async () => {
  const data = await fetch("/api/detections/current").then((r) => r.json());
  updateUI(data);
}, 1000);
```

**Vantagens:**

- ✅ Simples de implementar
- ✅ Funciona em qualquer plataforma
- ✅ Sem bibliotecas extras

**Desvantagens:**

- ❌ Delay de até 1 segundo
- ❌ Mais requisições (menos eficiente)

### WebSocket (Real-Time - Avançado):

```javascript
const ws = new WebSocket("ws://localhost:8080");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "vision") {
    updateUI(data.data);
  }
};
```

**Vantagens:**

- ✅ Instantâneo (0 delay)
- ✅ Mais eficiente
- ✅ Push automático

**Desvantagens:**

- ❌ Mais complexo
- ❌ Precisa manter conexão

---

## 🧪 Testar Agora

### Via curl:

```bash
# Teste 1: Ver resposta atual
curl http://localhost:3000/api/detections/current | jq

# Teste 2: Polling manual (repetir várias vezes)
watch -n 1 'curl -s http://localhost:3000/api/detections/current | jq .description'

# Teste 3: Ver apenas descrição
curl -s http://localhost:3000/api/detections/current | jq -r .description
```

### Via navegador:

```
http://localhost:3000/api/detections/current
```

### Via JavaScript Console (navegador):

```javascript
setInterval(async () => {
  const r = await fetch("http://localhost:3000/api/detections/current");
  const d = await r.json();
  console.log(d.detecting ? `✅ ${d.description}` : "❌ Nenhum objeto");
}, 1000);
```

---

## 📱 Exemplo Completo: App de Narração

```javascript
// app.js - Sistema de narração para PCD visual

const API_URL = "http://192.168.100.11:3000/api/detections/current";
let lastDescription = "";

async function checkAndNarrate() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    // Só narrar se mudou
    if (data.detecting && data.description !== lastDescription) {
      lastDescription = data.description;

      // Vibrar
      if ("vibrate" in navigator) {
        navigator.vibrate(200);
      }

      // Narrar
      speak(data.description);

      // Mostrar na tela
      document.getElementById("status").textContent = data.description;
      document.getElementById("count").textContent = data.count;
      document.getElementById("time").textContent = `há ${data.secondsAgo}s`;

      // Detalhar objetos
      const list = document.getElementById("objects");
      list.innerHTML = data.objects
        .map(
          (obj) => `
        <li>
          ${obj.name} - ${obj.position} - ${obj.confidence}%
        </li>
      `
        )
        .join("");
    } else if (!data.detecting) {
      document.getElementById("status").textContent = "Procurando objetos...";
    }
  } catch (error) {
    console.error("Erro:", error);
    document.getElementById("status").textContent = "Erro de conexão";
  }
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  speechSynthesis.speak(utterance);
}

// Iniciar polling
setInterval(checkAndNarrate, 1500); // A cada 1.5s
checkAndNarrate(); // Primeira verificação imediata
```

---

## 🎯 Use Cases

### 1. App para PCD Visual

- Polling a cada 1-2s
- Narrar objetos detectados
- Vibrar quando detectar algo novo

### 2. Monitor de Segurança

- Alertar quando detectar pessoa
- Registrar horário das detecções

### 3. Contador de Objetos

- Contar quantas pessoas passaram
- Registrar histórico

### 4. Dashboard Real-Time

- Mostrar objetos em tempo real
- Gráficos de detecções

---

## 📚 Documentação Completa

**Swagger:** http://localhost:3000/api/docs

**Busque por:** "Objetos detectados AGORA"

---

## 🎉 Pronto para Usar!

```bash
# Reinicie o servidor
node server-vision-streaming.js

# Teste o novo endpoint
curl http://localhost:3000/api/detections/current | jq
```

**Endpoint perfeito para transcrição em apps! 🎯🗣️**

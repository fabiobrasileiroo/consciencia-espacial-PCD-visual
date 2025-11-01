# 📡 Guia Completo: Server-Sent Events (SSE) - Sistema de Detecção

## 🎯 Visão Geral

Sistema de **streaming em tempo real** usando **Server-Sent Events (SSE)** para transmitir:

- 🎯 Detecções de objetos (TensorFlow COCO-SSD)
- 📊 Status de todos os ESP32s (pai, sensor, motor, câmera)
- 📏 Distância medida (baixo/médio/alto)
- 🔔 Avisos e alertas do sistema
- ⏱️ Tempo de uso (uptime)

### ⭐ Novidade: Sem necessidade de polling!

Agora o SSE envia **automaticamente as detecções atuais a cada 2 segundos** através do evento `current-detection`.

**Antes:** Você precisava fazer `GET /api/detections/current` periodicamente (polling).  
**Agora:** Basta ouvir o evento SSE `current-detection` - **zero requisições HTTP extras!**

```javascript
// ❌ ANTES (polling - ruim)
setInterval(() => {
  fetch("/api/detections/current").then((res) => res.json());
}, 2000);

// ✅ AGORA (SSE - melhor)
eventSource.addEventListener("current-detection", (e) => {
  const data = JSON.parse(e.data);
  // Dados atualizados automaticamente!
});
```

## 🌐 Endpoint SSE

```
GET http://localhost:3000/api/stream/events
```

### Headers

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

---

## 📨 Tipos de Eventos SSE

### 1. **`connected`** - Conexão Estabelecida

Enviado imediatamente ao conectar.

```json
{
  "type": "connected",
  "message": "Conectado ao stream SSE",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### 2. **`detection`** - Nova Detecção (Apenas Mudanças)

Enviado **apenas quando há mudanças** nos objetos detectados.

**Use para:** Narração imediata quando algo novo aparece/desaparece.

```json
{
  "count": 2,
  "description": "Detectados 2 objetos: pessoa, cadeira",
  "objects": [
    {
      "name": "pessoa",
      "confidence": 87,
      "bbox": [120, 80, 200, 350]
    }
  ],
  "timestamp": "2025-01-15T10:30:05.123Z"
}
```

---

### 3. **`current-detection`** - Detecção Atual (A cada 2s) ⭐ RECOMENDADO

Enviado **a cada 2 segundos** com as detecções mais recentes, independente de mudanças.

**Use para:** Atualizar UI continuamente, mostrar objetos em tela, monitoramento constante.

**✅ Substitui:** `GET /api/detections/current` (sem necessidade de polling!)

```json
{
  "detecting": true,
  "count": 2,
  "description": "Detectados 2 objetos: pessoa, cadeira",
  "objects": [
    {
      "name": "pessoa",
      "confidence": 87,
      "position": "centro",
      "bbox": [120, 80, 200, 350]
    }
  ],
  "timestamp": "2025-01-15T10:30:05.123Z",
  "secondsAgo": 2
}
```

**Quando não há detecções:**

```json
{
  "detecting": false,
  "count": 0,
  "description": "Nenhum objeto detectado no momento",
  "objects": [],
  "timestamp": "2025-01-15T10:30:07.000Z",
  "secondsAgo": null
}
```

**Campos adicionais:**

- `detecting`: Boolean indicando se há detecções ativas
- `position`: "esquerda" | "centro" | "direita" (posição do objeto na imagem)
- `secondsAgo`: Há quantos segundos foi detectado

---

### 4. **`esp32-status`** - Status de um ESP32

Enviado quando um ESP32 atualiza seu status.

```json
{
  "module": "sensor",
  "status": {
    "connected": true,
    "lastSeen": "2025-01-15T10:30:10.000Z",
    "distance": 45,
    "level": "médio"
  },
  "timestamp": "2025-01-15T10:30:10.000Z"
}
```

**Módulos:**

- `pai`: ESP32 master (coordenador)
- `sensor`: Módulo de distância ultrassônico
- `motor`: Módulo de vibração háptica
- `camera`: ESP32-CAM

**Níveis de Distância:**

- `livre`: > 100cm
- `baixo`: 50-100cm
- `médio`: 20-50cm
- `alto`: < 20cm (PERIGO)

---

### 4. **`alert`** - Alerta do Sistema

Enviado quando há avisos ou alertas.

```json
{
  "id": 1705315810000,
  "level": "danger",
  "message": "⚠️ PERIGO! Objeto muito próximo: 15cm",
  "timestamp": "2025-01-15T10:30:10.000Z"
}
```

**Níveis:**

- `info`: Informação geral
- `warning`: Aviso (atenção)
- `danger`: Perigo (ação imediata)

---

### 5. **`uptime`** - Tempo de Uso

Enviado a cada 5 segundos.

```json
{
  "uptime": 3665,
  "uptimeFormatted": "1h 1m 5s",
  "timestamp": "2025-01-15T10:30:15.000Z"
}
```

**Campos:**

- `uptime`: Segundos desde que o servidor iniciou
- `uptimeFormatted`: Formato legível (horas, minutos, segundos)
- `timestamp`: Data/hora atual

---

### 6. **`system-status`** - Status Completo do Sistema

Enviado a cada 5 segundos com todos os ESP32s.

```json
{
  "esp32": {
    "pai": { "connected": true, "lastSeen": "2025-01-15T10:30:15.000Z" },
    "sensor": {
      "connected": true,
      "lastSeen": "2025-01-15T10:30:14.500Z",
      "distance": 65,
      "level": "baixo"
    },
    "motor": {
      "connected": true,
      "lastSeen": "2025-01-15T10:30:14.800Z",
      "vibrationLevel": 1
    },
    "camera": { "connected": true, "lastSeen": "2025-01-15T10:30:15.000Z" }
  },
  "alertsCount": 3,
  "connections": {
    "websocket": 2,
    "sse": 1
  }
}
```

---

## 💻 Exemplos de Implementação

### 📱 React Native / Expo

```javascript
import { useEffect, useState } from "react";

export default function App() {
  const [detections, setDetections] = useState([]);
  const [esp32Status, setEsp32Status] = useState({});
  const [uptime, setUptime] = useState("");
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Conectar ao SSE
    const eventSource = new EventSource(
      "http://localhost:3000/api/stream/events"
    );

    // Evento: Conexão estabelecida
    eventSource.addEventListener("connected", (e) => {
      const data = JSON.parse(e.data);
      console.log("✅ Conectado:", data.message);
    });

    // ⭐ NOVO: Detecção atual (a cada 2 segundos) - Substitui polling
    eventSource.addEventListener("current-detection", (e) => {
      const data = JSON.parse(e.data);

      if (data.detecting) {
        setDetections(data.objects);

        // Narrar apenas se for nova detecção (< 3 segundos)
        if (data.secondsAgo < 3 && data.description) {
          // Expo: usar expo-speech
          // Speech.speak(data.description, { language: 'pt-BR' });
          console.log("🗣️ Narração:", data.description);
        }
      } else {
        setDetections([]);
      }
    });

    // Evento: Detecção de objetos (mudanças)
    eventSource.addEventListener("detection", (e) => {
      const data = JSON.parse(e.data);
      console.log("🎯 Nova detecção:", data.description);

      // Narrar imediatamente quando houver mudança
      // Speech.speak(data.description, { language: 'pt-BR' });
    });

    // Evento: Status dos ESP32s
    eventSource.addEventListener("system-status", (e) => {
      const data = JSON.parse(e.data);
      setEsp32Status(data.esp32);
    });

    // Evento: Uptime
    eventSource.addEventListener("uptime", (e) => {
      const data = JSON.parse(e.data);
      setUptime(data.uptimeFormatted);
    });

    // Evento: Alerta
    eventSource.addEventListener("alert", (e) => {
      const data = JSON.parse(e.data);
      setAlerts((prev) => [data, ...prev].slice(0, 10));

      // Vibrar se for perigo
      if (data.level === "danger") {
        // Expo: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    });

    // Erro
    eventSource.onerror = (error) => {
      console.error("❌ Erro SSE:", error);
    };

    // Cleanup
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <View>
      <Text>Uptime: {uptime}</Text>
      <Text>Objetos: {detections.length}</Text>
      <Text>
        Sensor: {esp32Status.sensor?.distance}cm ({esp32Status.sensor?.level})
      </Text>
      {detections.map((obj, idx) => (
        <Text key={idx}>
          {obj.name} - {obj.position} ({obj.confidence}%)
        </Text>
      ))}
      {alerts.map((alert) => (
        <Text key={alert.id}>{alert.message}</Text>
      ))}
    </View>
  );
}
```

---

### 🌐 JavaScript Puro (HTML)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>SSE Real-Time</title>
  </head>
  <body>
    <h1>Sistema de Detecção - Real Time</h1>

    <div id="status">
      <p>Uptime: <span id="uptime">-</span></p>
      <p>Câmera: <span id="camera">-</span></p>
      <p>Sensor: <span id="sensor">-</span></p>
      <p>Motor: <span id="motor">-</span></p>
    </div>

    <div id="detections">
      <h2>Objetos Detectados</h2>
      <ul id="objects-list"></ul>
    </div>

    <div id="alerts">
      <h2>Alertas</h2>
      <ul id="alerts-list"></ul>
    </div>

    <script>
      const eventSource = new EventSource(
        "http://localhost:3000/api/stream/events"
      );

      // Detecções
      eventSource.addEventListener("detection", (e) => {
        const data = JSON.parse(e.data);
        const list = document.getElementById("objects-list");
        list.innerHTML = "";
        data.objects.forEach((obj) => {
          const li = document.createElement("li");
          li.textContent = `${obj.name} (${obj.confidence}%)`;
          list.appendChild(li);
        });
      });

      // Uptime
      eventSource.addEventListener("uptime", (e) => {
        const data = JSON.parse(e.data);
        document.getElementById("uptime").textContent = data.uptimeFormatted;
      });

      // Status ESP32s
      eventSource.addEventListener("system-status", (e) => {
        const data = JSON.parse(e.data);
        document.getElementById("camera").textContent = data.esp32.camera
          .connected
          ? "✅ Online"
          : "❌ Offline";
        document.getElementById(
          "sensor"
        ).textContent = `${data.esp32.sensor.distance}cm (${data.esp32.sensor.level})`;
        document.getElementById(
          "motor"
        ).textContent = `Vibração: ${data.esp32.motor.vibrationLevel}`;
      });

      // Alertas
      eventSource.addEventListener("alert", (e) => {
        const data = JSON.parse(e.data);
        const list = document.getElementById("alerts-list");
        const li = document.createElement("li");
        li.textContent = data.message;
        li.style.color =
          data.level === "danger"
            ? "red"
            : data.level === "warning"
            ? "orange"
            : "blue";
        list.prepend(li);

        // Limitar a 10 alertas
        if (list.children.length > 10) {
          list.removeChild(list.lastChild);
        }
      });

      eventSource.onerror = () => {
        console.error("Erro na conexão SSE");
      };
    </script>
  </body>
</html>
```

---

### 🐍 Python

```python
import sseclient
import requests
import json

def listen_sse():
    url = 'http://localhost:3000/api/stream/events'

    try:
        response = requests.get(url, stream=True)
        client = sseclient.SSEClient(response)

        for event in client.events():
            data = json.loads(event.data)

            if event.event == 'detection':
                print(f"🎯 Detecção: {data['description']}")
                for obj in data['objects']:
                    print(f"  - {obj['name']}: {obj['confidence']}%")

            elif event.event == 'alert':
                print(f"⚠️ ALERTA [{data['level']}]: {data['message']}")

            elif event.event == 'uptime':
                print(f"⏱️ Uptime: {data['uptimeFormatted']}")

            elif event.event == 'system-status':
                sensor = data['esp32']['sensor']
                print(f"📏 Distância: {sensor['distance']}cm ({sensor['level']})")

    except KeyboardInterrupt:
        print("\n👋 Desconectado")

if __name__ == '__main__':
    print("📡 Conectando ao SSE...")
    listen_sse()
```

---

## 🔧 Endpoints Complementares

### 1. **POST /api/esp32/status-update**

ESP32-PAI envia status dos módulos.

```bash
curl -X POST http://localhost:3000/api/esp32/status-update \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "sensor",
    "connected": true,
    "distance": 45
  }'
```

**Parâmetros:**

- `moduleId`: "pai" | "sensor" | "motor" | "camera"
- `connected`: boolean
- `distance`: number (apenas sensor, em cm)
- `vibrationLevel`: 0-3 (apenas motor)

---

### 2. **GET /api/system/status**

Status completo do sistema (snapshot).

```bash
curl http://localhost:3000/api/system/status
```

**Resposta:**

```json
{
  "server": {
    "uptime": 3665,
    "uptimeFormatted": "1h 1m 5s",
    "startTime": "2025-01-15T09:30:00.000Z",
    "currentTime": "2025-01-15T10:31:05.000Z",
    "mode": "capture",
    "captureInterval": 1500
  },
  "tensorflow": {
    "modelLoaded": true,
    "modelName": "COCO-SSD",
    "classes": 80,
    "lastDetectionCount": 2
  },
  "esp32": {
    "pai": { "connected": true, "lastSeen": "..." },
    "sensor": { "connected": true, "distance": 45, "level": "médio", ... },
    "motor": { "connected": true, "vibrationLevel": 1, ... },
    "camera": { "connected": true, ... }
  },
  "alerts": {
    "total": 5,
    "recent": [...]
  },
  "connections": {
    "websocket": 2,
    "sse": 1
  },
  "stats": {
    "totalFramesReceived": 1250,
    "framesProcessed": 845,
    "detectionHistorySize": 100
  }
}
```

---

### 3. **GET /api/alerts**

Lista de alertas.

```bash
curl http://localhost:3000/api/alerts?limit=10
```

---

### 4. **DELETE /api/alerts**

Limpar todos os alertas.

```bash
curl -X DELETE http://localhost:3000/api/alerts
```

---

## 🔥 Recursos do SSE

### ✅ Vantagens

- **One-way streaming**: Servidor → Cliente (ideal para notificações)
- **Reconexão automática**: Conexão perdida? Reconecta sozinho
- **Event IDs**: Suporte nativo para sincronização
- **Texto simples**: Fácil de debugar (text/event-stream)
- **HTTP/1.1**: Não precisa de WebSocket

### ⚠️ Limitações

- **Unidirecional**: Cliente não pode enviar dados pelo SSE
- **6 conexões máximas**: Por domínio no navegador (HTTP/1.1)
- **Sem binário**: Apenas texto (JSON)

---

## 🚀 Como Usar

### 1. **Iniciar o Servidor**

```bash
cd deprecated/back-end
node server-vision-streaming.js
```

### 2. **Testar SSE no Navegador**

```bash
curl -N http://localhost:3000/api/stream/events
```

### 3. **Integrar no App**

- Use `EventSource` (JavaScript)
- Use `react-native-sse` ou `EventSource` polyfill (React Native)
- Use `sseclient` (Python)

---

## 📊 Fluxo de Dados

```
ESP32-CAM → Captura Frame (1.5s)
     ↓
TensorFlow → Detecta Objetos
     ↓
SSE Broadcast → detection
     ↓
App Recebe → Narra Objetos
```

```
ESP32-PAI → POST /api/esp32/status-update
     ↓
Atualiza esp32Status
     ↓
SSE Broadcast → esp32-status
     ↓
App Recebe → Atualiza UI
```

---

## 🐛 Troubleshooting

### Problema: SSE não conecta

**Solução:**

```bash
# Verificar se servidor está rodando
curl http://localhost:3000/health

# Verificar firewall
sudo ufw allow 3000
```

### Problema: Eventos não chegam

**Solução:**

- Verificar se há clientes conectados: `GET /api/system/status`
- Verificar logs do servidor
- Testar com `curl -N` no terminal

### Problema: Conexão cai após alguns segundos

**Solução:**

- SSE tem heartbeat automático (`:heartbeat` a cada 15s)
- Verificar proxy/nginx timeout
- Em produção, aumentar timeout

---

## 📚 Referências

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [SSE vs WebSocket](https://www.ably.io/topic/websocket-vs-sse)

---

## ✅ Checklist de Integração

- [ ] Servidor rodando (`node server-vision-streaming.js`)
- [ ] ESP32-CAM capturando frames
- [ ] TensorFlow detectando objetos
- [ ] SSE endpoint acessível (`/api/stream/events`)
- [ ] App conectado ao SSE
- [ ] Eventos sendo recebidos (detection, uptime, etc)
- [ ] ESP32-PAI enviando status (`POST /api/esp32/status-update`)
- [ ] Alertas sendo gerados e exibidos
- [ ] Text-to-Speech funcionando (narração)

---

**Criado por:** Sistema de Detecção de Objetos - InovaTech 2025  
**Última atualização:** 15/01/2025

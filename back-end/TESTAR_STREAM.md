# 🎥 COMO USAR O STREAM NA PORTA 81

## ✅ Configuração Correta!

O servidor **JÁ ESTÁ CONFIGURADO** para usar a porta 81:

```javascript
// server-vision-streaming.js - Linha 30
port: 81,  // ✅ Porta correta do ESP32-CAM

// Linha 43 - URL gerada automaticamente
stream: `http://192.168.100.56:81/stream`  // ✅ Correto!
```

---

## 🚀 Para Ativar o Stream

### Método 1: Editar Configuração (Recomendado)

Abra `server-vision-streaming.js` e mude **linha 31**:

```javascript
const ESP32_CAM_CONFIG = {
  ip: "192.168.100.56",
  port: 81, // ✅ Já está correto!
  endpoint: "stream", // 👈 MUDE DE 'capture' PARA 'stream'
  useStreaming: true, // 👈 MUDE PARA true
  captureInterval: 1000, // 👈 Reduzir para 1 segundo
  minConfidence: 0.5,
  maxDetectionsPerFrame: 5,
  debug: true,
};
```

Salve e reinicie o servidor.

---

## 🧪 Testar Stream do ESP32

### Teste 1: Verificar se ESP32 responde na porta 81

```bash
curl -I http://192.168.100.56:81/stream
```

**Resposta esperada:**

```
HTTP/1.1 200 OK
Content-Type: multipart/x-mixed-replace; boundary=123456789000000000000987654321
```

### Teste 2: Ver stream no navegador

```
http://192.168.100.56:81/stream
```

**Se funcionar:** Você verá vídeo ao vivo! 🎥

### Teste 3: Verificar porta 81 está ativa

```bash
ping 192.168.100.56
curl -I http://192.168.100.56:81/
```

---

## 🎯 Iniciar Servidor com Stream

### 1. Configure (linha 31-32):

```javascript
endpoint: 'stream',
useStreaming: true,
```

### 2. Inicie o servidor:

```bash
cd /home/fabiotrocados/inovatech2025/sistema_de_dectacao_de_objetos/deprecated/back-end
node server-vision-streaming.js
```

### 3. Veja os logs:

```
📍 Endpoint ESP32: /stream 📹
📡 Conectando ao stream MJPEG...
🔗 URL: http://192.168.100.56:81/stream
✅ Conectado ao stream!
```

### 4. Aguarde detecções:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DETECÇÃO TENSORFLOW - Frame #1
📝 Descrição: Detectados 1 objetos: pessoa (89%)
📦 Objetos detectados (1):
   1. person (pessoa): 89.5%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📊 Diferenças: Capture vs Stream

| Item             | `/capture` (Porta 80)           | `/stream` (Porta 81)              |
| ---------------- | ------------------------------- | --------------------------------- |
| **URL**          | `http://192.168.100.56/capture` | `http://192.168.100.56:81/stream` |
| **Tipo**         | Foto única                      | Vídeo contínuo MJPEG              |
| **FPS**          | 0.5-1 FPS                       | 5-15 FPS                          |
| **Uso**          | ✅ Melhor para IA               | ✅ Melhor para visualização       |
| **CPU**          | 30-50%                          | 60-90%                            |
| **Estabilidade** | ⭐⭐⭐⭐⭐                      | ⭐⭐⭐                            |

---

## ⚡ Configuração Rápida - Stream

### Para ativar Stream AGORA:

```bash
cd /home/fabiotrocados/inovatech2025/sistema_de_dectacao_de_objetos/deprecated/back-end

# Editar arquivo
nano server-vision-streaming.js

# Encontre linha 31-32 e mude para:
#   endpoint: 'stream',
#   useStreaming: true,

# Salvar: Ctrl+O, Enter, Ctrl+X

# Iniciar
node server-vision-streaming.js
```

---

## 🐛 Troubleshooting

### Problema: "Connection refused" na porta 81

**Causa:** ESP32 não iniciou servidor na porta 81.

**Solução:** Verifique o código ESP32:

```cpp
// Deve ter:
config.server_port = 81;
httpd_start(&camera_httpd, &config);

httpd_uri_t stream_uri = {
    .uri = "/stream",
    .method = HTTP_GET,
    .handler = stream_handler,
    .user_ctx = NULL
};
httpd_register_uri_handler(camera_httpd, &stream_uri);
```

### Problema: Stream muito lento

**Solução:** Ajustar qualidade no ESP32 ou aumentar intervalo:

```javascript
captureInterval: 2000,  // Processar menos frames
```

### Problema: Alto consumo CPU

**Solução:** Voltar para `/capture`:

```javascript
endpoint: 'capture',
useStreaming: false,
```

---

## 🎉 URLs Finais

### ESP32-CAM:

- **Captura (porta 80):** `http://192.168.100.56/capture`
- **Stream (porta 81):** `http://192.168.100.56:81/stream` ✅

### Servidor Node.js:

- **API Captura:** `http://localhost:3000/api/esp32/capture`
- **API Imagem:** `http://localhost:3000/api/esp32/capture-image`
- **Visualizador:** `http://localhost:3000/viewer`
- **Swagger:** `http://localhost:3000/api/docs`

---

## 📝 Resumo

1. **Porta 81 já está configurada** ✅
2. **Para ativar stream:** Mude `endpoint: 'stream'` e `useStreaming: true`
3. **Teste primeiro:** `curl -I http://192.168.100.56:81/stream`
4. **Se funcionar:** Reinicie o servidor Node.js
5. **Veja detecções:** Acesse `http://localhost:3000/viewer`

**Porta 81 ativada e pronta para uso!** 🚀

# 🚀 Como Executar o Sistema

## 📷 Webcam do Computador

```bash
cd kaz-image-captioning
python3 launcher.py --source webcam --mode both --auto --interval 3
```

**Explicação:**

- `--source webcam` = Usar câmera do notebook
- `--mode both` = YOLO + Kaz (detecção + descrição)
- `--auto` = Modo automático inicial (captura contínua)
- `--interval 3` = Captura a cada 3 segundos (em modo realtime)

---

## 📡 ESP32-CAM

```bash
cd kaz-image-captioning
python3 launcher.py --source esp32 --url http://172.25.26.13:81/stream --mode both --auto --interval 3
```
<!--  /usr/bin/python3 launcher.py --source webcam --mode both --auto --interval 3 -->

**Explicação:**

- `--source esp32` = Usar ESP32-CAM
- `--url http://...` = Endereço do stream da ESP32
- `--mode both` = YOLO + Kaz
- `--auto` = Captura automática inicial
- `--interval 3` = A cada 3 segundos (em modo realtime)

---

## 🎛️ Modos Disponíveis

| Modo        | Descrição                                     |
| ----------- | --------------------------------------------- |
| `both`      | YOLO + Kaz (detecção + descrição completa) ✅ |
| `yolo-only` | Apenas detecção de objetos                    |
| `kaz-only`  | Apenas descrição em linguagem natural         |

---

## 🔄 Controle Automático via App

O sistema verifica o modo de operação na API a cada 2 segundos:

### Modo REALTIME (Automático)

- ✅ Captura automática a cada 3 segundos
- Sistema processa continuamente
- Detecta objetos e envia para o app

### Modo MANUAL

- ⏸️ Sistema aguarda comando do app
- Usuário clica no botão **"Capturar"** no app mobile
- Sistema captura e processa **sob demanda**

### Fluxo do Modo Manual:

1. 📱 App mobile alterna para modo "Manual" (toggle)
2. 🔄 Sistema Python detecta mudança via API em até 2s
3. ⏸️ Para capturas automáticas
4. 👆 Usuário clica no botão "Capturar" no app
5. 📤 App envia `POST /api/esp32-cam/capture-now`
6. 🔍 Sistema Python verifica API a cada 50ms
7. 📸 Captura e processa imagem imediatamente
8. 📨 Envia resultado via WebSocket para o app

**Vantagem:** Economiza processamento e permite controle preciso do momento da captura.

---

## 📊 Saída Esperada

```json
{
  "description_pt": "Um homem de óculos está se olhando no espelho.",
  "description_kz": "Көзілдірік киген адам айнаға қарап тұр.",
  "objects": ["homem", "óculos", "olhando", "espelho"],
  "confidence": 0.85,
  "timestamp": 1764003845457
}
```

Dados enviados para:

- **HTTP**: `POST /api/esp32-cam/send-description`
- **WebSocket**: Broadcast para clientes conectados

---

## ⚙️ Requisitos

- Python 3.12+
- Virtual environment (`.venv` ou `venv`)
- Backend rodando em `http://localhost:3000`
- App mobile conectado via WebSocket

---

## 🐛 Troubleshooting

### Modo manual não captura

- ✅ Verifique se backend está rodando
- ✅ Confirme conexão WebSocket no app
- ✅ Aguarde até 2s após trocar o modo
- ✅ Clique no botão "Capturar" no app

### Sistema não detecta mudança de modo

- O script verifica a API a cada 2 segundos
- Aguarde a mensagem: `🔄 Modo alterado: MANUAL (auto=False)`

### Captura muito lenta em modo manual

- Verificação acontece a cada 50ms em modo manual
- Resposta típica: < 100ms após clicar no botão

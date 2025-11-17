# 📹 Captura com Webcam - Modo REALTIME/MANUAL

## 🎯 Visão Geral

Este script permite usar a **webcam do computador** ao invés do ESP32-CAM, mantendo **todas as funcionalidades**:

- ✅ Controle via **app mobile**
- ✅ Modo **REALTIME** (captura automática)
- ✅ Modo **MANUAL** (captura sob demanda)
- ✅ Tradução Cazaque → Português
- ✅ Envio para backend via HTTP
- ✅ Distribuição via WebSocket

## 🚀 Como Usar

### Opção 1: Script Rápido (Recomendado)

```bash
cd kaz-image-captioning

# Modo básico (headless, sem preview)
./run_webcam.sh

# Com preview da câmera
./run_webcam.sh 0 http://localhost:3000/api/esp32-cam/send-description 5 --show-preview

# Usando segunda câmera
./run_webcam.sh 1

# Intervalo de 10 segundos
./run_webcam.sh 0 http://localhost:3000/api/esp32-cam/send-description 10
```

### Opção 2: Comando Direto Python

```bash
cd kaz-image-captioning
source venv/bin/activate

# Modo headless (sem janela)
python webcam_to_server.py \
  --camera-id 0 \
  --server-url http://localhost:3000/api/esp32-cam/send-description \
  --interval 5

# Com preview da webcam
python webcam_to_server.py \
  --camera-id 0 \
  --server-url http://localhost:3000/api/esp32-cam/send-description \
  --interval 5 \
  --show-preview
```

## ⚙️ Parâmetros

| Parâmetro | Descrição | Padrão | Exemplo |
|-----------|-----------|--------|---------|
| `--camera-id` | ID da webcam (0=padrão, 1=segunda câmera) | `0` | `--camera-id 1` |
| `--server-url` | URL do backend | - | `http://localhost:3000/api/esp32-cam/send-description` |
| `--interval` | Intervalo entre capturas (segundos) | `5` | `--interval 10` |
| `--rotate` | Rotação da imagem (0, 90, 180, 270) | `0` | `--rotate 180` |
| `--show-preview` | Mostrar janela de preview | `false` | `--show-preview` |

## 📋 Pré-requisitos

1. **Backend rodando**:
   ```bash
   cd back-end
   node teste-web.js
   ```

2. **App mobile** (para controlar modo):
   ```bash
   cd pdc-visual-app
   pnpm run start
   ```

3. **Webcam funcionando** no computador

## 🎮 Funcionamento

### Modo REALTIME (Automático)

```
📹 Webcam captura frame
      ↓
⏱️  Aguarda 5 segundos
      ↓
🤖 Processa com IA
      ↓
🌐 Traduz para Português
      ↓
📤 Envia para backend
      ↓
📱 App recebe via WebSocket
```

### Modo MANUAL (Sob Demanda)

```
📹 Webcam captura frames (mas não processa)
      ↓
⏸️  PAUSADO - Aguardando comando
      ↓
📱 Usuário clica "📸 Capturar Agora" no app
      ↓
✅ Python detecta solicitação (0.5s)
      ↓
📸 Captura e processa frame atual
      ↓
📤 Envia para backend
      ↓
📱 App recebe descrição
```

## 🖥️ Preview da Webcam

Com `--show-preview`, você verá uma janela mostrando:

```
┌─────────────────────────────────────┐
│ Modo: REALTIME             [VIDEO]  │
│ Frame: 1234                          │
│ Deteccoes: 15                        │
│                                      │
│     [Imagem da webcam ao vivo]      │
│                                      │
│                                      │
│ AGUARDANDO COMANDO... (se manual)   │
└─────────────────────────────────────┘
```

**Pressione 'q'** na janela para sair.

## 📊 Logs Esperados

### Inicialização
```
╔════════════════════════════════════════════════════════╗
║  📹 WEBCAM → SERVIDOR (HTTP POST)                     ║
╚════════════════════════════════════════════════════════╝
Câmera ID: 0
Servidor: http://localhost:3000/api/esp32-cam/send-description
Intervalo: 5s
Preview: ❌ Headless
Modelo IA: ✅ Ativo
════════════════════════════════════════════════════════

🔄 Carregando dicionário...
✅ Dicionário carregado!
🔄 Inicializando modelo...
🖥️  Usando dispositivo: cpu
✅ Modelo carregado!

📹 Conectando à webcam 0...
✅ Conectado à webcam!
📡 Servidor: http://localhost:3000/api/esp32-cam/send-description

🚀 Iniciando captura
⚙️  Modo: Controlado pelo servidor (realtime=5s / manual=sob demanda)
👁️  Preview: DESATIVADO (headless mode)
Pressione Ctrl+C para parar
```

### Modo REALTIME
```
📸 Captura #1 (frame 150) [REALTIME]
⏰ 14:32:10
🤖 Gerando legenda...
📝 Descrição (Cazaque): Үстінде отырған адам.
⏱️  Tempo: 0.18s
🌐 Traduzindo...
📝 Descrição (Português): Uma pessoa sentada
📤 ✅ Enviado: Uma pessoa sentada...
✅ Detecção #1 processada
```

### Mudança para MANUAL
```
🔄 Modo alterado: MANUAL
⏸️  Captura automática pausada. Aguardando comando manual...

[... aguardando você clicar no app ...]

✅ Captura manual solicitada! Timestamp: 1763396550289

📸 Captura #2 (frame 890) [MANUAL]
⏰ 14:35:42
🤖 Gerando legenda...
📝 Descrição (Português): Um computador na mesa
📤 ✅ Enviado: Um computador na mesa...
✅ Detecção #2 processada
```

## 🔧 Troubleshooting

### Erro: "Erro ao conectar à webcam"

**Soluções**:
```bash
# 1. Listar câmeras disponíveis
ls -l /dev/video*

# 2. Tentar diferentes IDs
python webcam_to_server.py --camera-id 0 ...
python webcam_to_server.py --camera-id 1 ...
python webcam_to_server.py --camera-id 2 ...

# 3. Verificar permissões
sudo chmod 666 /dev/video0

# 4. Verificar se outra aplicação está usando
# Feche Zoom, Skype, Google Meet, etc.
```

### Preview não abre

**Causa**: Modo headless (sem X11/display)

**Solução**: Rode **sem** `--show-preview` em ambientes como GitHub Codespaces

### Performance lenta

**Otimizações**:
```bash
# Aumentar intervalo
--interval 10

# Desativar preview
# (remover --show-preview)

# Usar GPU se disponível
# (detectado automaticamente se PyTorch + CUDA instalados)
```

## 🆚 Webcam vs ESP32-CAM

| Característica | Webcam | ESP32-CAM |
|---------------|--------|-----------|
| **Setup** | ✅ Plug and play | ⚙️ Requer configuração WiFi |
| **Qualidade** | ✅ Alta (720p/1080p) | ⚠️ Média (VGA 640x480) |
| **Latência** | ✅ Baixa (local) | ⚠️ Média (WiFi) |
| **Mobilidade** | ❌ Preso ao PC | ✅ Portátil |
| **Preço** | 💰 R$ 50-200 | 💰 R$ 30-50 |
| **Uso** | 🖥️ Testes, desenvolvimento | 📱 Produção, óculos |

## 📝 Notas

- **Headless mode** é ideal para servidores/codespaces
- **Preview mode** é útil para debug local
- O modo (REALTIME/MANUAL) é **sempre controlado pelo app mobile**
- Funciona com qualquer câmera compatível com OpenCV
- Suporta múltiplas câmeras (altere `--camera-id`)

## 🔗 Arquivos Relacionados

- `webcam_to_server.py` - Script principal
- `esp32_to_server.py` - Versão para ESP32-CAM
- `run_webcam.sh` - Script de execução rápida
- `run_esp32_translated.sh` - Para ESP32-CAM

## 💡 Exemplo Completo

```bash
# Terminal 1: Backend
cd back-end
node teste-web.js

# Terminal 2: Webcam (COM preview)
cd kaz-image-captioning
./run_webcam.sh 0 http://localhost:3000/api/esp32-cam/send-description 5 --show-preview

# Terminal 3: App Mobile
cd pdc-visual-app
pnpm run start
```

Agora **controle pelo app**:
1. Conectar WebSocket
2. Alternar REALTIME ↔ MANUAL
3. Capturar manualmente quando quiser

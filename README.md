# Sistema de Detecção de Objetos para PCD Visual com ESP32

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PlatformIO](https://img.shields.io/badge/PlatformIO-6.8.1-orange.svg)](https://platformio.org)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino-green.svg)](https://github.com/espressif/arduino-esp32)
[![Node.js](https://img.shields.io/badge/Node.js-22-success.svg)](https://nodejs.org)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-COCO--SSD-ff6f00.svg)](https://www.tensorflow.org/js)


> Sistema completo de assistência para pessoas com deficiência visual usando ESP32, visão computacional com TensorFlow.js, feedback tátil e narração de objetos em tempo real.


<img width="1500" height="1125" alt="iPhone 16" src="https://github.com/user-attachments/assets/fdac1e1a-cae8-4143-9a42-3346d0985ab8" />
<img width="1463" height="1139" alt="Diagrama visual" src="https://github.com/user-attachments/assets/d0dd161d-42b6-439d-b030-470a401e6ada" />
<img width="1463" height="1139" alt="Modelo final" src="https://github.com/user-attachments/assets/2ea72638-870b-4a42-bdfb-4647e74f978e" />


> Sistema de assistência para detecção de obstáculos usando ESP32, ESP-NOW, sensor HC-SR04 e feedback tátil.

## ✨ Características

- �️ **Visão Computacional** com TensorFlow.js (modelo COCO-SSD, 80 classes)
- 📡 **Comunicação ESP-NOW** entre módulos ESP32 (baixíssima latência ~10ms)
- 🌐 **Backend Node.js** com captura e processamento de imagens
- 📹 **ESP32-CAM** para captura de imagens em tempo real
- 📏 **Sensor ultrassônico** HC-SR04 para detecção de obstáculos
- 🔊 **Feedback tátil** proporcional à distância
- 📱 **App Mobile React Native** com SSE (Server-Sent Events)
- �️ **Narração em português** dos objetos detectados
- ☁️ **Deploy pronto** para Render (produção)

## 🏗️ Arquitetura do Sistema

```
┌──────────────────── REDE LOCAL / INTERNET ─────────────────────┐
│                                                                 │
│  ┌────────────────┐                                             │
│  │  ESP32-Sensor  │ (Módulo 1)                                  │
│  │  HC-SR04       │                                             │
│  └───────┬────────┘                                             │
│          │ ESP-NOW (Distância) + Temperatura + Giróscopio       │
│          │                                                      │
│          ▼                                                      │
│  ┌────────────────┐        WebSocket                            │
│  │  ESP32-PAI     │◄────────────────────┐                       │
│  │  (Mestre)      │                      │                      │
│  └───────┬────────┘                      │                      │
│          │ ESP-NOW (Vibração)            │                      │
│          │                               │                      │
│          ▼                               │                      │
│  ┌────────────────┐                      │                      │
│  │  ESP32-Motor   │ (Módulo 3)           │                      │
│  └────────────────┘                      │                      │
│                                          │                      │
│  ┌────────────────┐ (Módulo 2)    HTPP   ▼                      │
│  │  ESP32-CAM     │◄───┐   ┌──────────────────────┐             │
│  │  (Câmera)      │    └───│  Servidor Node.js    │             │
│  └────────────────┘        │  + TensorFlow.js     │             │
│   192.168.100.56           │  + COCO-SSD          │             │
│                            └────────┬─────────────┘             │
│                                     │                           │
│                                     │ SSE / WebSocket           │
│                                     ▼                           │
│                            ┌──────────────────┐                 │
│                            │   App Mobile     │                 │
│                            │  React Native    │                 │
│                            └──────────────────┘                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Fluxos de Dados

#### 1️⃣ Sensor → Motor (ESP-NOW + WebSocket)

1. **Módulo 1 (Sensor)** mede distância a cada 500ms
2. Envia ao **ESP32-PAI** via ESP-NOW
3. **ESP32-PAI** calcula intensidade de vibração:
   - `< 20cm` → 🔴 FORTE (nível 3) + Alerta DANGER
   - `20-50cm` → � MÉDIA (nível 2) + Alerta WARNING
   - `50-100cm` → � BAIXA (nível 1) + Alerta INFO
   - `> 100cm` → ⚪ PARADO (nível 0)
4. **ESP32-PAI** envia comando ao **Módulo 3 (Motor)** via ESP-NOW
5. **ESP32-PAI** envia status ao **Servidor** via WebSocket
6. **Servidor** faz broadcast via SSE ao **App Mobile**

#### 2️⃣ Câmera → Detecção de Objetos (HTTP + TensorFlow)

1. **Servidor Node.js** captura imagem da **ESP32-CAM** via HTTP (`/capture`)
2. Processa com **TensorFlow.js** (modelo COCO-SSD)
3. Detecta objetos com bounding boxes
4. Traduz para português e gera descrição
5. Faz broadcast via SSE ao **App Mobile**
6. App narra objetos detectados via TTS (Text-to-Speech)

## 📁 Estrutura do Projeto

```
sistema_de_dectacao_de_objetos/
│
├── back-end/                          # Servidor Node.js
│   ├── server-vision-streaming.js    # Servidor principal (TensorFlow + SSE)
│   ├── server.js                      # Servidor básico (alternativo)
│   ├── Dockerfile                     # Container Docker
│   ├── docker-compose.yml             # Orquestração
│   ├── package.json                   # Dependências npm
│   ├── RENDER_DEPLOY.md               # Guia de deploy no Render
│   ├── SSE_*.md                       # Documentação SSE
│   └── test-sse.html                  # Cliente de teste SSE
│
├── firmware/                          # Código dos ESP32
│   ├── modulo1-sensor/               # Sensor HC-SR04 + ESP-NOW
│   ├── esp32-pai-mestre/             # Controlador central + WebSocket
│   │   ├── src/main.cpp              # ✅ ATUALIZADO (WebSocket + ESP-NOW)
│   │   └── platformio.ini            # ✅ Deps: ArduinoJson + WebSockets
│   ├── modulo3-motor/                # Motor de vibração
│   ├── ARQUITETURA_SIMPLIFICADA.md   # 📚 Documentação completa
│   └── INTEGRACAO_COMPLETA.md        # 📚 Guia de integração
│
├── esp-32-cam/                        # ESP32-CAM
│   ├── src/main.cpp                  # ✅ ATUALIZADO (HTTP puro)
│   └── platformio.ini                # Configuração da câmera
│
├── app/                               # App Mobile React Native
│   └── pcd-visual-app/               # Interface do usuário
│
├── docs/                              # Documentação
│   ├── README_HARDWARE.md            # Conexões físicas
│   ├── README_CONFIGURACAO.md        # Setup detalhado
│   └── TROUBLESHOOTING.md            # Solução de problemas
│
└── deprecated/                        # Código legado
```

## 🚀 Início Rápido

### Pré-requisitos

**Hardware:**

- 3x ESP32 DevKit (Módulo 1: Sensor, PAI, Módulo 3: Motor)
- 1x ESP32-CAM (AI-Thinker ou similar)
- 1x Sensor HC-SR04 (ultrassônico)
- 1x Motor vibracall 1027
- 1x Transistor NPN (BC547 ou similar)
- 1x Resistor 1kΩ
- Jumpers e protoboard

**Software:**

- [Node.js](https://nodejs.org/) 18+ (recomendado: 22)
- [PlatformIO](https://platformio.org/install) instalado
- VS Code (recomendado)
- Git

### Instalação Completa

#### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/fabiobrasileiroo/sistema_de_dectacao_de_objetos.git
cd sistema_de_dectacao_de_objetos
```

#### 2️⃣ Configure e Inicie o Servidor Node.js

```bash
cd back-end

# Instalar dependências
npm install

# Configurar IP da câmera (editar .env ou usar variável de ambiente)
export ESP32_CAM_IP=192.168.100.56

# Iniciar servidor
node server-vision-streaming.js
```

**Servidor estará disponível em:**

- HTTP: `http://localhost:3000`
- WebSocket (ESP32): `ws://localhost:3000/esp32`
- WebSocket (App): `ws://localhost:3000/ws`
- SSE: `http://localhost:3000/api/stream/events`
- Swagger UI: `http://localhost:3000/api/docs`

#### 3️⃣ Configure WiFi nos ESP32s

**ESP32-PAI (`firmware/esp32-pai-mestre/src/main.cpp`):**

```cpp
const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";

// IP do servidor (seu PC na rede local)
const char* wsServer = "192.168.100.11";  // ← Ajuste aqui
const int wsPort = 3000;
```

**ESP32-CAM (`esp-32-cam/src/main.cpp`):**

```cpp
const char *ssid = "SEU_WIFI";
const char *password = "SUA_SENHA";
```

#### 4️⃣ Compile e Faça Upload

```bash
# ESP32-Sensor (Módulo 1)
cd firmware/modulo1-sensor
pio run --target upload
pio device monitor  # Ver MAC Address

# ESP32-PAI (Mestre)
cd ../esp32-pai-mestre
pio run --target upload
pio device monitor  # Ver MAC Address e conexão WebSocket

# ESP32-Motor (Módulo 3)
cd ../modulo3-motor
pio run --target upload
pio device monitor

# ESP32-CAM
cd ../../esp-32-cam
pio run --target upload
pio device monitor  # Ver IP da câmera
```

#### 5️⃣ Configure os MAC Addresses

Após o primeiro upload, anote os MACs exibidos no Serial Monitor:

**ESP32-Sensor (`firmware/modulo1-sensor/src/main.cpp`):**

```cpp
// MAC do ESP32-PAI (copiar do Serial Monitor do PAI)
uint8_t broadcastAddress[] = {0xEC, 0x64, 0xC9, 0x7C, 0x38, 0x30};
```

**ESP32-PAI (`firmware/esp32-pai-mestre/src/main.cpp`):**

```cpp
// MAC do Módulo 1 (Sensor)
uint8_t modulo1Address[] = {0xD0, 0xEF, 0x76, 0x15, 0x8F, 0x04};

// MAC do Módulo 3 (Motor)
uint8_t modulo3Address[] = {0xEC, 0x64, 0xC9, 0x7B, 0x99, 0x8C};
```

**Recompile** após configurar os MACs:

```bash
cd firmware/modulo1-sensor && pio run --target upload
cd ../esp32-pai-mestre && pio run --target upload
```

## 🎮 Testando o Sistema

### Verificar Logs

```bash
# Terminal 1: Servidor Node.js
cd back-end
node server-vision-streaming.js

# Terminal 2: ESP32-PAI
cd firmware/esp32-pai-mestre
pio device monitor --baud 115200

# Terminal 3: ESP32-CAM
cd esp-32-cam
pio device monitor --baud 115200
```

### Saída Esperada

**Servidor Node.js:**

```
✅ Modelo COCO-SSD carregado com sucesso!
🌐 HTTP Server: http://localhost:3000
🔌 WebSocket: ws://localhost:3000/esp32
📡 ESP32-CAM IP: 192.168.100.56
📸 Modo: CAPTURA

🤝 ESP32 conectado: ::ffff:192.168.100.10
✅ ESP32-PAI identificado: ESP32-PAI-MESTRE

🔄 Processando frame #1...
🎯 DETECÇÃO TENSORFLOW
📝 Descrição: Detectados 2 objetos: pessoa (95%), cadeira (87%)
```

**ESP32-PAI:**

```
╔════════════════════════════════════╗
║  ESP32-PAI - MESTRE + WEBSOCKET  ║
╚════════════════════════════════════╝

✅ WiFi conectado!
   IP: 192.168.100.10
   MAC: EC:64:C9:7C:38:30
✅ WebSocket conectado a: 192.168.100.11

╔════════════════════════════════╗
║     SENSOR (Módulo 1)          ║
╚════════════════════════════════╝
📏 Distância: 45 cm
🟡 Intensidade: MÉDIA (nível 2)
✅ Comando enviado ao Motor
```

**ESP32-CAM:**

```
WiFi connected
Camera Ready! Use 'http://192.168.100.56' to connect
```

### Testar Detecção

1. **Aproximar objetos do sensor** → Motor vibra
2. **Colocar objetos na frente da câmera** → Servidor detecta e narra
3. **Abrir navegador** em `http://localhost:3000/api/docs` → Swagger UI
4. **Testar SSE** em `http://localhost:3000/test-sse.html`

## 📚 Documentação Completa

| Documento                                                           | Descrição                              |
| ------------------------------------------------------------------- | -------------------------------------- |
| **Firmware**                                                        |                                        |
| [ARQUITETURA_SIMPLIFICADA.md](firmware/ARQUITETURA_SIMPLIFICADA.md) | 📐 Arquitetura completa do sistema     |
| [INTEGRACAO_COMPLETA.md](firmware/INTEGRACAO_COMPLETA.md)           | 🔌 Guia de integração ESP32 ↔ Servidor |
| **Backend**                                                         |                                        |
| [RENDER_DEPLOY.md](back-end/RENDER_DEPLOY.md)                       | ☁️ Deploy no Render (produção)         |
| [SSE_REALTIME_GUIDE.md](back-end/SSE_REALTIME_GUIDE.md)             | 📡 Server-Sent Events em tempo real    |
| [DOCKER_GUIDE.md](back-end/DOCKER_GUIDE.md)                         | 🐳 Rodar com Docker                    |
| [API_DETECTIONS_REALTIME.md](back-end/API_DETECTIONS_REALTIME.md)   | 🎯 API de detecções                    |
| **Hardware**                                                        |                                        |
| [README_HARDWARE.md](docs/README_HARDWARE.md)                       | 🔌 Conexões e esquemas elétricos       |
| [README_CONFIGURACAO.md](docs/README_CONFIGURACAO.md)               | ⚙️ Configuração passo a passo          |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)                       | 🐛 Solução de problemas                |
| **Legado**                                                          |                                        |
| [README_ESP32_SISTEMA.md](README_ESP32_SISTEMA.md)                  | 📖 Guia completo original              |

## 🛠️ Stack Tecnológica

### Backend

- **Node.js** 22 + Express
- **TensorFlow.js** com modelo COCO-SSD
- **WebSocket** (ws) para ESP32 e App
- **Server-Sent Events** (SSE) para push em tempo real
- **Canvas** para processamento de imagens
- **Swagger** para documentação da API

### Firmware

- **PlatformIO** + Arduino Framework
- **ESP-IDF** para funcionalidades avançadas
- **ESP-NOW** para comunicação entre ESP32s
- **WebSocketsClient** (ESP32-PAI)
- **ArduinoJson** para parsing JSON
- **ESP32-Camera** driver

### App Mobile

- **React Native** + Expo
- **EventSource** para SSE
- **Text-to-Speech** para narração
- **Axios** para HTTP requests

### DevOps

- **Docker** + Docker Compose
- **Render** para deploy em produção
- **Git** para controle de versão

## 📊 Especificações Técnicas

### Hardware

| Componente   | Especificação | Consumo    | Alcance/Precisão |
| ------------ | ------------- | ---------- | ---------------- |
| ESP32-PAI    | DevKit V1     | ~80mA      | ESP-NOW: 200m    |
| ESP32-CAM    | AI-Thinker    | ~180mA     | Resolução: UXGA  |
| ESP32-Sensor | DevKit V1     | ~80mA      | HC-SR04: 2-400cm |
| ESP32-Motor  | DevKit V1     | ~100mA     | PWM 0-255        |
| **Total**    | -             | **~440mA** | -                |

### Performance

| Métrica                  | Valor      | Observação                  |
| ------------------------ | ---------- | --------------------------- |
| Latência ESP-NOW         | ~10ms      | Sensor → PAI → Motor        |
| Latência WebSocket       | ~50ms      | PAI → Servidor              |
| Captura de Imagem        | ~200ms     | HTTP GET da câmera          |
| Processamento TensorFlow | ~300-500ms | Depende da imagem           |
| Taxa de Detecção         | 0.5-1 fps  | Configurable (1.5s default) |
| Alcance WiFi             | ~50m       | Indoor, depende do ambiente |
| Alcance ESP-NOW          | ~200m      | Campo aberto                |

### Modelo de IA

- **Modelo:** COCO-SSD (TensorFlow.js)
- **Classes:** 80 objetos comuns
- **Confiança mínima:** 50% (configurável)
- **Objetos por frame:** até 5 (configurável)
- **Idioma:** Português (tradução automática)

**Exemplos de detecção:**

- Pessoas, animais (cachorro, gato)
- Veículos (carro, bicicleta, moto)
- Móveis (cadeira, sofá, mesa)
- Eletrônicos (celular, notebook, TV)
- Utensílios (garrafa, xícara, livro)

## 🐳 Docker

### Build Local

```bash
cd back-end

# Build da imagem
docker build -t vision-backend:latest .

# Rodar container
docker run -p 3000:3000 \
  -e ESP32_CAM_IP=192.168.100.56 \
  vision-backend:latest
```

### Docker Compose

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## ☁️ Deploy em Produção (Render)

### Configuração Rápida

1. **Criar conta no [Render](https://render.com)**
2. **Conectar repositório GitHub**
3. **Configurar Web Service:**

   - Environment: `Docker`
   - Dockerfile Path: `back-end/Dockerfile`
   - Port: `3000` (automático)

4. **Variáveis de Ambiente:**

   ```
   NODE_ENV=production
   ESP32_CAM_IP=<não necessário em produção>
   ```

5. **Deploy automático** a cada push no GitHub

**URLs após deploy:**

- API: `https://seu-app.onrender.com`
- Swagger: `https://seu-app.onrender.com/api/docs`
- WebSocket: `wss://seu-app.onrender.com/esp32`
- SSE: `https://seu-app.onrender.com/api/stream/events`

📖 Ver [RENDER_DEPLOY.md](back-end/RENDER_DEPLOY.md) para guia completo.

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Este projeto foi desenvolvido para ajudar pessoas com deficiência visual.

### Como Contribuir

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

### Áreas de Contribuição

- 🐛 Correção de bugs
- ✨ Novas features
- 📝 Melhorias na documentação
- 🎨 Interface do app mobile
- 🧪 Testes automatizados
- 🌍 Traduções (i18n)
- ♿ Melhorias de acessibilidade

## 🐛 Reportar Problemas

Encontrou um bug ou tem uma sugestão? [Abra uma issue](https://github.com/fabiobrasileiroo/sistema_de_dectacao_de_objetos/issues)

**Template de issue:**

```markdown
## Descrição

[Descreva o problema ou sugestão]

## Passos para Reproduzir (se bug)

1. ...
2. ...

## Comportamento Esperado

[O que deveria acontecer]

## Comportamento Atual

[O que está acontecendo]

## Ambiente

- OS: [Linux/Windows/MacOS]
- Node.js: [versão]
- ESP32: [modelo]
```

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja [LICENSE](LICENSE) para mais detalhes.

**Resumo da licença:**

- ✅ Uso comercial
- ✅ Modificação
- ✅ Distribuição
- ✅ Uso privado
- ⚠️ Sem garantia
- ℹ️ Mantenha o aviso de copyright

## 👨‍💻 Autor

**Fábio Brasileiro**

- 💼 GitHub: [@fabiobrasileiroo](https://github.com/fabiobrasileiroo)
- 📧 Email: contato@fabiobrasileiro.dev
- 🌐 Portfolio: [fabiobrasileiro.dev](https://fabiobrasileiro.dev)
- 💼 LinkedIn: [linkedin.com/in/fabiobrasileiroo](https://linkedin.com/in/fabiobrasileiroo)

## 🙏 Agradecimentos

- 🏢 [InovaTech 2025](https://inovatech.com.br) - Suporte ao projeto
- 🤝 Comunidade [PlatformIO](https://platformio.org/)
- 🔧 [Espressif Systems](https://www.espressif.com/) pelo ESP32
- 🧠 [TensorFlow.js](https://www.tensorflow.org/js) pela IA em JavaScript
- 🌐 Comunidade [Node.js](https://nodejs.org/)
- 📱 [Expo](https://expo.dev/) pelo framework mobile
- ♿ Comunidade de acessibilidade e inclusão

## 📈 Roadmap

### ✅ Versão 1.0 (Atual)

- [x] Sistema básico funcionando
- [x] ESP-NOW entre módulos
- [x] Detecção de objetos com TensorFlow
- [x] Backend Node.js com SSE
- [x] WebSocket ESP32-PAI → Servidor
- [x] Docker e deploy no Render
- [x] Documentação completa

### 🔜 Versão 1.1

- [ ] App mobile React Native completo
- [ ] Narração TTS em português
- [ ] Configuração via app (sem recompilar firmware)
- [ ] Histórico de detecções
- [ ] Modo economia de energia

### 🔮 Versão 2.0 (Futuro)

- [ ] Múltiplos sensores simultâneos
- [ ] Calibração automática
- [ ] Machine Learning personalizado
- [ ] Dashboard web administrativo
- [ ] Integração com assistentes (Alexa, Google)
- [ ] Modo outdoor com GPS
- [ ] Notificações push
- [ ] Suporte multi-idioma (i18n)

### 💡 Ideias em Avaliação

- [ ] Reconhecimento facial de pessoas conhecidas
- [ ] Detecção de texto (OCR) para placas/documentos
- [ ] Modo indoor com mapeamento 3D
- [ ] Integração com smart home
- [ ] API pública para desenvolvedores

## 🌟 Star History

Se este projeto foi útil para você, considere dar uma ⭐!

[![Star History Chart](https://api.star-history.com/svg?repos=fabiobrasileiroo/sistema_de_dectacao_de_objetos&type=Date)](https://star-history.com/#fabiobrasileiroo/sistema_de_dectacao_de_objetos&Date)

## 📸 Screenshots

### Interface Web (Swagger API)

![Swagger UI](https://via.placeholder.com/800x400?text=Swagger+UI+Screenshot)

### Detecção de Objetos

![Detecção](https://via.placeholder.com/800x400?text=Object+Detection+Screenshot)

### Monitor Serial ESP32-PAI

![Serial Monitor](https://via.placeholder.com/800x400?text=Serial+Monitor+Screenshot)

## 🎥 Demonstração

🎬 [Vídeo de demonstração no YouTube](https://youtube.com) _(em breve)_

---

<div align="center">

### 🌍 Acessibilidade é um direito, não um privilégio

**Status:** 🟢 Ativo e em desenvolvimento

**Versão:** 2.0.0

**Última atualização:** 1 de novembro de 2025

Feito com ❤️ e ☕ por [Fábio Brasileiro](https://github.com/fabiobrasileiroo)

**Ajude a tornar o mundo mais acessível! ⭐**

</div>

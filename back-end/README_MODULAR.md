# 🎯 Backend Modular - Sistema de Detecção de Objetos

Backend modularizado do sistema de detecção de objetos com ESP32-CAM, Express.js, WebSocket e Swagger.

## 📁 Estrutura do Projeto

```
deprecated/back-end/
├── server.js                    # Servidor principal
├── package.json                 # Dependências
├── public/                      # Arquivos estáticos
│   └── viewer.html             # Interface web
└── src/
    ├── config/                  # Configurações
    │   ├── esp32.config.js     # Config ESP32-CAM
    │   └── server.config.js    # Config do servidor
    ├── controllers/             # Controladores (lógica de negócio)
    │   ├── esp32.controller.js # Controle ESP32
    │   ├── history.controller.js # Controle histórico
    │   └── status.controller.js # Controle status
    ├── services/                # Serviços (lógica reutilizável)
    │   ├── esp32.service.js    # Comunicação ESP32
    │   ├── history.service.js  # Gerenciamento histórico
    │   └── vision.service.js   # Processamento de imagens
    └── routes/                  # Rotas (endpoints)
        ├── esp32.routes.js     # Rotas ESP32
        ├── history.routes.js   # Rotas histórico
        ├── status.routes.js    # Rotas status
        └── index.js            # Agregador de rotas
```

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Ou com nodemon para desenvolvimento
npm run dev
```

## 📚 Endpoints API

### ESP32

- **GET** `/api/esp32/test` - Testa conexão com ESP32-CAM
- **POST** `/api/esp32/capture` - Captura e processa imagem
- **POST** `/api/esp32/capture-image` - Captura imagem com bounding boxes
- **GET** `/api/esp32/config` - Retorna configuração atual
- **PUT** `/api/esp32/config` - Atualiza configuração

### Histórico

- **GET** `/api/history` - Retorna histórico de detecções
- **GET** `/api/history/last` - Retorna última detecção
- **GET** `/api/history/stats` - Retorna estatísticas
- **DELETE** `/api/history` - Limpa histórico

### Status

- **GET** `/api/status` - Status completo do sistema
- **GET** `/health` - Health check
- **GET** `/` - Informações da API

### Documentação

- **GET** `/api/docs` - Swagger UI (documentação interativa)
- **GET** `/viewer` - Interface web de visualização

## 🔧 Configuração

### ESP32 (src/config/esp32.config.js)

```javascript
ESP32_IP=192.168.100.56
CAPTURE_INTERVAL=2000
CONFIDENCE_THRESHOLD=0.5
```

### Servidor (src/config/server.config.js)

```javascript
PORT = 3000;
WS_PORT = 8080;
MAX_HISTORY = 100;
```

## 🏗️ Arquitetura

### Camadas

1. **Routes** - Define endpoints e documentação Swagger
2. **Controllers** - Lógica de negócio e validação
3. **Services** - Lógica reutilizável e comunicação externa
4. **Config** - Configurações centralizadas

### Fluxo de Dados

```
Request → Route → Controller → Service → ESP32/Canvas
                     ↓
                  Response
                     ↓
                  WebSocket (broadcast)
```

## 📡 WebSocket

O servidor transmite detecções em tempo real via WebSocket na porta 8080.

```javascript
const ws = new WebSocket("ws://localhost:8080");

ws.onmessage = (event) => {
  const detection = JSON.parse(event.data);
  console.log("Nova detecção:", detection);
};
```

## 🎨 Processamento de Imagens

### Vision Service (sem TensorFlow)

O `vision.service.js` **não** faz detecção de objetos. Ele apenas:

1. Desenha bounding boxes em imagens
2. Traduz classes para português
3. Gera descrições em português

**Detecções devem vir de:**

- ESP32 (processamento embarcado)
- API externa (cloud)
- Mock (para testes)

### Exemplo de Uso

```javascript
const visionService = require("./services/vision.service");

// Detecções vindas do ESP32 ou API
const detections = [
  {
    class: "person",
    score: 0.95,
    bbox: [100, 100, 200, 300],
  },
];

// Desenhar bounding boxes
const processedImage = await visionService.drawBoundingBoxes(
  imageBuffer,
  detections
);
```

## 🔄 Migração do Código Antigo

### Antes (monolítico - 763 linhas)

```javascript
// server-vision-streaming.js
// Tudo em um arquivo: routes, logic, TensorFlow, etc
```

### Depois (modular)

```javascript
// Separado em camadas claras
Routes → Controllers → Services
```

### Vantagens

✅ **Manutenibilidade** - Código organizado e fácil de encontrar  
✅ **Testabilidade** - Cada módulo pode ser testado isoladamente  
✅ **Escalabilidade** - Fácil adicionar novos recursos  
✅ **Reutilização** - Services podem ser usados em qualquer lugar  
✅ **Documentação** - Swagger automático via anotações  
✅ **Sem TensorFlow** - Removida dependência problemática

## 🐛 Troubleshooting

### Erro: ESP32 não responde

```bash
# Verificar IP do ESP32
ping 192.168.100.56

# Testar endpoint
curl http://192.168.100.56/capture
```

### Erro: Porta em uso

```bash
# Mudar porta em src/config/server.config.js
PORT=3001
```

### WebSocket não conecta

```bash
# Verificar se porta 8080 está livre
lsof -i :8080
```

## 📝 Scripts NPM

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest"
}
```

## 🔐 Variáveis de Ambiente

Criar arquivo `.env` na raiz:

```env
ESP32_IP=192.168.100.56
PORT=3000
WS_PORT=8080
NODE_ENV=development
```

## 📦 Dependências

### Core

- **express** - Framework web
- **ws** - WebSocket
- **axios** - Cliente HTTP
- **canvas** - Manipulação de imagens

### Documentação

- **swagger-jsdoc** - Geração Swagger
- **swagger-ui-express** - Interface Swagger

### Desenvolvimento

- **nodemon** - Auto-reload
- **cors** - CORS middleware

## 🎯 Próximos Passos

- [ ] Adicionar testes unitários
- [ ] Integrar com API de detecção real
- [ ] Adicionar autenticação
- [ ] Implementar rate limiting
- [ ] Adicionar logs estruturados
- [ ] Deploy com Docker

## 📄 Licença

MIT

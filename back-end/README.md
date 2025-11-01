# 🎯 Vision API - Backend Estruturado

Sistema de detecção de objetos com ESP32-CAM usando Node.js + Express

## 📁 Estrutura do Projeto

```
back-end/
├── src/
│   ├── config/           # Configurações
│   ├── services/         # Lógica de negócio
│   ├── controllers/      # Controladores de rotas
│   ├── routes/           # Definição de rotas
│   ├── middleware/       # Middlewares
│   └── utils/            # Utilitários
├── public/               # Arquivos estáticos
│   └── viewer.html
├── docs/                 # Documentação
├── server.js             # Entrada principal
└── package.json
```

## 🚀 Instalação

```bash
npm install
```

## 🎬 Execução

```bash
npm start
```

## 📚 Documentação

Acesse a documentação Swagger em:

```
http://localhost:3000/api/docs
```

## 🔧 Configuração

Edite `src/config/esp32.config.js` para configurar o IP do ESP32-CAM.

## 🌐 Endpoints

- `GET /api/esp32/test` - Testa conexão
- `GET /api/esp32/capture` - Captura frame (JSON)
- `GET /api/esp32/capture-image` - Captura com bounding boxes
- `POST /api/esp32/config` - Configura ESP32
- `GET /api/status` - Status do servidor
- `GET /api/history` - Histórico de detecções
- `DELETE /api/history` - Limpa histórico
- `GET /viewer` - Interface web
- `GET /api/docs` - Documentação Swagger

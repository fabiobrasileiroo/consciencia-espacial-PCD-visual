/**
 * Sistema de Detecção de Objetos - Backend Modular
 * Servidor Express + WebSocket + Swagger
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configurações
const serverConfig = require('./src/config/server.config');
const esp32Config = require('./src/config/esp32.config');

// Rotas
const apiRoutes = require('./src/routes');
const statusController = require('./src/controllers/status.controller');

// Serviços
const historyService = require('./src/services/history.service');

// Criar app Express
const app = express();

// ==================== MIDDLEWARES ====================
app.use(cors(serverConfig.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== SWAGGER ====================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: serverConfig.name,
      version: serverConfig.version,
      description: 'API para detecção de objetos com ESP32-CAM. Sistema modular com captura de imagens, processamento e histórico de detecções.',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${serverConfig.port}`,
        description: 'Servidor de Desenvolvimento'
      }
    ],
    tags: [
      {
        name: 'ESP32',
        description: 'Endpoints para comunicação com ESP32-CAM'
      },
      {
        name: 'Histórico',
        description: 'Endpoints para gerenciar histórico de detecções'
      },
      {
        name: 'Status',
        description: 'Endpoints para status e saúde do sistema'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rota da documentação Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: serverConfig.name
}));

// ==================== ROTAS ====================

// Health check
app.get('/health', statusController.healthCheck);

// Página inicial
app.get('/', statusController.index);

// Viewer
app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

// API Routes
app.use('/api', apiRoutes);

// ==================== WEBSOCKET ====================
let wss;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('✅ Cliente WebSocket conectado');

    ws.on('close', () => {
      console.log('❌ Cliente WebSocket desconectado');
    });

    ws.on('error', (error) => {
      console.error('❌ Erro WebSocket:', error.message);
    });
  });

  console.log(`📡 WebSocket rodando na porta ${serverConfig.wsPort}`);
}

// Broadcast para todos os clientes WebSocket
function broadcastDetection(data) {
  if (!wss) return;

  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Disponibilizar broadcast globalmente
global.broadcastDetection = broadcastDetection;

// ==================== ERROR HANDLING ====================

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ==================== INICIALIZAÇÃO ====================

function start() {
  // Servidor HTTP
  const server = app.listen(serverConfig.port, () => {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log(`║  ${serverConfig.name} v${serverConfig.version}  ║`);
    console.log('╚════════════════════════════════════════════╝');
    console.log(`\n🚀 Servidor rodando na porta ${serverConfig.port}`);
    console.log(`📚 Documentação: http://localhost:${serverConfig.port}/api/docs`);
    console.log(`👁️  Viewer: http://localhost:${serverConfig.port}/viewer`);
    console.log(`📡 ESP32-CAM: ${esp32Config.ip}\n`);
  });

  // Inicializar WebSocket
  initWebSocket(server);

  // Graceful shutdown
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  function shutdown() {
    console.log('\n🛑 Encerrando servidor...');

    server.close(() => {
      console.log('✅ Servidor HTTP encerrado');

      if (wss) {
        wss.close(() => {
          console.log('✅ WebSocket encerrado');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    // Forçar encerramento após 10s
    setTimeout(() => {
      console.error('⚠️ Forçando encerramento...');
      process.exit(1);
    }, 10000);
  }
}

// Iniciar servidor
if (require.main === module) {
  start();
}

module.exports = app;

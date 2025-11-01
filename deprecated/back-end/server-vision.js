/**
 * 🖥️ SERVIDOR DE VISÃO PARA PCD VISUAL
 * 
 * Recebe descrições de objetos do ESP32-CAM e envia para app mobile
 * via WebSocket para conversão text-to-speech
 */

import express, { json, urlencoded } from 'express';
import { Server, OPEN } from 'ws';
import cors from 'cors';
import cocoSsd from '@tensorflow-models/coco-ssd';
import { memory } from '@tensorflow/tfjs-node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use('/static', express.static(join(__dirname, 'public')));

const PORT = 3000;
let connectedClients = [];
const WS_PORT = 8080;

let connections = {
  test1: { port: 8885, class: 'module2-cam', display: 'Módulo 2 - Câmera', view: 'overlay' },
}

process.on('uncaughtException', function (error, origin) {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('🔍 Origin:', origin);
  console.table(memory)
  // Aqui você pode adicionar lógica para lidar com erros não capturados
});

process.on('unhandledRejection', function (reason, promise) {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.table(memory)
  // Aqui você pode adicionar lógica para lidar com promessas rejeitadas não tratadas
})

async function loadModel() {
  try {
    console.log('🔄 Carregando modelo COCO-SSD...')
    const model = await cocoSsd.load();
    console.log('✅ Modelo COCO-SSD carregado com sucesso!')
    return model;
  } catch (error) {
    console.error('❌ Erro ao carregar modelo COCO-SSD:', error);
    throw error;
  }
}

// Middleware
app.use(cors());
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true }));

// Armazenar histórico de detecções
let detectionHistory = [];
const MAX_HISTORY = 100;

// ===== WEBSOCKET SERVER =====
// Clients
const wss = new Server({ port: WS_PORT }, () => {
  console.log(`WebSocket Server running on ws://localhost:${WS_PORT}`);
})


wss.on('connection', (ws) => {
  console.log('📱 Cliente mobile conectado');

  // Enviar histórico recente ao conectar
  ws.send(JSON.stringify({
    type: 'history',
    data: detectionHistory.slice(-10)
  }));

  ws.on('close', () => {
    console.log('📱 Cliente mobile desconectado');
  });
});

// Broadcast para todos os clientes conectados
function broadcastToClients(data) {
  const message = JSON.stringify(data);
  let sentCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  return sentCount;
}

// Sensors
Object.entries(connections).forEach(([key, settings]) => {
  const connection = connections[key];
  connection.sensors = {};
  const server = new Server({ port: settings.port });
  server.on('connection', ws => {
    console.log(`📡 Sensor conectado: ${settings.display} na porta ${settings.port}`);
    ws.on('message', (message, isBinary) => {
      try {
        if (isBinary) {
          connection.image = message.toString('base64');
        } else {
          const data = message.toString();
          connection.sensors = data.split(';').reduce((acc, curr) => {
            const [key, value] = curr.split('=');
            acc[key] = value;
            return acc;
          }, {});
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem do sensor:', error);
      }
    });
    ws.on('close', () => {
      console.log(`📡 Sensor desconectado: ${settings.display}`);
    });
  });
});

// ===== ROTAS HTTP =====

// Rota principal - recebe detecções do ESP32
app.post('/api/vision', (req, res) => {
    const { timestamp, description, confidence, deviceId } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Descrição é obrigatória'
      });
    }

    const detection = {
      id: Date.now(),
      timestamp: timestamp || Date.now(),
      description,
      confidence: confidence || 0.9,
      deviceId: deviceId || 'unknown',
      receivedAt: new Date().toISOString()
    };

    // Adicionar ao histórico
    detectionHistory.push(detection);
    if (detectionHistory.length > MAX_HISTORY) {
      detectionHistory.shift();
    }

    // Log no servidor
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 [${deviceId}] ${description}`);
    console.log(`⏰ ${detection.receivedAt}`);
    console.log(`📊 Confiança: ${(confidence * 100).toFixed(1)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Enviar para clientes WebSocket (app mobile)
    const clientsNotified = broadcastToClients({
      type: 'vision',
      data: detection
    });

    res.json({
      success: true,
      clientsNotified,
      detectionId: detection.id
    });
  });

  // Status do servidor
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'online',
      uptime: process.uptime(),
      totalDetections: detectionHistory.length,
      connectedClients: wss.clients.size,
      lastDetection: detectionHistory[detectionHistory.length - 1] || null
    });
  });

  // Histórico de detecções
  app.get('/api/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json({
      total: detectionHistory.length,
      detections: detectionHistory.slice(-limit)
    });
  });

  // Limpar histórico
  app.delete('/api/history', (req, res) => {
    const count = detectionHistory.length;
    detectionHistory = [];
    res.json({
      success: true,
      cleared: count
    });
  });

  // Health check
  app.get('/health', (req, res) => {
    res.send('OK');
  });

  // Rota raiz
  app.get('/', (req, res) => {
    res.json({
      name: 'Servidor de Visão para PCD',
      version: '1.0.0',
      endpoints: {
        vision: 'POST /api/vision',
        status: 'GET /api/status',
        history: 'GET /api/history?limit=50',
        clearHistory: 'DELETE /api/history'
      },
      websocket: `ws://localhost:${WS_PORT}`
    });
  });

  // ===== INICIAR SERVIDORES =====
  app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  👁️  SERVIDOR DE VISÃO PARA PCD        ║');
    console.log('╚══════════════════════════════════════════╝\n');
    console.log(`🌐 HTTP Server: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);
    console.log('\n📋 Endpoints disponíveis:');
    console.log(`   POST   http://localhost:${PORT}/api/vision`);
    console.log(`   GET    http://localhost:${PORT}/api/status`);
    console.log(`   GET    http://localhost:${PORT}/api/history`);
    console.log(`   DELETE http://localhost:${PORT}/api/history`);
    console.log('\n✅ Servidor pronto para receber detecções!\n');
  });

  // Tratamento de erros
  process.on('uncaughtException', (err) => {
    console.error('❌ Erro não tratado:', err);
  });

  process.on('SIGINT', () => {
    console.log('\n👋 Encerrando servidor...');
    process.exit(0);
  });

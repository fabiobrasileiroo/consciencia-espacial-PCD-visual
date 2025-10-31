/**
 * 🖥️ SERVIDOR DE VISÃO PARA PCD VISUAL COM ESP32-CAM
 * 
 * Captura stream do ESP32-CAM, processa com TensorFlow e envia 
 * descrições para app mobile via WebSocket
 */

import express, { json, urlencoded } from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import cocoSsd from '@tensorflow-models/coco-ssd';
import { node } from '@tensorflow/tfjs-node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { createCanvas, loadImage } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use('/static', express.static(join(__dirname, 'public')));

const PORT = 3000;
const WS_PORT = 8080;

// ===== CONFIGURAÇÃO DO ESP32-CAM =====
const ESP32_CAM_CONFIG = {
  // Altere para o IP do seu ESP32-CAM
  ip: 'http://10.178.228.139',  // MODIFIQUE AQUI!
  streamPort: 81,
  captureInterval: 2000, // Capturar frame a cada 2 segundos
  minConfidence: 0.5,    // Confiança mínima para detecção
  maxDetectionsPerFrame: 5
};

// Construir URLs do ESP32-CAM
const ESP32_URLS = {
  stream: `http://${ESP32_CAM_CONFIG.ip}:${ESP32_CAM_CONFIG.streamPort}/stream`,
  capture: `http://${ESP32_CAM_CONFIG.ip}/capture`,
  status: `http://${ESP32_CAM_CONFIG.ip}/status`
};

let model = null;
let isProcessing = false;
let lastDetections = [];
let detectionHistory = [];
const MAX_HISTORY = 100;

// ===== CARREGAR MODELO TENSORFLOW =====
async function loadModel() {
  try {
    console.log('🔄 Carregando modelo COCO-SSD...');
    model = await cocoSsd.load();
    console.log('✅ Modelo COCO-SSD carregado com sucesso!');
    return model;
  } catch (error) {
    console.error('❌ Erro ao carregar modelo COCO-SSD:', error);
    throw error;
  }
}

// ===== CAPTURAR FRAME DO ESP32-CAM =====
async function captureFrame() {
  try {
    const response = await axios.get(ESP32_URLS.capture, {
      responseType: 'arraybuffer',
      timeout: 5000
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('❌ Erro ao capturar frame do ESP32-CAM:', error.message);
    return null;
  }
}

// ===== PROCESSAR IMAGEM COM TENSORFLOW =====
async function processImageWithTensorFlow(imageBuffer) {
  if (!model) {
    console.error('❌ Modelo não carregado');
    return [];
  }

  try {
    // Carregar imagem usando canvas
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Detectar objetos
    const predictions = await model.detect(canvas);

    // Filtrar por confiança mínima
    const filtered = predictions
      .filter(p => p.score >= ESP32_CAM_CONFIG.minConfidence)
      .slice(0, ESP32_CAM_CONFIG.maxDetectionsPerFrame);

    return filtered;

  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error.message);
    return [];
  }
}

// ===== GERAR DESCRIÇÃO EM PORTUGUÊS =====
function generateDescription(predictions) {
  if (predictions.length === 0) {
    return 'Nenhum objeto detectado';
  }

  const translations = {
    'person': 'pessoa',
    'car': 'carro',
    'bicycle': 'bicicleta',
    'dog': 'cachorro',
    'cat': 'gato',
    'chair': 'cadeira',
    'table': 'mesa',
    'bottle': 'garrafa',
    'cup': 'xícara',
    'phone': 'telefone',
    'laptop': 'notebook',
    'keyboard': 'teclado',
    'mouse': 'mouse',
    'book': 'livro',
    'clock': 'relógio',
    'door': 'porta',
    'window': 'janela',
    'bag': 'bolsa',
    'backpack': 'mochila',
    'umbrella': 'guarda-chuva'
  };

  const items = predictions.map(p => {
    const name = translations[p.class] || p.class;
    const confidence = (p.score * 100).toFixed(0);
    return `${name} (${confidence}%)`;
  });

  if (items.length === 1) {
    return `Detectado: ${items[0]}`;
  }

  return `Detectados ${items.length} objetos: ${items.join(', ')}`;
}

// ===== LOOP DE PROCESSAMENTO =====
async function startCameraProcessing() {
  console.log('📸 Iniciando processamento da câmera ESP32-CAM...');
  console.log(`📡 Stream URL: ${ESP32_URLS.capture}`);

  setInterval(async () => {
    if (isProcessing) {
      return; // Evitar processamento concorrente
    }

    isProcessing = true;

    try {
      // 1. Capturar frame
      const frameBuffer = await captureFrame();
      if (!frameBuffer) {
        isProcessing = false;
        return;
      }

      // 2. Processar com TensorFlow
      const predictions = await processImageWithTensorFlow(frameBuffer);

      // 3. Verificar se há mudanças significativas
      const hasChanges = JSON.stringify(predictions.map(p => p.class)) !==
        JSON.stringify(lastDetections.map(p => p.class));

      if (predictions.length > 0 && hasChanges) {
        lastDetections = predictions;

        // 4. Gerar descrição
        const description = generateDescription(predictions);

        // 5. Criar objeto de detecção
        const detection = {
          id: Date.now(),
          timestamp: Date.now(),
          description,
          objects: predictions.map(p => ({
            class: p.class,
            confidence: p.score,
            bbox: p.bbox
          })),
          deviceId: 'esp32-cam',
          receivedAt: new Date().toISOString()
        };

        // 6. Adicionar ao histórico
        detectionHistory.push(detection);
        if (detectionHistory.length > MAX_HISTORY) {
          detectionHistory.shift();
        }

        // 7. Log no servidor
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🎯 ${description}`);
        console.log(`⏰ ${detection.receivedAt}`);
        predictions.forEach(p => {
          console.log(`   📦 ${p.class}: ${(p.score * 100).toFixed(1)}%`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // 8. Broadcast para clientes
        broadcastToClients({
          type: 'vision',
          data: detection
        });
      }

    } catch (error) {
      console.error('❌ Erro no loop de processamento:', error.message);
    } finally {
      isProcessing = false;
    }

  }, ESP32_CAM_CONFIG.captureInterval);
}

// ===== WEBSOCKET SERVER (CLIENTES MOBILE) =====
const wss = new WebSocketServer({ port: WS_PORT }, () => {
  console.log(`🔌 WebSocket Server: ws://localhost:${WS_PORT}`);
});

wss.on('connection', (ws) => {
  console.log('📱 Cliente mobile conectado');

  // Enviar histórico recente
  ws.send(JSON.stringify({
    type: 'history',
    data: detectionHistory.slice(-10)
  }));

  // Enviar última detecção
  if (lastDetections.length > 0) {
    ws.send(JSON.stringify({
      type: 'current',
      data: {
        description: generateDescription(lastDetections),
        objects: lastDetections
      }
    }));
  }

  ws.on('close', () => {
    console.log('📱 Cliente mobile desconectado');
  });
});

// Broadcast para clientes
function broadcastToClients(data) {
  const message = JSON.stringify(data);
  let sentCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(message);
      sentCount++;
    }
  });

  return sentCount;
}

// ===== MIDDLEWARE =====
app.use(cors());
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true }));

// ===== ROTAS HTTP =====

// Testar conexão com ESP32-CAM
app.get('/api/esp32/test', async (req, res) => {
  try {
    const response = await axios.get(ESP32_URLS.status, { timeout: 3000 });
    res.json({
      success: true,
      status: 'ESP32-CAM online',
      data: response.data
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'ESP32-CAM offline',
      error: error.message
    });
  }
});

// Capturar e processar frame manualmente
app.get('/api/esp32/capture', async (req, res) => {
  try {
    const frameBuffer = await captureFrame();
    if (!frameBuffer) {
      return res.status(500).json({ success: false, error: 'Falha ao capturar frame' });
    }

    const predictions = await processImageWithTensorFlow(frameBuffer);
    const description = generateDescription(predictions);

    res.json({
      success: true,
      description,
      objects: predictions,
      timestamp: Date.now()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Configurar IP do ESP32-CAM
app.post('/api/esp32/config', (req, res) => {
  const { ip, streamPort, captureInterval } = req.body;

  if (ip) ESP32_CAM_CONFIG.ip = ip;
  if (streamPort) ESP32_CAM_CONFIG.streamPort = streamPort;
  if (captureInterval) ESP32_CAM_CONFIG.captureInterval = captureInterval;

  res.json({
    success: true,
    config: ESP32_CAM_CONFIG
  });
});

// Status do servidor
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    modelLoaded: model !== null,
    esp32Config: ESP32_CAM_CONFIG,
    totalDetections: detectionHistory.length,
    connectedClients: wss.clients.size,
    lastDetection: detectionHistory[detectionHistory.length - 1] || null,
    currentObjects: lastDetections.length
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
  lastDetections = [];
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
    name: 'Servidor de Visão para PCD com ESP32-CAM',
    version: '2.0.0',
    esp32: ESP32_CAM_CONFIG,
    endpoints: {
      testESP32: 'GET /api/esp32/test',
      capture: 'GET /api/esp32/capture',
      config: 'POST /api/esp32/config',
      status: 'GET /api/status',
      history: 'GET /api/history?limit=50',
      clearHistory: 'DELETE /api/history'
    },
    websocket: `ws://localhost:${WS_PORT}`
  });
});

// ===== INICIAR SERVIDOR =====
async function startServer() {
  try {
    // 1. Carregar modelo TensorFlow
    await loadModel();

    // 2. Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log('\n╔══════════════════════════════════════════╗');
      console.log('║  👁️  SERVIDOR DE VISÃO COM ESP32-CAM   ║');
      console.log('╚══════════════════════════════════════════╝\n');
      console.log(`🌐 HTTP Server: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);
      console.log(`📡 ESP32-CAM IP: ${ESP32_CAM_CONFIG.ip}`);
      console.log(`📸 Captura: ${ESP32_URLS.capture}`);
      console.log(`⏱️  Intervalo: ${ESP32_CAM_CONFIG.captureInterval}ms`);
      console.log('\n📋 Endpoints disponíveis:');
      console.log(`   GET    http://localhost:${PORT}/api/esp32/test`);
      console.log(`   GET    http://localhost:${PORT}/api/esp32/capture`);
      console.log(`   POST   http://localhost:${PORT}/api/esp32/config`);
      console.log(`   GET    http://localhost:${PORT}/api/status`);
      console.log(`   GET    http://localhost:${PORT}/api/history`);
      console.log('\n✅ Servidor pronto!\n');
    });

    // 3. Aguardar 2 segundos e iniciar processamento da câmera
    setTimeout(() => {
      startCameraProcessing();
    }, 2000);

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// ===== TRATAMENTO DE ERROS =====
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não tratado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
});

process.on('SIGINT', () => {
  console.log('\n👋 Encerrando servidor...');
  process.exit(0);
});

// Iniciar!
startServer();

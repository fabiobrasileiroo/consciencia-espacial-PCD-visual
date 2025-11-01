/**
 * 🖥️ SERVIDOR DE VISÃO PARA PCD VISUAL COM ESP32-CAM STREAMING
 * 
 * Conecta ao stream MJPEG do ESP32-CAM, processa frames com TensorFlow
 * e envia descrições para app mobile via WebSocket
 */

const express = require('express');
const { json, urlencoded } = express;
const { WebSocketServer, WebSocket } = require('ws');
const cors = require('cors');
const cocoSsd = require('@tensorflow-models/coco-ssd');
require('@tensorflow/tfjs-node'); // habilita backend nativo do TF
const { join } = require('path');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// app.use('/static', express.static(join(__dirname, 'public')));

// Usar porta do ambiente (Render, Heroku, etc.) ou 3000 local
const PORT = process.env.PORT || 3000;
const WS_PORT = 8080;
const ESP32_WS_PORT = 8081;  // Nova porta para receber dados do ESP32-PAI

// Base URL para produção (ex: https://meu-projeto.onrender.com)
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ===== CONFIGURAÇÃO DO ESP32-CAM =====
const ESP32_CAM_CONFIG = {
  ip: '192.168.100.56',      // IP do seu ESP32-CAM (SEM http://)
  port: 81,                  // Porta do stream (padrão 81)
  endpoint: 'capture',       // 'capture' = RÁPIDO ✅ | 'stream' = DELAY ❌
  useStreaming: false,       // false = capture (RECOMENDADO)
  captureInterval: 1500,     // Intervalo reduzido: 1.5s (mais rápido!)
  minConfidence: 0.5,        // Confiança mínima para detecção
  maxDetectionsPerFrame: 5,  // Máximo de objetos por frame
  streamTimeout: 10000,      // Timeout para stream
  debug: false               // Logs reduzidos (melhor performance)
};

// Construir URLs do ESP32-CAM dinamicamente
const ESP32_URLS = {
  stream: `http://${ESP32_CAM_CONFIG.ip}:${ESP32_CAM_CONFIG.port}/stream`,
  capture: `http://${ESP32_CAM_CONFIG.ip}/capture`,
  status: `http://${ESP32_CAM_CONFIG.ip}/status`,
  control: `http://${ESP32_CAM_CONFIG.ip}/control`
};

// URL ativa baseada na configuração
const ACTIVE_ENDPOINT = ESP32_CAM_CONFIG.endpoint === 'stream'
  ? ESP32_URLS.stream
  : ESP32_URLS.capture;

let model = null;
let isProcessing = false;
let lastDetections = [];
let detectionHistory = [];
const MAX_HISTORY = 100;
let streamBuffer = Buffer.alloc(0);
let isStreamActive = false;
let lastFrameBuffer = null; // Armazenar último frame para API

// ===== ESTADO DOS ESP32s =====
let esp32Status = {
  pai: { connected: false, lastSeen: null },
  sensor: { connected: false, lastSeen: null, distance: null, level: null },
  motor: { connected: false, lastSeen: null, vibrationLevel: 0 },
  camera: { connected: false, lastSeen: null }
};

let systemAlerts = [];
const MAX_ALERTS = 50;
const SERVER_START_TIME = Date.now(); // Tempo de início do servidor

// ===== SSE CLIENTS =====
const sseClients = new Set();

// ===== CONFIGURAÇÃO DO SWAGGER =====
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vision API - Sistema de Detecção de Objetos ESP32-CAM',
      version: '2.1.0',
      description: `
# 🎯 API de Visão Computacional para PCD Visual

Sistema completo de detecção de objetos em tempo real usando ESP32-CAM e TensorFlow.js.

## 🚀 Recursos

- ✅ Detecção de objetos com modelo COCO-SSD (80 classes)
- ✅ Bounding boxes desenhadas automaticamente
- ✅ Traduções para português
- ✅ Captura automática configurável
- ✅ Stream de vídeo MJPEG
- ✅ WebSocket para tempo real
- ✅ Interface web interativa

## 📡 Conectar ESP32-CAM

Configure o IP do seu ESP32-CAM nas variáveis de ambiente ou diretamente no código.

**IP Atual:** \`${ESP32_CAM_CONFIG.ip}\`

## 🔌 WebSocket

Para receber detecções em tempo real via WebSocket, conecte em:

\`\`\`
ws://localhost:${WS_PORT}
\`\`\`

## 🖼️ Visualizador Web

Acesse o visualizador interativo em:

\`\`\`
http://localhost:${PORT}/viewer
\`\`\`
      `,
      contact: {
        name: 'InovaTech 2025',
        url: 'https://github.com/fabiobrasileiroo',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: BASE_URL,
        description: process.env.NODE_ENV === 'production' ? 'Servidor de Produção' : 'Servidor Local',
      },
    ],
    tags: [
      {
        name: 'ESP32',
        description: 'Endpoints para interação com ESP32-CAM',
      },
      {
        name: 'Captura',
        description: 'Captura e processamento de imagens',
      },
      {
        name: 'Histórico',
        description: 'Gerenciamento de histórico de detecções',
      },
      {
        name: 'Status',
        description: 'Informações e status do sistema',
      },
    ],
  },
  apis: ['./server-vision-streaming.js'], // Caminho para este arquivo
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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

// ===== CAPTURAR FRAME INDIVIDUAL =====
async function captureFrame() {
  try {
    // Se estiver em modo streaming, não deve usar esta função
    if (ESP32_CAM_CONFIG.useStreaming) {
      console.warn('⚠️  Modo streaming ativo, use connectToStream() ao invés de captureFrame()');
      return null;
    }

    if (ESP32_CAM_CONFIG.debug) {
      console.log(`📡 Capturando frame de ${ESP32_URLS.capture}...`);
    }

    // SEMPRE usar /capture para requisições GET individuais
    const response = await axios.get(ESP32_URLS.capture, {
      responseType: 'arraybuffer',
      timeout: 5000
    });

    const buffer = Buffer.from(response.data);

    if (ESP32_CAM_CONFIG.debug) {
      console.log(`✅ Frame capturado: ${buffer.length} bytes`);
    }

    return buffer;
  } catch (error) {
    console.error('❌ Erro ao capturar frame:', error.message);
    return null;
  }
}

// ===== OBTER FRAME (MODO ADAPTATIVO) =====
async function getFrame() {
  if (ESP32_CAM_CONFIG.useStreaming) {
    // Modo streaming: retornar último frame processado
    if (!lastFrameBuffer) {
      throw new Error('Nenhum frame disponível ainda. Aguarde o stream processar frames.');
    }
    console.log('📥 Usando último frame do stream');
    return lastFrameBuffer;
  } else {
    // Modo capture: capturar novo frame
    return await captureFrame();
  }
}

// ===== CONECTAR AO STREAM MJPEG =====
async function connectToStream() {
  console.log('📡 Conectando ao stream MJPEG...');
  console.log(`🔗 URL: ${ESP32_URLS.stream}`);

  try {
    const response = await axios({
      method: 'get',
      url: ESP32_URLS.stream,
      responseType: 'stream',
      timeout: ESP32_CAM_CONFIG.streamTimeout
    });

    isStreamActive = true;
    console.log('✅ Conectado ao stream!');
    console.log(`⏱️  Processando 1 frame a cada ${(ESP32_CAM_CONFIG.captureInterval / 1000).toFixed(1)}s`);
    console.log(`📥 Aguardando frames do ESP32...\n`);

    // Processar dados do stream
    response.data.on('data', (chunk) => {
      streamBuffer = Buffer.concat([streamBuffer, chunk]);

      // Procurar por boundary JPEG (FFD8 = início, FFD9 = fim)
      const startMarker = Buffer.from([0xFF, 0xD8]);
      const endMarker = Buffer.from([0xFF, 0xD9]);

      const startIndex = streamBuffer.indexOf(startMarker);
      const endIndex = streamBuffer.indexOf(endMarker);

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        // Frame JPEG completo encontrado
        const frameBuffer = streamBuffer.slice(startIndex, endIndex + 2);
        streamBuffer = streamBuffer.slice(endIndex + 2);

        // Processar frame (verificar intervalo dentro da função)
        processFrame(frameBuffer);
      }

      // Limitar tamanho do buffer
      if (streamBuffer.length > 5 * 1024 * 1024) { // 5MB
        console.warn('⚠️ Buffer muito grande, limpando...');
        streamBuffer = Buffer.alloc(0);
      }
    });

    response.data.on('end', () => {
      console.log('📡 Stream encerrado');
      isStreamActive = false;

      // Reconectar após 5 segundos
      setTimeout(() => {
        if (ESP32_CAM_CONFIG.useStreaming) {
          connectToStream();
        }
      }, 5000);
    });

    response.data.on('error', (error) => {
      console.error('❌ Erro no stream:', error.message);
      isStreamActive = false;
    });

  } catch (error) {
    console.error('❌ Erro ao conectar ao stream:', error.message);
    isStreamActive = false;

    // Tentar reconectar após 5 segundos
    setTimeout(() => {
      if (ESP32_CAM_CONFIG.useStreaming) {
        connectToStream();
      }
    }, 5000);
  }
}

// ===== PROCESSAR FRAME =====
let lastProcessTime = 0;
let frameCount = 0;
let totalFramesReceived = 0;

async function processFrame(frameBuffer) {
  totalFramesReceived++;
  const now = Date.now();

  // Respeitar intervalo mínimo entre processamentos
  if (now - lastProcessTime < ESP32_CAM_CONFIG.captureInterval) {
    // Mostrar que recebeu frame mas não processou
    if (totalFramesReceived % 10 === 0) {
      console.log(`📥 Recebendo frames... (${totalFramesReceived} frames recebidos)`);
    }
    return; // Pular este frame
  }

  // Se chegou aqui, pode processar
  frameCount++;
  lastProcessTime = now;
  isProcessing = true;

  try {
    console.log(`\n🔄 Processando frame #${frameCount} (${totalFramesReceived} recebidos)...`);

    // Armazenar frame para uso posterior (API endpoints)
    lastFrameBuffer = frameBuffer;

    // Processar com TensorFlow
    const predictions = await processImageWithTensorFlow(frameBuffer);

    // Verificar se há mudanças significativas
    const hasChanges = JSON.stringify(predictions.map(p => p.class)) !==
      JSON.stringify(lastDetections.map(p => p.class));

    // Sempre mostrar detecções, mesmo que não haja mudanças (para debugging)
    if (predictions.length > 0) {
      lastDetections = predictions;

      // Gerar descrição
      const description = generateDescription(predictions);

      // Criar objeto de detecção
      const detection = {
        id: Date.now(),
        timestamp: Date.now(),
        description,
        objects: predictions.map(p => ({
          class: p.class,
          classTranslated: translations[p.class] || p.class,
          confidence: p.score,
          bbox: p.bbox
        })),
        deviceId: 'esp32-cam',
        receivedAt: new Date().toISOString(),
        frameNumber: frameCount
      };

      // Adicionar ao histórico
      detectionHistory.push(detection);
      if (detectionHistory.length > MAX_HISTORY) {
        detectionHistory.shift();
      }

      // Log DETALHADO no servidor
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🎯 DETECÇÃO TENSORFLOW - Frame #${frameCount}`);
      console.log(`⏰ Timestamp: ${detection.receivedAt}`);
      console.log(`📝 Descrição: ${description}`);
      console.log(`📦 Objetos detectados (${predictions.length}):`);
      predictions.forEach((p, idx) => {
        const translated = translations[p.class] || p.class;
        console.log(`   ${idx + 1}. ${p.class} (${translated}): ${(p.score * 100).toFixed(1)}%`);
        console.log(`      📍 BBox: [${p.bbox.map(v => Math.round(v)).join(', ')}]`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Broadcast para clientes (apenas se houver mudanças)
      if (hasChanges) {
        const sentTo = broadcastToClients({
          type: 'vision',
          data: detection
        });

        if (sentTo > 0) {
          console.log(`📤 Enviado para ${sentTo} cliente(s) WebSocket`);
        }

        // Broadcast SSE - Enviar detecção em tempo real
        broadcastSSE('detection', {
          count: predictions.length,
          description: description,
          objects: predictions.map(p => ({
            name: translations[p.class] || p.class,
            confidence: Math.round(p.score * 100),
            bbox: p.bbox
          })),
          timestamp: detection.receivedAt
        });
        console.log(`📡 Enviado para ${sseClients.size} cliente(s) SSE\n`);
      }
    } else {
      console.log(`📸 Frame #${frameCount}: Nenhum objeto detectado`);
      console.log(`📊 Total de frames recebidos: ${totalFramesReceived}`);
      console.log(`⏱️  Próximo processamento em ~${(ESP32_CAM_CONFIG.captureInterval / 1000).toFixed(1)}s\n`);
    }

  } catch (error) {
    console.error('❌ Erro ao processar frame:', error.message);
  } finally {
    isProcessing = false;
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

// ===== TRADUÇÕES PT-BR =====
const translations = {
  'person': 'pessoa',
  'car': 'carro',
  'bicycle': 'bicicleta',
  'motorcycle': 'moto',
  'dog': 'cachorro',
  'cat': 'gato',
  'chair': 'cadeira',
  'couch': 'sofá',
  'table': 'mesa',
  'bottle': 'garrafa',
  'cup': 'xícara',
  'phone': 'telefone',
  'cell phone': 'celular',
  'laptop': 'notebook',
  'keyboard': 'teclado',
  'mouse': 'mouse',
  'book': 'livro',
  'clock': 'relógio',
  'door': 'porta',
  'window': 'janela',
  'bag': 'bolsa',
  'backpack': 'mochila',
  'umbrella': 'guarda-chuva',
  'tv': 'televisão',
  'bed': 'cama'
};

// ===== GERAR DESCRIÇÃO EM PORTUGUÊS =====
function generateDescription(predictions) {
  if (predictions.length === 0) {
    return 'Nenhum objeto detectado';
  }

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

// ===== DESENHAR BOUNDING BOXES NA IMAGEM =====
async function drawBoundingBoxes(imageBuffer, predictions) {
  try {
    // Carregar imagem
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Desenhar imagem original
    ctx.drawImage(img, 0, 0);

    // Desenhar cada detecção
    predictions.forEach((prediction, index) => {
      const [x, y, width, height] = prediction.bbox;
      const label = translations[prediction.class] || prediction.class;
      const confidence = (prediction.score * 100).toFixed(1);
      const text = `${label} ${confidence}%`;

      // Cores diferentes para cada objeto
      const colors = [
        '#00FF00', // Verde
        '#FF0000', // Vermelho
        '#0000FF', // Azul
        '#FFFF00', // Amarelo
        '#FF00FF', // Magenta
        '#00FFFF', // Ciano
        '#FFA500', // Laranja
        '#800080'  // Roxo
      ];
      const color = colors[index % colors.length];

      // Desenhar retângulo (bounding box)
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Preparar texto do label
      ctx.font = 'bold 16px Arial';
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = 20;

      // Desenhar fundo do label
      ctx.fillStyle = color;
      ctx.fillRect(x, y - textHeight - 4, textWidth + 10, textHeight + 4);

      // Desenhar texto do label
      ctx.fillStyle = '#000000';
      ctx.fillText(text, x + 5, y - 8);

      // Desenhar ponto central (opcional)
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Adicionar informações no canto superior esquerdo
    if (predictions.length > 0) {
      const info = `Objetos detectados: ${predictions.length}`;
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, ctx.measureText(info).width + 20, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(info, 20, 32);
    }

    // Converter canvas para buffer JPEG
    return canvas.toBuffer('image/jpeg', { quality: 0.95 });

  } catch (error) {
    console.error('❌ Erro ao desenhar bounding boxes:', error.message);
    return imageBuffer; // Retornar imagem original em caso de erro
  }
}

// ===== LOOP DE PROCESSAMENTO (MODO CAPTURA) =====
let captureIntervalId = null;

async function startCaptureProcessing() {
  console.log('📸 Iniciando processamento em modo CAPTURA...');
  console.log(`📡 URL: ${ESP32_URLS.capture}`);
  console.log(`⏱️  Intervalo de captura: ${ESP32_CAM_CONFIG.captureInterval}ms\n`);

  // Limpar intervalo anterior se existir
  if (captureIntervalId) {
    clearInterval(captureIntervalId);
  }

  // Primeira captura imediata
  (async () => {
    const frameBuffer = await captureFrame();
    if (frameBuffer) {
      await processFrame(frameBuffer);
    }
  })();

  // Configurar loop contínuo
  captureIntervalId = setInterval(async () => {
    // Se já estiver processando, pular esta iteração
    if (isProcessing) {
      console.log('⏭️  Pulando captura (processamento em andamento)');
      return;
    }

    try {
      const frameBuffer = await captureFrame();
      if (frameBuffer) {
        await processFrame(frameBuffer);
      } else {
        console.log('⚠️  Nenhum frame capturado');
      }
    } catch (error) {
      console.error('❌ Erro no loop de captura:', error.message);
    }

  }, ESP32_CAM_CONFIG.captureInterval);

  console.log('✅ Loop de captura iniciado!\n');
}

// ===== INICIAR SERVIDOR =====
async function startServer() {
  try {
    // 1. Carregar modelo TensorFlow
    await loadModel();

    // 2. Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log('\n╔══════════════════════════════════════════╗');
      console.log('║  👁️  SERVIDOR DE VISÃO COM ESP32-CAM   ║');
      console.log('╚══════════════════════════════════════════╝\n');
      console.log(`🌐 HTTP Server: ${BASE_URL}`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT} (mesmo servidor HTTP)`);
      console.log(`📡 ESP32-CAM IP: ${ESP32_CAM_CONFIG.ip}`);
      console.log(`📍 Endpoint ESP32: /${ESP32_CAM_CONFIG.endpoint} ${ESP32_CAM_CONFIG.endpoint === 'stream' ? '📹' : '📸'}`);
      console.log(`🎬 Modo: ${ESP32_CAM_CONFIG.useStreaming ? '📹 STREAMING' : '📸 CAPTURA'}`);
      console.log(`⏱️  Intervalo: ${ESP32_CAM_CONFIG.captureInterval}ms`);
      console.log(`🎯 Confiança mínima: ${(ESP32_CAM_CONFIG.minConfidence * 100).toFixed(0)}%`);
      console.log('\n📋 Endpoints disponíveis:');
      console.log(`   GET    ${BASE_URL}/api/esp32/test`);
      console.log(`   GET    ${BASE_URL}/api/esp32/capture`);
      console.log(`   GET    ${BASE_URL}/api/esp32/capture-image ✨`);
      console.log(`   GET    ${BASE_URL}/api/esp32/stream`);
      console.log(`   POST   ${BASE_URL}/api/esp32/config`);
      console.log(`   GET    ${BASE_URL}/api/status`);
      console.log('\n📚 Documentação Swagger:');
      console.log(`   👉 ${BASE_URL}/api/docs`);
      console.log('\n🖼️  Visualizador Web:');
      console.log(`   👉 ${BASE_URL}/viewer`);
      console.log('\n📸 API de Imagem com Detecções:');
      console.log(`   ${BASE_URL}/api/esp32/capture-image`);
      console.log('\n✅ Servidor pronto!\n');
    });

    // 3. Configurar WebSocket no mesmo servidor HTTP (compatível com Render)
    setupWebSockets(server);

    // 4. Aguardar 2 segundos e iniciar processamento
    setTimeout(() => {
      if (ESP32_CAM_CONFIG.useStreaming) {
        connectToStream();
      } else {
        startCaptureProcessing();
      }
    }, 2000);

    // 5. Iniciar broadcast periódico de status via SSE (a cada 2 segundos)
    setInterval(() => {
      if (sseClients.size > 0) {
        // Broadcast uptime
        broadcastSSE('uptime', {
          seconds: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
          formatted: formatUptime(Math.floor((Date.now() - SERVER_START_TIME) / 1000))
        });

        // Broadcast system status
        broadcastSSE('system-status', {
          modelLoaded: model !== null,
          esp32: esp32Status,
          connections: {
            websocket: wss.clients.size,
            sse: sseClients.size
          },
          mode: ESP32_CAM_CONFIG.useStreaming ? 'streaming' : 'capture'
        });

        // Broadcast current detections
        broadcastCurrentDetections();
      }
    }, 2000); // Reduzido para 2s para atualizações mais frequentes

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// ===== CONFIGURAR WEBSOCKETS (UNIFICADO NO MESMO SERVIDOR HTTP) =====
let wss;
let esp32WebSocketServer;
let esp32PaiConnection = null;

function setupWebSockets(httpServer) {
  // WebSocket para clientes mobile (app)
  wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

  console.log(`🔌 WebSocket para App Mobile: ws://localhost:${PORT}/ws`);

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

  // WebSocket para ESP32-PAI
  esp32WebSocketServer = new WebSocketServer({ 
    server: httpServer,
    path: '/esp32'
  });

  console.log(`🔌 WebSocket para ESP32-PAI: ws://localhost:${PORT}/esp32`);
  console.log(`   Configure o ESP32-PAI com: ws://<seu-ip>:${PORT}/esp32\n`);

  esp32WebSocketServer.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`\n🤝 ESP32 conectado: ${clientIp}`);
    
    esp32PaiConnection = ws;
    
    // Enviar mensagem de boas-vindas
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Servidor Node.js pronto!',
      timestamp: Date.now()
    }));

    // Receber mensagens do ESP32
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleESP32Message(message);
      } catch (err) {
        console.error('❌ Erro ao processar mensagem ESP32:', err);
      }
    });

    // Tratar desconexão
    ws.on('close', () => {
      console.log('❌ ESP32 desconectado');
      esp32PaiConnection = null;
      
      // Marcar todos os módulos como offline
      updateESP32Status('pai', false);
      updateESP32Status('sensor', false);
      updateESP32Status('motor', false);
      updateESP32Status('camera', false);
    });

    ws.on('error', (err) => {
      console.error('❌ Erro WebSocket ESP32:', err);
    });

    // Enviar ping a cada 30s para manter conexão viva
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });

  esp32WebSocketServer.on('error', (err) => {
    console.error('❌ Erro no servidor WebSocket ESP32:', err);
  });
}

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

// ===== SWAGGER UI =====
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Vision API - Documentação',
  customfavIcon: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png',
}));

// Rota para JSON do Swagger
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ===== ROTAS HTTP =====

/**
 * @swagger
 * /api/esp32/test:
 *   get:
 *     summary: 🔧 Testa conexão com ESP32-CAM
 *     description: Verifica se o ESP32-CAM está acessível e respondendo
 *     tags: [ESP32]
 *     responses:
 *       200:
 *         description: ESP32-CAM está online
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: ESP32-CAM online
 *                 ip:
 *                   type: string
 *                   example: 192.168.100.56
 *                 mode:
 *                   type: string
 *                   example: capture
 *                 data:
 *                   type: object
 *       503:
 *         description: ESP32-CAM está offline
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 status:
 *                   type: string
 *                   example: ESP32-CAM offline
 *                 error:
 *                   type: string
 */
// Testar conexão com ESP32-CAM
app.get('/api/esp32/test', async (req, res) => {
  try {
    const response = await axios.get(ESP32_URLS.status, { timeout: 3000 });
    res.json({
      success: true,
      status: 'ESP32-CAM online',
      ip: ESP32_CAM_CONFIG.ip,
      mode: ESP32_CAM_CONFIG.useStreaming ? 'streaming' : 'capture',
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

/**
 * @swagger
 * /api/esp32/capture:
 *   get:
 *     summary: 📸 Captura e processa frame (JSON)
 *     description: Captura uma imagem do ESP32-CAM, processa com TensorFlow e retorna os dados das detecções em formato JSON
 *     tags: [Captura]
 *     responses:
 *       200:
 *         description: Frame capturado e processado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 description:
 *                   type: string
 *                   example: Detectados 2 objetos pessoa (95%), cadeira (87%)
 *                 objects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       class:
 *                         type: string
 *                         example: person
 *                       score:
 *                         type: number
 *                         example: 0.95
 *                       bbox:
 *                         type: array
 *                         items:
 *                           type: number
 *                         example: [100, 150, 200, 400]
 *                 timestamp:
 *                   type: number
 *                   example: 1730476800000
 *       500:
 *         description: Erro ao capturar ou processar frame
 */
// Capturar e processar frame manualmente (JSON)
app.get('/api/esp32/capture', async (req, res) => {
  try {
    const frameBuffer = await getFrame(); // Usar getFrame() ao invés de captureFrame()
    if (!frameBuffer) {
      return res.status(500).json({ success: false, error: 'Falha ao obter frame' });
    }

    const predictions = await processImageWithTensorFlow(frameBuffer);
    const description = generateDescription(predictions);

    res.json({
      success: true,
      description,
      objects: predictions,
      timestamp: Date.now(),
      mode: ESP32_CAM_CONFIG.useStreaming ? 'streaming' : 'capture'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/esp32/capture-image:
 *   get:
 *     summary: 🖼️ Captura imagem com detecções desenhadas
 *     description: |
 *       Captura uma imagem do ESP32-CAM, processa com TensorFlow e retorna a imagem JPEG
 *       com bounding boxes desenhadas ao redor dos objetos detectados.
 *       
 *       ### Headers de Resposta Personalizados:
 *       - `X-Objects-Detected`: Número de objetos detectados
 *       - `X-Description`: Descrição em português dos objetos
 *     tags: [Captura]
 *     responses:
 *       200:
 *         description: Imagem JPEG com bounding boxes
 *         headers:
 *           X-Objects-Detected:
 *             description: Número de objetos detectados
 *             schema:
 *               type: integer
 *               example: 2
 *           X-Description:
 *             description: Descrição em português
 *             schema:
 *               type: string
 *               example: Detectados 2 objetos pessoa (95%), cadeira (87%)
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Erro ao capturar ou processar imagem
 */
// Capturar frame com bounding boxes desenhadas (Imagem JPEG)
app.get('/api/esp32/capture-image', async (req, res) => {
  try {
    console.log('📸 Capturando imagem com detecções...');

    const frameBuffer = await getFrame(); // Usar getFrame() ao invés de captureFrame()
    if (!frameBuffer) {
      return res.status(500).json({ success: false, error: 'Falha ao obter frame' });
    }

    // Processar com TensorFlow
    const predictions = await processImageWithTensorFlow(frameBuffer);
    console.log(`✅ Detectados ${predictions.length} objetos`);

    // Desenhar bounding boxes
    const imageWithBoxes = await drawBoundingBoxes(frameBuffer, predictions);

    // Enviar imagem como resposta
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': imageWithBoxes.length,
      'X-Objects-Detected': predictions.length,
      'X-Description': generateDescription(predictions),
      'X-Mode': ESP32_CAM_CONFIG.useStreaming ? 'streaming' : 'capture'
    });

    res.send(imageWithBoxes);
    console.log('✅ Imagem enviada com bounding boxes\n');

  } catch (error) {
    console.error('❌ Erro ao capturar imagem:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/esp32/config:
 *   post:
 *     summary: ⚙️ Configura parâmetros do ESP32-CAM
 *     description: Atualiza configurações de processamento e modo de operação
 *     tags: [ESP32]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ip:
 *                 type: string
 *                 description: IP do ESP32-CAM
 *                 example: 192.168.100.56
 *               useStreaming:
 *                 type: boolean
 *                 description: Usar modo streaming (true) ou captura (false)
 *                 example: false
 *               captureInterval:
 *                 type: number
 *                 description: Intervalo entre capturas em milissegundos
 *                 example: 2000
 *               minConfidence:
 *                 type: number
 *                 description: Confiança mínima para detecção (0-1)
 *                 example: 0.5
 *     responses:
 *       200:
 *         description: Configuração atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 config:
 *                   type: object
 */
// Configurar ESP32-CAM
app.post('/api/esp32/config', (req, res) => {
  const { ip, useStreaming, captureInterval, minConfidence } = req.body;

  const oldMode = ESP32_CAM_CONFIG.useStreaming;

  if (ip) ESP32_CAM_CONFIG.ip = ip;
  if (typeof useStreaming !== 'undefined') ESP32_CAM_CONFIG.useStreaming = useStreaming;
  if (captureInterval) ESP32_CAM_CONFIG.captureInterval = captureInterval;
  if (minConfidence) ESP32_CAM_CONFIG.minConfidence = minConfidence;

  // Se mudou de modo, reiniciar processamento
  if (oldMode !== ESP32_CAM_CONFIG.useStreaming) {
    console.log(`🔄 Mudando para modo: ${ESP32_CAM_CONFIG.useStreaming ? 'STREAMING' : 'CAPTURA'}`);

    if (ESP32_CAM_CONFIG.useStreaming) {
      connectToStream();
    }
  }

  res.json({
    success: true,
    config: ESP32_CAM_CONFIG
  });
});

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: 📊 Status do servidor
 *     description: Retorna informações sobre o estado atual do servidor e estatísticas
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Status do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: online
 *                 uptime:
 *                   type: number
 *                   example: 3600.5
 *                 modelLoaded:
 *                   type: boolean
 *                   example: true
 *                 esp32Config:
 *                   type: object
 *                 streamActive:
 *                   type: boolean
 *                   example: false
 *                 mode:
 *                   type: string
 *                   example: capture
 *                 totalDetections:
 *                   type: number
 *                   example: 42
 *                 connectedClients:
 *                   type: number
 *                   example: 2
 *                 lastDetection:
 *                   type: object
 *                   nullable: true
 *                 currentObjects:
 *                   type: number
 *                   example: 3
 */
// Status do servidor
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    modelLoaded: model !== null,
    esp32Config: ESP32_CAM_CONFIG,
    streamActive: isStreamActive,
    mode: ESP32_CAM_CONFIG.useStreaming ? 'streaming' : 'capture',
    totalDetections: detectionHistory.length,
    connectedClients: wss.clients.size,
    lastDetection: detectionHistory[detectionHistory.length - 1] || null,
    currentObjects: lastDetections.length
  });
});

/**
 * @swagger
 * /api/detections/current:
 *   get:
 *     summary: 🎯 Objetos detectados AGORA (Real-Time)
 *     description: |
 *       Retorna os objetos detectados na última análise em formato simples.
 *       Ideal para transcrição/narração em apps para PCD visual.
 *       
 *       **Retorna vazio se nenhum objeto foi detectado.**
 *     tags: [Captura]
 *     responses:
 *       200:
 *         description: Objetos detectados atualmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 detecting:
 *                   type: boolean
 *                   description: Se há objetos sendo detectados agora
 *                   example: true
 *                 count:
 *                   type: number
 *                   description: Quantidade de objetos detectados
 *                   example: 2
 *                 description:
 *                   type: string
 *                   description: Descrição em português para narração
 *                   example: "Detectados 2 objetos: pessoa e cadeira"
 *                 objects:
 *                   type: array
 *                   description: Lista de objetos detectados
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: pessoa
 *                       confidence:
 *                         type: number
 *                         example: 87
 *                       position:
 *                         type: string
 *                         example: centro
 *                 timestamp:
 *                   type: string
 *                   example: "2025-11-01T21:20:09.058Z"
 *                 secondsAgo:
 *                   type: number
 *                   description: Há quantos segundos foi detectado
 *                   example: 2
 */
app.get('/api/detections/current', (req, res) => {
  // Se não há detecções recentes
  if (lastDetections.length === 0 || detectionHistory.length === 0) {
    return res.json({
      detecting: false,
      count: 0,
      description: "Nenhum objeto detectado no momento",
      objects: [],
      timestamp: new Date().toISOString(),
      secondsAgo: null
    });
  }

  const lastDetection = detectionHistory[detectionHistory.length - 1];
  const now = Date.now();
  const secondsAgo = Math.floor((now - lastDetection.timestamp) / 1000);

  // Formatar objetos para narração
  const objects = lastDetection.objects.map(obj => {
    // Calcular posição aproximada (esquerda, centro, direita)
    const [x, y, width, height] = obj.bbox;
    const centerX = x + width / 2;
    let position = 'centro';

    // Assumindo imagem de 640px de largura (padrão ESP32)
    if (centerX < 213) position = 'esquerda';
    else if (centerX > 427) position = 'direita';

    return {
      name: obj.classTranslated,
      confidence: Math.round(obj.confidence * 100),
      position: position
    };
  });

  // Criar descrição simplificada
  const objectNames = objects.map(o => o.name).join(', ');
  let description;

  if (objects.length === 1) {
    description = `Detectado: ${objectNames}`;
  } else {
    description = `Detectados ${objects.length} objetos: ${objectNames}`;
  }

  res.json({
    detecting: true,
    count: objects.length,
    description: description,
    objects: objects,
    timestamp: lastDetection.receivedAt,
    secondsAgo: secondsAgo
  });
});

/**
 * @swagger
 * /api/stream/events:
 *   get:
 *     summary: 📡 SSE - Stream de Eventos em Tempo Real
 *     description: |
 *       Server-Sent Events (SSE) para receber dados em tempo real:
 *       - Detecções de objetos
 *       - Status dos ESP32s (pai, sensor, motor, câmera)
 *       - Distância medida (baixo/médio/alto)
 *       - Avisos e alertas
 *       - Tempo de uso do sistema
 *     tags: [Real-Time]
 *     responses:
 *       200:
 *         description: Stream SSE ativo
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
app.get('/api/stream/events', (req, res) => {
  // Configurar headers SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Adicionar cliente ao conjunto
  sseClients.add(res);

  console.log(`📡 Cliente SSE conectado (total: ${sseClients.size})`);

  // Enviar evento inicial de conexão
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    message: 'Conectado ao stream SSE',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Enviar status inicial
  sendSSEUpdate(res, 'system-status', {
    uptime: process.uptime(),
    esp32: esp32Status,
    modelLoaded: model !== null,
    mode: ESP32_CAM_CONFIG.useStreaming ? 'streaming' : 'capture'
  });

  // Heartbeat a cada 15 segundos
  const heartbeatInterval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeatInterval);
      return;
    }
    res.write(`: heartbeat\n\n`);
  }, 15000);

  // Quando cliente desconectar
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    sseClients.delete(res);
    console.log(`📡 Cliente SSE desconectado (restantes: ${sseClients.size})`);
  });
});

/**
 * @swagger
 * /api/esp32/status-update:
 *   post:
 *     summary: 📊 Atualizar Status dos ESP32s
 *     description: Endpoint para ESP32-PAI enviar status dos módulos
 *     tags: [ESP32]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moduleId:
 *                 type: string
 *                 enum: [pai, sensor, motor, camera]
 *                 example: sensor
 *               connected:
 *                 type: boolean
 *                 example: true
 *               distance:
 *                 type: number
 *                 description: Distância em cm (apenas módulo sensor)
 *                 example: 45
 *               vibrationLevel:
 *                 type: number
 *                 description: Nível de vibração 0-3 (apenas módulo motor)
 *                 example: 2
 *     responses:
 *       200:
 *         description: Status atualizado
 */
app.post('/api/esp32/status-update', (req, res) => {
  const { moduleId, connected, distance, vibrationLevel } = req.body;

  if (!moduleId || !['pai', 'sensor', 'motor', 'camera'].includes(moduleId)) {
    return res.status(400).json({ error: 'moduleId inválido' });
  }

  const now = new Date().toISOString();

  // Atualizar status do módulo
  esp32Status[moduleId] = {
    ...esp32Status[moduleId],
    connected: connected !== undefined ? connected : esp32Status[moduleId].connected,
    lastSeen: now
  };

  // Atualizar dados específicos
  if (moduleId === 'sensor' && distance !== undefined) {
    let level = 'livre';
    if (distance < 20) level = 'alto';
    else if (distance < 50) level = 'médio';
    else if (distance < 100) level = 'baixo';

    esp32Status.sensor.distance = distance;
    esp32Status.sensor.level = level;

    // Criar alerta se necessário
    if (distance < 20) {
      addAlert('danger', `⚠️ PERIGO! Objeto muito próximo: ${distance}cm`);
    } else if (distance < 50) {
      addAlert('warning', `⚠️ Atenção! Objeto a ${distance}cm`);
    }
  }

  if (moduleId === 'motor' && vibrationLevel !== undefined) {
    esp32Status.motor.vibrationLevel = vibrationLevel;
  }

  // Broadcast via SSE
  broadcastSSE('esp32-status', {
    module: moduleId,
    status: esp32Status[moduleId],
    timestamp: now
  });

  res.json({
    success: true,
    status: esp32Status[moduleId]
  });
});

/**
 * @swagger
 * /api/esp32/command:
 *   post:
 *     summary: 🎮 Enviar comando remoto ao ESP32-PAI
 *     description: |
 *       Envia comandos via WebSocket para o ESP32-PAI.
 *       
 *       **Comandos disponíveis:**
 *       - `set_vibration`: Define nível de vibração manual (0-255)
 *       - `test_motor`: Testa motor com padrão (3 pulsos)
 *       - `calibrate_sensor`: Calibra sensor de distância
 *       - `reboot`: Reinicia ESP32-PAI
 *       - `get_status`: Solicita status completo
 *     tags: [ESP32]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - command
 *             properties:
 *               command:
 *                 type: string
 *                 description: Nome do comando
 *                 enum: [set_vibration, test_motor, calibrate_sensor, reboot, get_status]
 *                 example: test_motor
 *               value:
 *                 type: number
 *                 description: Valor para comando (se necessário)
 *                 example: 128
 *     responses:
 *       200:
 *         description: Comando enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Comando enviado ao ESP32-PAI
 *                 command:
 *                   type: object
 *       503:
 *         description: ESP32-PAI não conectado
 */
app.post('/api/esp32/command', (req, res) => {
  const { command, value } = req.body;

  if (!command) {
    return res.status(400).json({ 
      success: false, 
      error: 'Campo "command" obrigatório' 
    });
  }

  // Comandos válidos
  const validCommands = ['set_vibration', 'test_motor', 'calibrate_sensor', 'reboot', 'get_status'];
  
  if (!validCommands.includes(command)) {
    return res.status(400).json({
      success: false,
      error: `Comando inválido. Use: ${validCommands.join(', ')}`
    });
  }

  // Criar objeto de comando
  const commandObj = {
    type: 'command',
    command,
    timestamp: Date.now()
  };

  // Adicionar valor se fornecido
  if (value !== undefined) {
    commandObj.value = value;
  }

  // Enviar ao ESP32
  const sent = sendCommandToESP32(commandObj);

  if (sent) {
    res.json({
      success: true,
      message: 'Comando enviado ao ESP32-PAI',
      command: commandObj
    });

    // Broadcast via SSE
    broadcastToSSEClients('esp32-command', {
      command,
      value,
      timestamp: Date.now()
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'ESP32-PAI não conectado ao WebSocket'
    });
  }
});

// Função auxiliar para enviar SSE
function sendSSEUpdate(client, eventType, data) {
  try {
    if (!client.writableEnded) {
      client.write(`event: ${eventType}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  } catch (error) {
    console.error('Erro ao enviar SSE:', error.message);
  }
}

// Broadcast para todos os clientes SSE
function broadcastSSE(eventType, data) {
  sseClients.forEach(client => {
    sendSSEUpdate(client, eventType, data);
  });
}

// Alias para compatibilidade
const broadcastToSSEClients = broadcastSSE;

// Adicionar alerta
function addAlert(level, message) {
  const alert = {
    id: Date.now(),
    level, // info, warning, danger
    message,
    timestamp: new Date().toISOString()
  };

  systemAlerts.unshift(alert);
  if (systemAlerts.length > MAX_ALERTS) {
    systemAlerts.pop();
  }

  // Broadcast alerta via SSE
  broadcastSSE('alert', alert);
}

/**
 * @swagger
 * /api/history:
 *   get:
 *     summary: 🎯 Objetos detectados AGORA (Real-Time)
 *     description: |
 *       Retorna os objetos detectados na última análise em formato simples.
 *       Ideal para transcrição/narração em apps para PCD visual.
 *       
 *       **Retorna vazio se nenhum objeto foi detectado.**
 *     tags: [Captura]
 *     responses:
 *       200:
 *         description: Objetos detectados atualmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 detecting:
 *                   type: boolean
 *                   description: Se há objetos sendo detectados agora
 *                   example: true
 *                 count:
 *                   type: number
 *                   description: Quantidade de objetos detectados
 *                   example: 2
 *                 description:
 *                   type: string
 *                   description: Descrição em português para narração
 *                   example: "Detectados 2 objetos: pessoa e cadeira"
 *                 objects:
 *                   type: array
 *                   description: Lista de objetos detectados
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: pessoa
 *                       confidence:
 *                         type: number
 *                         example: 87
 *                       position:
 *                         type: string
 *                         example: centro
 *                 timestamp:
 *                   type: string
 *                   example: "2025-11-01T21:20:09.058Z"
 *                 secondsAgo:
 *                   type: number
 *                   description: Há quantos segundos foi detectado
 *                   example: 2
 */
app.get('/api/detections/current', (req, res) => {
  // Se não há detecções recentes
  if (lastDetections.length === 0 || detectionHistory.length === 0) {
    return res.json({
      detecting: false,
      count: 0,
      description: "Nenhum objeto detectado no momento",
      objects: [],
      timestamp: new Date().toISOString(),
      secondsAgo: null
    });
  }

  const lastDetection = detectionHistory[detectionHistory.length - 1];
  const now = Date.now();
  const secondsAgo = Math.floor((now - lastDetection.timestamp) / 1000);

  // Formatar objetos para narração
  const objects = lastDetection.objects.map(obj => {
    // Calcular posição aproximada (esquerda, centro, direita)
    const [x, y, width, height] = obj.bbox;
    const centerX = x + width / 2;
    let position = 'centro';

    // Assumindo imagem de 640px de largura (padrão ESP32)
    if (centerX < 213) position = 'esquerda';
    else if (centerX > 427) position = 'direita';

    return {
      name: obj.classTranslated,
      confidence: Math.round(obj.confidence * 100),
      position: position
    };
  });

  // Criar descrição simplificada
  const objectNames = objects.map(o => o.name).join(', ');
  let description;

  if (objects.length === 1) {
    description = `Detectado: ${objectNames}`;
  } else {
    description = `Detectados ${objects.length} objetos: ${objectNames}`;
  }

  res.json({
    detecting: true,
    count: objects.length,
    description: description,
    objects: objects,
    timestamp: lastDetection.receivedAt,
    secondsAgo: secondsAgo
  });
});

/**
 * @swagger
 * /api/history:
 *   get:
 *     summary: 📜 Histórico de detecções
 *     description: Retorna as últimas N detecções processadas
 *     tags: [Histórico]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Número máximo de detecções a retornar
 *     responses:
 *       200:
 *         description: Histórico de detecções
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   example: 42
 *                 detections:
 *                   type: array
 *                   items:
 *                     type: object
 */
// Histórico de detecções
app.get('/api/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({
    total: detectionHistory.length,
    detections: detectionHistory.slice(-limit)
  });
});

/**
 * @swagger
 * /api/history:
 *   delete:
 *     summary: 🗑️ Limpa o histórico
 *     description: Remove todas as detecções armazenadas no histórico
 *     tags: [Histórico]
 *     responses:
 *       200:
 *         description: Histórico limpo com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 cleared:
 *                   type: number
 *                   example: 42
 */
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

/**
 * @swagger
 * /api/system/status:
 *   get:
 *     summary: 🖥️ Status Completo do Sistema
 *     description: |
 *       Retorna status completo do sistema incluindo:
 *       - Uptime do servidor
 *       - Status de todos os ESP32s (pai, sensor, motor, câmera)
 *       - Alertas ativos
 *       - Informações do modelo TensorFlow
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Status do sistema
 */
app.get('/api/system/status', (req, res) => {
  const uptime = Math.floor((Date.now() - SERVER_START_TIME) / 1000); // segundos
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  const uptimeSeconds = uptime % 60;

  res.json({
    server: {
      uptime: uptime,
      uptimeFormatted: `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`,
      startTime: new Date(SERVER_START_TIME).toISOString(),
      currentTime: new Date().toISOString(),
      mode: ESP32_CAM_CONFIG.useStreaming ? 'streaming' : 'capture',
      captureInterval: ESP32_CAM_CONFIG.captureInterval
    },
    tensorflow: {
      modelLoaded: model !== null,
      modelName: 'COCO-SSD',
      classes: Object.keys(translations).length,
      lastDetectionCount: lastDetections.length
    },
    esp32: esp32Status,
    alerts: {
      total: systemAlerts.length,
      recent: systemAlerts.slice(0, 5)
    },
    connections: {
      websocket: wss.clients.size,
      sse: sseClients.size
    },
    stats: {
      totalFramesReceived: totalFramesReceived,
      framesProcessed: frameCount,
      detectionHistorySize: detectionHistory.length
    }
  });
});

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: ⚠️ Listar Alertas
 *     description: Retorna lista de alertas do sistema
 *     tags: [Real-Time]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número máximo de alertas a retornar
 *     responses:
 *       200:
 *         description: Lista de alertas
 */
app.get('/api/alerts', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json({
    total: systemAlerts.length,
    alerts: systemAlerts.slice(0, limit)
  });
});

/**
 * @swagger
 * /api/alerts:
 *   delete:
 *     summary: 🗑️ Limpar Alertas
 *     description: Remove todos os alertas do sistema
 *     tags: [Real-Time]
 *     responses:
 *       200:
 *         description: Alertas removidos
 */
app.delete('/api/alerts', (req, res) => {
  const count = systemAlerts.length;
  systemAlerts = [];
  res.json({
    success: true,
    cleared: count
  });
});

/**
 * @swagger
 * /api/esp32/stream:
 *   get:
 *     summary: 📹 Redireciona para o stream MJPEG
 *     description: Redireciona para o stream de vídeo do ESP32-CAM
 *     tags: [ESP32]
 *     responses:
 *       302:
 *         description: Redirecionamento para o stream
 */
// Proxy do stream (para debugging)
app.get('/api/esp32/stream', (req, res) => {
  res.redirect(ESP32_URLS.stream);
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: ❤️ Health Check
 *     description: Verifica se o servidor está online
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Servidor online
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: OK
 */
// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

/**
 * @swagger
 * /viewer:
 *   get:
 *     summary: 🖼️ Visualizador Web
 *     description: Interface web interativa para visualizar detecções em tempo real
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Página HTML do visualizador
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
// Visualizador HTML
app.get('/viewer', (req, res) => {
  res.sendFile(join(__dirname, 'viewer.html'));
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: 🏠 Informações da API
 *     description: Retorna informações básicas sobre a API e endpoints disponíveis
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Informações da API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: Servidor de Visão para PCD com ESP32-CAM
 *                 version:
 *                   type: string
 *                   example: 2.1.0
 *                 esp32:
 *                   type: object
 *                 mode:
 *                   type: string
 *                   example: 📸 CAPTURA
 *                 streamActive:
 *                   type: boolean
 *                   example: false
 *                 endpoints:
 *                   type: object
 *                 websocket:
 *                   type: string
 *                   example: ws://localhost:8080
 *                 examples:
 *                   type: object
 */
// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'Servidor de Visão para PCD com ESP32-CAM',
    version: '2.1.0',
    esp32: ESP32_CAM_CONFIG,
    mode: ESP32_CAM_CONFIG.useStreaming ? '📹 STREAMING' : '📸 CAPTURA',
    streamActive: isStreamActive,
    endpoints: {
      testESP32: 'GET /api/esp32/test',
      capture: 'GET /api/esp32/capture (JSON)',
      captureImage: 'GET /api/esp32/capture-image (JPEG com bounding boxes) ✨',
      currentDetections: 'GET /api/detections/current (Real-Time para Apps) 🎯 NOVO',
      stream: 'GET /api/esp32/stream (redirect)',
      config: 'POST /api/esp32/config',
      status: 'GET /api/status',
      history: 'GET /api/history?limit=50',
      clearHistory: 'DELETE /api/history'
    },
    websocket: `ws://localhost:${WS_PORT}`,
    examples: {
      viewImageWithBoxes: `http://localhost:${PORT}/api/esp32/capture-image`,
      getDetectionsJSON: `http://localhost:${PORT}/api/esp32/capture`,
      getCurrentObjects: `http://localhost:${PORT}/api/detections/current`
    }
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
      console.log(`📍 Endpoint ESP32: /${ESP32_CAM_CONFIG.endpoint} ${ESP32_CAM_CONFIG.endpoint === 'stream' ? '📹' : '📸'}`);
      console.log(`🎬 Modo: ${ESP32_CAM_CONFIG.useStreaming ? '📹 STREAMING' : '📸 CAPTURA'}`);
      console.log(`⏱️  Intervalo: ${ESP32_CAM_CONFIG.captureInterval}ms`);
      console.log(`🎯 Confiança mínima: ${(ESP32_CAM_CONFIG.minConfidence * 100).toFixed(0)}%`);
      console.log('\n📋 Endpoints disponíveis:');
      console.log(`   GET    http://localhost:${PORT}/api/esp32/test`);
      console.log(`   GET    http://localhost:${PORT}/api/esp32/capture`);
      console.log(`   GET    http://localhost:${PORT}/api/esp32/capture-image ✨`);
      console.log(`   GET    http://localhost:${PORT}/api/esp32/stream`);
      console.log(`   POST   http://localhost:${PORT}/api/esp32/config`);
      console.log(`   GET    http://localhost:${PORT}/api/status`);
      console.log('\n� Documentação Swagger:');
      console.log(`   👉 http://localhost:${PORT}/api/docs`);
      console.log('\n�🖼️  Visualizador Web:');
      console.log(`   👉 http://localhost:${PORT}/viewer`);
      console.log('\n📸 API de Imagem com Detecções:');
      console.log(`   http://localhost:${PORT}/api/esp32/capture-image`);
      console.log('\n✅ Servidor pronto!\n');
    });

    // 3. Aguardar 2 segundos e iniciar processamento
    setTimeout(() => {
      if (ESP32_CAM_CONFIG.useStreaming) {
        connectToStream();
      } else {
        startCaptureProcessing();
      }
    }, 2000);

    // 4. Iniciar broadcast periódico de status via SSE (a cada 2 segundos)
    setInterval(() => {
      if (sseClients.size > 0) {
        const uptime = Math.floor((Date.now() - SERVER_START_TIME) / 1000);

        // 1. Uptime
        broadcastSSE('uptime', {
          uptime: uptime,
          uptimeFormatted: formatUptime(uptime),
          timestamp: new Date().toISOString()
        });

        // 2. Status dos ESP32s
        broadcastSSE('system-status', {
          esp32: esp32Status,
          alertsCount: systemAlerts.length,
          connections: {
            websocket: wss.clients.size,
            sse: sseClients.size
          }
        });

        // 3. Detecções atuais (substitui /api/detections/current)
        broadcastCurrentDetections();
      }
    }, 2000); // Reduzido para 2s para atualizações mais frequentes

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Função para broadcast das detecções atuais via SSE
function broadcastCurrentDetections() {
  // Se não há detecções recentes
  if (lastDetections.length === 0 || detectionHistory.length === 0) {
    broadcastSSE('current-detection', {
      detecting: false,
      count: 0,
      description: "Nenhum objeto detectado no momento",
      objects: [],
      timestamp: new Date().toISOString(),
      secondsAgo: null
    });
    return;
  }

  const lastDetection = detectionHistory[detectionHistory.length - 1];
  const now = Date.now();
  const secondsAgo = Math.floor((now - lastDetection.timestamp) / 1000);

  // Formatar objetos para narração
  const objects = lastDetection.objects.map(obj => {
    // Calcular posição aproximada (esquerda, centro, direita)
    const [x, y, width, height] = obj.bbox;
    const centerX = x + width / 2;
    let position = 'centro';

    // Assumindo imagem de 640px de largura (padrão ESP32)
    if (centerX < 213) position = 'esquerda';
    else if (centerX > 427) position = 'direita';

    return {
      name: obj.classTranslated,
      confidence: Math.round(obj.confidence * 100),
      position: position,
      bbox: obj.bbox
    };
  });

  // Criar descrição simplificada
  const objectNames = objects.map(o => o.name).join(', ');
  let description;

  if (objects.length === 1) {
    description = `Detectado: ${objectNames}`;
  } else {
    description = `Detectados ${objects.length} objetos: ${objectNames}`;
  }

  // Broadcast via SSE
  broadcastSSE('current-detection', {
    detecting: true,
    count: objects.length,
    description: description,
    objects: objects,
    timestamp: lastDetection.receivedAt,
    secondsAgo: secondsAgo
  });
}

// Função auxiliar para formatar uptime
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
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

  // Limpar intervalo de captura
  if (captureIntervalId) {
    clearInterval(captureIntervalId);
    console.log('✅ Loop de captura encerrado');
  }

  isStreamActive = false;

  // Fechar conexões WebSocket
  wss.clients.forEach((client) => {
    client.close();
  });

  // Fechar servidor WebSocket ESP32
  if (esp32WebSocketServer) {
    esp32WebSocketServer.clients.forEach((client) => {
      client.close();
    });
    esp32WebSocketServer.close();
    console.log('✅ WebSocket ESP32 encerrado');
  }

  console.log('✅ Servidor encerrado com sucesso');
  process.exit(0);
});

// ===== FUNÇÕES AUXILIARES ESP32 =====
function updateESP32Status(module, connected) {
  if (esp32Status[module]) {
    esp32Status[module].connected = connected;
    esp32Status[module].lastSeen = connected ? new Date().toISOString() : esp32Status[module].lastSeen;
  }
}

function addSystemAlert(level, message) {
  addAlert(level, message);
}

// ===== PROCESSAR MENSAGENS DO ESP32-PAI =====
function handleESP32Message(message) {
  console.log(`\n📥 Mensagem ESP32 (${message.type}):`, message);

  switch (message.type) {
    case 'identify':
      // ESP32-PAI se identificando
      console.log(`✅ ESP32-PAI identificado: ${message.deviceId}`);
      updateESP32Status('pai', true);
      addSystemAlert('info', `ESP32-PAI conectado: ${message.deviceId}`);
      
      // Enviar confirmação
      if (esp32PaiConnection && esp32PaiConnection.readyState === WebSocket.OPEN) {
        esp32PaiConnection.send(JSON.stringify({
          type: 'identify-ack',
          message: 'Servidor reconheceu o PAI',
          timestamp: Date.now()
        }));
      }
      break;

    case 'status':
      // Status de um módulo (sensor, motor, camera)
      handleModuleStatus(message);
      break;

    case 'alert':
      // Alerta de perigo
      handleESP32Alert(message);
      break;

    case 'heartbeat':
      // Heartbeat do PAI
      updateESP32Status('pai', true);
      esp32Status.pai.lastUpdate = Date.now();
      break;

    case 'pong':
      // Resposta ao ping
      console.log('🏓 Pong recebido do ESP32');
      break;

    default:
      console.log(`⚠️ Tipo de mensagem desconhecido: ${message.type}`);
  }
}

// ===== TRATAR STATUS DE MÓDULOS =====
function handleModuleStatus(message) {
  const { module, distance, rssi, vibrationLevel, frameCount } = message;

  if (module === 'sensor') {
    // Atualizar status do sensor
    updateESP32Status('sensor', true);
    esp32Status.sensor.distance = distance;
    esp32Status.sensor.rssi = rssi;
    esp32Status.sensor.lastUpdate = Date.now();

    console.log(`📏 Sensor: ${distance}cm | RSSI: ${rssi}dBm`);

    // Broadcast via SSE
    broadcastToSSEClients('esp32-status', {
      module: 'sensor',
      connected: true,
      distance,
      rssi,
      timestamp: Date.now()
    });
  }
  else if (module === 'motor') {
    // Atualizar status do motor
    updateESP32Status('motor', true);
    esp32Status.motor.vibrationLevel = vibrationLevel;
    esp32Status.motor.lastUpdate = Date.now();

    console.log(`📳 Motor: Vibração ${vibrationLevel}%`);

    // Broadcast via SSE
    broadcastToSSEClients('esp32-status', {
      module: 'motor',
      connected: true,
      vibrationLevel,
      timestamp: Date.now()
    });
  }
  else if (module === 'camera') {
    // Atualizar status da câmera
    updateESP32Status('camera', true);
    esp32Status.camera.frameCount = frameCount;
    esp32Status.camera.rssi = rssi;
    esp32Status.camera.lastUpdate = Date.now();

    console.log(`📷 Câmera: ${frameCount} frames | RSSI: ${rssi}dBm`);

    // Broadcast via SSE
    broadcastToSSEClients('esp32-status', {
      module: 'camera',
      connected: true,
      frameCount,
      rssi,
      timestamp: Date.now()
    });
  }
}

// ===== TRATAR ALERTAS DO ESP32 =====
function handleESP32Alert(message) {
  const { level, msg, distance } = message;

  console.log(`\n🚨 ALERTA ${level.toUpperCase()}: ${msg}`);
  
  // Adicionar ao sistema de alertas
  addSystemAlert(level, msg);

  // Se for perigo, enviar notificação especial via SSE
  if (level === 'danger') {
    broadcastToSSEClients('alert', {
      type: 'danger',
      message: msg,
      distance,
      timestamp: Date.now()
    });
  }
}

// ===== ENVIAR COMANDO PARA ESP32-PAI =====
function sendCommandToESP32(command) {
  if (!esp32PaiConnection || esp32PaiConnection.readyState !== WebSocket.OPEN) {
    console.log('❌ ESP32-PAI não conectado');
    return false;
  }

  try {
    esp32PaiConnection.send(JSON.stringify(command));
    console.log(`📤 Comando enviado ao ESP32:`, command);
    return true;
  } catch (err) {
    console.error('❌ Erro ao enviar comando:', err);
    return false;
  }
}

// Iniciar servidor (HTTP + SSE + WebSockets unificados)
startServer();

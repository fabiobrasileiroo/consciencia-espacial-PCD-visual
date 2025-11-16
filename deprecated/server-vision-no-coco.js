/**
 * 🖥️ SERVIDOR DE VISÃO PARA PCD VISUAL - SEM COCO-SSD
 * 
 * Recebe descrições de objetos JÁ TRADUZIDAS do ESP32-CAM (via test_esp32cam.py)
 * e distribui para apps mobile via WebSocket e SSE
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { join } = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(join(__dirname, 'public')));

// ===== ESTADO DO SISTEMA =====
let lastDetections = [];
let detectionHistory = [];
const MAX_HISTORY = 100;
const SERVER_START_TIME = Date.now();

let esp32Status = {
  pai: { connected: false, lastSeen: null },
  sensor: { connected: false, lastSeen: null, distance: null, level: null },
  motor: { connected: false, lastSeen: null, vibrationLevel: 0 },
  camera: { connected: false, lastSeen: null }
};

let systemAlerts = [];
const MAX_ALERTS = 50;
const sseClients = new Set();

// Conexões WebSocket ativas
let esp32PaiConnection = null;
let esp32CamConnection = null;

// ===== DETECTAR IP LOCAL =====
function getLocalIP() {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();

  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// ===== CRIAR SERVIDOR HTTP =====
const server = http.createServer(app);

// ===== CRIAR WEBSOCKET SERVERS (IGUAL AO WEBSOCKET-SIMPLE.JS) =====

// WebSocket para App Mobile (porta 3000, path /ws)
const wssApp = new WebSocket.Server({
  server: server,
  path: '/ws'
});

// WebSocket para ESP32-PAI (porta 3000, path /esp32)
const wssESP32Pai = new WebSocket.Server({
  server: server,
  path: '/esp32'
});

// WebSocket para ESP32-CAM (porta 3000, path /esp32-cam)
const wssESP32Cam = new WebSocket.Server({
  server: server,
  path: '/esp32-cam'
});

// ===== HANDLERS WEBSOCKET =====

// Handler: App Mobile
wssApp.on('connection', function connection(ws) {
  console.log('📱 App Mobile conectado');

  // Enviar histórico
  ws.send(JSON.stringify({
    type: 'history',
    data: detectionHistory.slice(-10)
  }));

  // Enviar última detecção
  if (lastDetections.length > 0) {
    ws.send(JSON.stringify({
      type: 'current',
      data: lastDetections[lastDetections.length - 1]
    }));
  }

  ws.on('message', function message(data) {
    console.log('📱 App enviou:', data.toString());
  });

  ws.on('close', function close() {
    console.log('📱 App Mobile desconectado');
  });
});

// Handler: ESP32-PAI
wssESP32Pai.on('connection', function connection(ws) {
  console.log('\n🤝 ESP32-PAI conectado');

  esp32PaiConnection = ws;
  updateESP32Status('pai', true);

  ws.on('message', (message) => {
    console.log('received: %s', message);

    try {
      const msg = JSON.parse(message.toString());
      console.log(`📥 ESP32-PAI enviou (${msg.type}):`, msg);
      handleESP32PaiMessage(msg, ws);

      // Enviar confirmação (igual ao websocket-simple.js)
      ws.send(`Mensagem recebida: ${message}`);
    } catch (err) {
      console.error('❌ Erro ao processar mensagem ESP32-PAI:', err);
    }
  });

  ws.on('close', function close() {
    console.log('❌ ESP32-PAI desconectado');
    esp32PaiConnection = null;
    updateESP32Status('pai', false);
    updateESP32Status('sensor', false);
    updateESP32Status('motor', false);
  });
});

// Handler: ESP32-CAM
wssESP32Cam.on('connection', function connection(ws) {
  console.log('\n📷 ESP32-CAM conectado');

  esp32CamConnection = ws;
  updateESP32Status('camera', true);

  ws.on('message', (message) => {
    console.log('received: %s', message);

    try {
      const msg = JSON.parse(message.toString());
      console.log(`📥 ESP32-CAM enviou (${msg.type}):`, msg);
      handleESP32CamMessage(msg, ws);

      // Enviar confirmação
      ws.send(`Mensagem recebida: ${message}`);
    } catch (err) {
      console.error('❌ Erro ao processar mensagem ESP32-CAM:', err);
    }
  });

  ws.on('close', function close() {
    console.log('❌ ESP32-CAM desconectado');
    esp32CamConnection = null;
    updateESP32Status('camera', false);
  });
});

// ===== PROCESSAR MENSAGENS =====

function handleESP32PaiMessage(message, ws) {
  switch (message.type) {
    case 'identify':
      console.log(`✅ ESP32-PAI identificado: ${message.deviceId}`);
      updateESP32Status('pai', true);
      addSystemAlert('info', `ESP32-PAI conectado: ${message.deviceId}`);
      break;

    case 'sensor_update':
      handleSensorUpdate(message);
      break;

    case 'status':
      handleModuleStatus(message);
      break;

    case 'alert':
      handleESP32Alert(message);
      break;

    case 'heartbeat':
      updateESP32Status('pai', true);
      esp32Status.pai.lastUpdate = Date.now();
      break;

    default:
      console.log(`⚠️ Tipo de mensagem desconhecido: ${message.type}`);
  }
}

function handleESP32CamMessage(message, ws) {
  switch (message.type) {
    case 'identify':
      console.log(`✅ ESP32-CAM identificado: ${message.deviceId}`);
      updateESP32Status('camera', true);
      addSystemAlert('info', `ESP32-CAM conectado: ${message.deviceId}`);
      break;

    case 'detection':
      handleObjectDetection(message);
      break;

    case 'heartbeat':
      updateESP32Status('camera', true);
      esp32Status.camera.lastUpdate = Date.now();
      break;

    default:
      console.log(`⚠️ Tipo de mensagem desconhecido: ${message.type}`);
  }
}

function handleObjectDetection(message) {
  const { description_pt, description_kz, objects, confidence, timestamp } = message;

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  🎯 DETECÇÃO DE OBJETOS               ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`📝 Português: ${description_pt}`);
  console.log(`📝 Cazaque: ${description_kz}`);
  if (objects && objects.length > 0) {
    console.log(`📊 Objetos (${objects.length}):`);
    objects.forEach((obj, i) => {
      console.log(`   ${i + 1}. ${obj}`);
    });
  }
  console.log(`🎯 Confiança: ${confidence || 'N/A'}`);
  console.log('════════════════════════════════════════\n');

  const detection = {
    description: description_pt,
    description_kz,
    objects: objects || [],
    confidence,
    timestamp: timestamp || Date.now(),
    receivedAt: Date.now()
  };

  lastDetections.push(detection);
  if (lastDetections.length > 5) lastDetections.shift();

  detectionHistory.push(detection);
  if (detectionHistory.length > MAX_HISTORY) detectionHistory.shift();

  broadcastToSSEClients('detection', {
    description: description_pt,
    description_kz,
    objects: objects || [],
    confidence,
    count: objects ? objects.length : 0,
    timestamp: Date.now()
  });

  broadcastToAppClients({
    type: 'detection',
    data: detection
  });

  updateESP32Status('camera', true);
}

function handleSensorUpdate(message) {
  const { distance, vibrationLevel, alertLevel, alertMsg, moduleId, rssi, timestamp } = message;

  updateESP32Status('sensor', true);
  esp32Status.sensor.distance = distance;
  esp32Status.sensor.level = alertLevel;
  esp32Status.sensor.rssi = rssi;
  esp32Status.sensor.lastUpdate = Date.now();

  updateESP32Status('motor', true);
  esp32Status.motor.vibrationLevel = vibrationLevel;
  esp32Status.motor.lastUpdate = Date.now();

  console.log(`📏 Sensor: ${distance}cm | Nível: ${alertLevel} | Vibração: ${vibrationLevel} | RSSI: ${rssi}dBm`);

  broadcastToSSEClients('sensor-update', {
    distance,
    vibrationLevel,
    alertLevel,
    alertMsg,
    rssi,
    moduleId,
    timestamp: Date.now(),
    sensorTimestamp: timestamp
  });

  broadcastToAppClients({
    type: 'sensor-update',
    data: {
      distance,
      vibrationLevel,
      alertLevel,
      alertMsg,
      rssi,
      timestamp: Date.now()
    }
  });

  if (alertLevel === 'danger' || alertLevel === 'warning') {
    addSystemAlert(alertLevel, `${alertMsg} (${distance}cm)`);
  }
}

function handleModuleStatus(message) {
  const { module, distance, rssi, vibrationLevel, frameCount } = message;

  if (module === 'sensor') {
    updateESP32Status('sensor', true);
    esp32Status.sensor.distance = distance;
    esp32Status.sensor.rssi = rssi;
    esp32Status.sensor.lastUpdate = Date.now();

    console.log(`📏 Sensor: ${distance}cm | RSSI: ${rssi}dBm`);

    broadcastToSSEClients('esp32-status', {
      module: 'sensor',
      connected: true,
      distance,
      rssi,
      timestamp: Date.now()
    });
  }
  else if (module === 'motor') {
    updateESP32Status('motor', true);
    esp32Status.motor.vibrationLevel = vibrationLevel;
    esp32Status.motor.lastUpdate = Date.now();

    console.log(`📳 Motor: Vibração ${vibrationLevel}%`);

    broadcastToSSEClients('esp32-status', {
      module: 'motor',
      connected: true,
      vibrationLevel,
      timestamp: Date.now()
    });
  }
  else if (module === 'camera') {
    updateESP32Status('camera', true);
    esp32Status.camera.frameCount = frameCount;
    esp32Status.camera.rssi = rssi;
    esp32Status.camera.lastUpdate = Date.now();

    console.log(`📷 Câmera: ${frameCount} frames | RSSI: ${rssi}dBm`);

    broadcastToSSEClients('esp32-status', {
      module: 'camera',
      connected: true,
      frameCount,
      rssi,
      timestamp: Date.now()
    });
  }
}

function handleESP32Alert(message) {
  const { level, msg, distance } = message;

  console.log(`\n🚨 ALERTA ${level.toUpperCase()}: ${msg}`);

  addSystemAlert(level, msg);

  if (level === 'danger') {
    broadcastToSSEClients('alert', {
      type: 'danger',
      message: msg,
      distance,
      timestamp: Date.now()
    });
  }
}

// ===== FUNÇÕES AUXILIARES =====

function updateESP32Status(module, connected) {
  if (esp32Status[module]) {
    esp32Status[module].connected = connected;
    esp32Status[module].lastSeen = connected ? new Date().toISOString() : esp32Status[module].lastSeen;
  }
}

function addSystemAlert(level, message) {
  const alert = {
    level,
    message,
    timestamp: Date.now(),
    timestampStr: new Date().toISOString()
  };

  systemAlerts.unshift(alert);
  if (systemAlerts.length > MAX_ALERTS) systemAlerts.pop();

  broadcastToSSEClients('system-alert', alert);
}

function broadcastToAppClients(data) {
  const message = JSON.stringify(data);
  let sentCount = 0;

  wssApp.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  if (sentCount > 0) {
    console.log(`📤 Broadcast enviado para ${sentCount} app(s)`);
  }
}

function sendSSEUpdate(client, eventType, data) {
  try {
    client.write(`event: ${eventType}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (err) {
    console.error('❌ Erro ao enviar SSE:', err);
  }
}

function broadcastToSSEClients(eventType, data) {
  sseClients.forEach(client => sendSSEUpdate(client, eventType, data));
}

function sendCommandToESP32(command) {
  if (!esp32PaiConnection || esp32PaiConnection.readyState !== WebSocket.OPEN) {
    console.log('❌ ESP32-PAI não conectado');
    return false;
  }

  try {
    esp32PaiConnection.send(JSON.stringify(command));
    console.log(`📤 Comando enviado ao ESP32-PAI:`, command);
    return true;
  } catch (err) {
    console.error('❌ Erro ao enviar comando:', err);
    return false;
  }
}

// ===== SWAGGER =====
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vision API - Sistema ESP32 sem COCO-SSD',
      version: '3.0.0',
      description: 'Sistema de detecção de objetos recebendo descrições já processadas e traduzidas do ESP32-CAM.'
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    tags: [
      { name: 'ESP32', description: 'Endpoints para ESP32s' },
      { name: 'Detecções', description: 'Gerenciamento de detecções' },
      { name: 'Status', description: 'Status do sistema' }
    ]
  },
  apis: ['./server-vision-no-coco.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ===== ROTAS HTTP =====

app.get('/', (req, res) => {
  const localIP = getLocalIP();
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Vision API - ESP32 (Sem COCO-SSD)</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #667eea; }
          .badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            margin-left: 10px;
          }
          a {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin: 5px;
          }
          a:hover { background: #5a67d8; }
          .ip { background: #fef3c7; padding: 10px; border-radius: 5px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎯 Vision API - Sistema ESP32 <span class="badge">SEM COCO-SSD</span></h1>
          <p>Servidor recebe descrições traduzidas do ESP32-CAM</p>
          <div class="ip">
            <strong>📍 IP do Servidor:</strong> ${localIP}<br>
            <strong>🔌 WebSocket ESP32-PAI:</strong> ws://${localIP}:${PORT}/esp32<br>
            <strong>📷 WebSocket ESP32-CAM:</strong> ws://${localIP}:${PORT}/esp32-cam<br>
            <strong>📱 WebSocket App:</strong> ws://${localIP}:${PORT}/ws
          </div>
          <hr>
          <h3>🔗 Links Úteis:</h3>
          <a href="/api/docs">📚 Documentação API</a>
          <a href="/api/status">📊 Status do Sistema</a>
          <a href="/api/detections/current">🎯 Detecções Atuais</a>
        </div>
      </body>
    </html>
  `);
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    serverStartTime: SERVER_START_TIME,
    esp32Status,
    totalDetections: detectionHistory.length,
    connectedClients: {
      app: wssApp.clients.size,
      esp32Pai: wssESP32Pai.clients.size,
      esp32Cam: wssESP32Cam.clients.size
    },
    sseClients: sseClients.size,
    lastDetection: lastDetections.length > 0 ? lastDetections[lastDetections.length - 1] : null,
    currentObjects: lastDetections.length > 0 ? lastDetections[lastDetections.length - 1].objects.length : 0,
    version: '3.0.0',
    mode: 'no-coco-ssd'
  });
});

app.get('/api/detections/current', (req, res) => {
  if (lastDetections.length === 0) {
    return res.json({
      detecting: false,
      count: 0,
      description: 'Nenhuma detecção recente',
      objects: [],
      timestamp: new Date().toISOString()
    });
  }

  const latest = lastDetections[lastDetections.length - 1];
  const secondsAgo = Math.floor((Date.now() - latest.timestamp) / 1000);

  res.json({
    detecting: true,
    count: latest.objects.length,
    description: latest.description,
    description_kz: latest.description_kz,
    objects: latest.objects,
    confidence: latest.confidence,
    timestamp: new Date(latest.timestamp).toISOString(),
    secondsAgo
  });
});

app.get('/api/detections/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const history = detectionHistory.slice(-limit).reverse();

  res.json({
    total: detectionHistory.length,
    returned: history.length,
    detections: history
  });
});

app.get('/api/stream/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  sseClients.add(res);
  console.log(`📡 Cliente SSE conectado (total: ${sseClients.size})`);

  sendSSEUpdate(res, 'connected', {
    message: 'Conectado ao servidor',
    timestamp: Date.now()
  });

  sendSSEUpdate(res, 'esp32-status-all', esp32Status);

  if (lastDetections.length > 0) {
    const latest = lastDetections[lastDetections.length - 1];
    sendSSEUpdate(res, 'detection', {
      description: latest.description,
      objects: latest.objects,
      count: latest.objects.length,
      timestamp: latest.timestamp
    });
  }

  const keepalive = setInterval(() => {
    sendSSEUpdate(res, 'ping', { timestamp: Date.now() });
  }, 30000);

  req.on('close', () => {
    clearInterval(keepalive);
    sseClients.delete(res);
    console.log(`📡 Cliente SSE desconectado (restam: ${sseClients.size})`);
  });
});

app.post('/api/esp32/command', (req, res) => {
  const { command, value } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      message: 'Comando não especificado'
    });
  }

  const validCommands = ['test_motor', 'get_status', 'calibrate_sensor', 'reboot', 'set_vibration'];
  if (!validCommands.includes(command)) {
    return res.status(400).json({
      success: false,
      message: `Comando inválido. Use: ${validCommands.join(', ')}`
    });
  }

  if (!esp32PaiConnection || esp32PaiConnection.readyState !== WebSocket.OPEN) {
    return res.status(503).json({
      success: false,
      message: 'ESP32-PAI não está conectado'
    });
  }

  const commandMsg = {
    type: 'command',
    command,
    value,
    timestamp: Date.now()
  };

  const sent = sendCommandToESP32(commandMsg);

  res.json({
    success: sent,
    message: sent ? 'Comando enviado ao ESP32-PAI' : 'Erro ao enviar comando',
    command: commandMsg
  });
});

app.post('/api/esp32-cam/send-description', (req, res) => {
  const { description_pt, description_kz, objects, confidence } = req.body;

  if (!description_pt) {
    return res.status(400).json({
      success: false,
      message: 'Descrição em português é obrigatória'
    });
  }

  handleObjectDetection({
    type: 'detection',
    description_pt,
    description_kz: description_kz || description_pt,
    objects: objects || [],
    confidence: confidence || 0,
    timestamp: Date.now()
  });

  res.json({
    success: true,
    message: 'Descrição recebida e distribuída',
    receivedAt: Date.now()
  });
});

// ===== INICIAR SERVIDOR =====
server.listen(PORT, () => {
  const localIP = getLocalIP();

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🎯 SERVIDOR DE VISÃO - SEM COCO-SSD                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`🚀 Servidor HTTP rodando em: http://localhost:${PORT}`);
  console.log(`📚 Documentação API: http://localhost:${PORT}/api/docs`);
  console.log(`📡 SSE disponível em: http://localhost:${PORT}/api/stream/events\n`);

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  🔌 WEBSOCKETS ATIVOS                                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`📱 App Mobile: ws://${localIP}:${PORT}/ws`);
  console.log(`🤖 ESP32-PAI:  ws://${localIP}:${PORT}/esp32`);
  console.log(`📷 ESP32-CAM:  ws://${localIP}:${PORT}/esp32-cam\n`);

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  🔧 CONFIGURAÇÃO PARA ESP32-PAI                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`📍 IP Local do Servidor: ${localIP}`);
  console.log(`   Use este IP no main.cpp:\n`);
  console.log(`   const char* wsServer = "${localIP}";`);
  console.log(`   const int wsPort = ${PORT};`);
  console.log(`   const char* wsPath = "/esp32";\n`);
  console.log('✅ Servidor pronto para receber conexões!\n');
});

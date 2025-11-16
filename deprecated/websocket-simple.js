/**
 * 🖥️ SERVIDOR DE VISÃO PARA PCD VISUAL - SEM COCO-SSD
 * 
 * Recebe descrições de objetos JÁ TRADUZIDAS do ESP32-CAM (via test_esp32cam.py)
 * e distribui para apps mobile via WebSocket e SSE
 */

const express = require('express');
// const webSocket = require('ws');
const WebSocket = require('ws');
const cors = require('cors');
const { join } = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3001;
const PORTWEBSOCKET = process.env.PORTWEBSOCKET || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(join(__dirname, 'public')));
// const router = new Router();

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
// const server = http.createServer(app);

// ===== CRIAR WEBSOCKET SERVERS =====
// ✅ CORRETO: Compartilhar o mesmo servidor HTTP para todos os WebSockets

// WebSocket para App Mobile (path /ws)
const wssApp = new WebSocket.Server({
  server: app,  // ✅ Mesmo servidor HTTP
  path: '/ws'
});

// WebSocket para ESP32-PAI (path /esp32)
const wssESP32Pai = new WebSocket.Server({
  server: app,  // ✅ Mesmo servidor HTTP
  path: '/esp32'
});

// WebSocket para ESP32-CAM (path /esp32-cam)
const wssESP32Cam = new WebSocket.Server({
  server: app,  // ✅ Mesmo servidor HTTP
  path: '/esp32-cam'
});

// ===== HANDLERS WEBSOCKET =====

// Handler: App Mobile (path /ws)
wssApp.on('connection', function connection(ws) {
  console.log('📱 App Mobile conectado no path /ws');

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

// Handler: ESP32-PAI (path /esp32)
wssESP32Pai.on('connection', function connection(ws) {
  console.log('🔌 ESP32-PAI conectado no path /esp32');
  esp32PaiConnection = ws;
  esp32Status.pai.connected = true;
  esp32Status.pai.lastSeen = Date.now();

  ws.on('message', (message) => {
    console.log('🔌 ESP32-PAI enviou:', message.toString());
    esp32Status.pai.lastSeen = Date.now();

    // Processar mensagem do ESP32-PAI
    try {
      const data = JSON.parse(message);
      // Retransmitir para apps conectados
      wssApp.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'esp32-data',
            data: data,
            timestamp: Date.now()
          }));
        }
      });
    } catch (error) {
      console.error('Erro ao processar mensagem ESP32-PAI:', error);
    }
  });

  ws.on('close', function close() {
    console.log('🔌 ESP32-PAI desconectado');
    esp32Status.pai.connected = false;
    esp32PaiConnection = null;
  });
});

// Handler: ESP32-CAM (path /esp32-cam)
wssESP32Cam.on('connection', function connection(ws) {
  console.log('📷 ESP32-CAM conectado no path /esp32-cam');
  esp32CamConnection = ws;
  esp32Status.camera.connected = true;
  esp32Status.camera.lastSeen = Date.now();

  ws.on('message', (message) => {
    console.log('📷 ESP32-CAM enviou detecção');
    esp32Status.camera.lastSeen = Date.now();

    try {
      const detection = JSON.parse(message);
      lastDetections = [detection];
      detectionHistory.push(detection);

      if (detectionHistory.length > MAX_HISTORY) {
        detectionHistory.shift();
      }

      // Retransmitir para apps conectados
      wssApp.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'detection',
            data: detection,
            timestamp: Date.now()
          }));
        }
      });
    } catch (error) {
      console.error('Erro ao processar detecção ESP32-CAM:', error);
    }
  });

  ws.on('close', function close() {
    console.log('📷 ESP32-CAM desconectado');
    esp32Status.camera.connected = false;
    esp32CamConnection = null;
  });
});

// ===== INICIAR SERVIDOR =====
const localIP = getLocalIP();

app.listen(PORTWEBSOCKET, '0.0.0.0', () => {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 SERVIDOR WEBSOCKET INICIADO                                ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  📍 Porta: ${PORTWEBSOCKET}                                               ║`);
  console.log(`║  🌐 IP Local: ${localIP}                                   ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  📱 CONEXÕES WEBSOCKET DISPONÍVEIS:                            ║');
  console.log(`║     • App Mobile:  ws://${localIP}:${PORTWEBSOCKET}/ws                  ║`);
  console.log(`║     • ESP32-PAI:   ws://${localIP}:${PORTWEBSOCKET}/esp32               ║`);
  console.log(`║     • ESP32-CAM:   ws://${localIP}:${PORTWEBSOCKET}/esp32-cam           ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
});
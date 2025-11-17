const express = require('express');
const cors = require('cors');
const { join } = require('path');
const os = require('os');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const WebSocket = require('ws');
const { WebSocketExpress, Router } = require('websocket-express');

const app = new WebSocketExpress();
const router = new Router();
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
  sensor: { connected: false, lastSeen: null, distance: null, level: null, temperature: null, humidity: null, sensorOk: null },
  motor: { connected: false, lastSeen: null, vibrationLevel: 0 },
  camera: { connected: false, lastSeen: null }
};

let systemsHealth = {
  pai: false,
  sensor: false,
  vibracall: false,
  camera: false
};

let systemAlerts = [];
const MAX_ALERTS = 50;
const sseClients = new Set();
const appClients = new Set();

let esp32PaiConnection = null;
let esp32CamConnection = null;

const OperationModes = Object.freeze({
  REALTIME: 'realtime',
  MANUAL: 'manual'
});

let operationMode = OperationModes.REALTIME;
let operationModeUpdatedAt = Date.now();
let operationModeMetadata = { triggeredBy: 'server', source: 'boot' };

// ===== FUNÇÕES AUXILIARES =====
function getLocalIP() {
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

function broadcastToAppClients(payload) {
  const message = JSON.stringify(payload);
  let sentCount = 0;

  appClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  if (sentCount > 0) {
    console.log(`📤 Broadcast enviado para ${sentCount} app(s)`);
  }
}

function updateSystemsHealth(newStates = {}) {
  const updated = { ...systemsHealth };
  ['pai', 'sensor', 'vibracall', 'camera'].forEach((key) => {
    if (typeof newStates[key] === 'boolean') {
      updated[key] = newStates[key];
    }
  });

  systemsHealth = updated;

  broadcastToSSEClients('systems-health', systemsHealth);
  broadcastToAppClients({ type: 'systems-health', data: systemsHealth });
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

function notifyPaiCameraStatus(connected) {
  if (!esp32PaiConnection || esp32PaiConnection.readyState !== WebSocket.OPEN) return;

  try {
    esp32PaiConnection.send(JSON.stringify({
      type: 'camera-status',
      connected,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.error('❌ Erro ao enviar status da câmera ao ESP32-PAI:', err);
  }
}

function getOperationModeState(extra = {}) {
  return {
    mode: operationMode,
    updatedAt: operationModeUpdatedAt,
    triggeredBy: operationModeMetadata.triggeredBy,
    source: operationModeMetadata.source,
    ...extra
  };
}

function broadcastModeState(payload) {
  const enrichedPayload = payload || getOperationModeState({ timestamp: Date.now() });
  broadcastToSSEClients('mode-change', enrichedPayload);
  broadcastToAppClients({
    type: 'mode-change',
    data: enrichedPayload
  });
}

function setOperationMode(mode, metadata = {}) {
  if (!mode || typeof mode !== 'string') {
    return { error: 'missing_mode' };
  }

  const normalizedMode = mode.toLowerCase();
  if (!Object.values(OperationModes).includes(normalizedMode)) {
    return { error: 'invalid_mode', allowed: Object.values(OperationModes) };
  }

  if (operationMode === normalizedMode) {
    return { changed: false, state: getOperationModeState() };
  }

  operationMode = normalizedMode;
  operationModeUpdatedAt = Date.now();
  operationModeMetadata = {
    triggeredBy: metadata.triggeredBy || 'server',
    source: metadata.source || 'api'
  };

  const statePayload = getOperationModeState({ timestamp: operationModeUpdatedAt });
  broadcastModeState(statePayload);
  addSystemAlert('info', `Modo alterado para ${operationMode.toUpperCase()}`);

  if (esp32PaiConnection && esp32PaiConnection.readyState === WebSocket.OPEN) {
    try {
      esp32PaiConnection.send(JSON.stringify({ type: 'mode-sync', ...statePayload }));
    } catch (err) {
      console.error('❌ Erro ao sincronizar modo com ESP32-PAI:', err);
    }

    sendCommandToESP32({
      type: 'command',
      command: 'set_mode',
      value: operationMode,
      timestamp: statePayload.timestamp
    });
  } else {
    console.log('⚠️ ESP32-PAI indisponível para receber set_mode');
  }

  if (esp32CamConnection && esp32CamConnection.readyState === WebSocket.OPEN) {
    try {
      esp32CamConnection.send(JSON.stringify({ type: 'mode-sync', ...statePayload }));
    } catch (err) {
      console.error('❌ Erro ao sincronizar modo com ESP32-CAM:', err);
    }
  } else {
    console.log('⚠️ ESP32-CAM indisponível para receber mode-sync');
  }

  return { changed: true, state: statePayload };
}

// ===== PROCESSAMENTO DE MENSAGENS =====
function handleESP32PaiMessage(message, ws) {
  switch (message.type) {
    case 'identify': {
      console.log(`✅ ESP32-PAI identificado: ${message.deviceId}`);
      updateESP32Status('pai', true);
      addSystemAlert('info', `ESP32-PAI conectado: ${message.deviceId}`);
      break;
    }
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

  ws.send(`Mensagem recebida: ${JSON.stringify(message)}`);
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

  ws.send(`Mensagem recebida: ${JSON.stringify(message)}`);
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
  const {
    distance,
    vibrationLevel,
    alertLevel,
    alertMsg,
    moduleId,
    rssi,
    timestamp,
    temperature,
    humidity,
    sensorOk
  } = message;

  updateESP32Status('sensor', true);
  esp32Status.sensor.distance = distance;
  esp32Status.sensor.level = alertLevel;
  esp32Status.sensor.rssi = rssi;
  if (typeof temperature === 'number') esp32Status.sensor.temperature = temperature;
  if (typeof humidity === 'number') esp32Status.sensor.humidity = humidity;
  if (typeof sensorOk !== 'undefined') esp32Status.sensor.sensorOk = Boolean(sensorOk);
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
    sensorTimestamp: timestamp,
    temperature,
    humidity,
    sensorOk: typeof sensorOk !== 'undefined' ? Boolean(sensorOk) : undefined
  });

  broadcastToAppClients({
    type: 'sensor-update',
    data: {
      distance,
      vibrationLevel,
      alertLevel,
      alertMsg,
      rssi,
      timestamp: Date.now(),
      temperature,
      humidity,
      sensorOk: typeof sensorOk !== 'undefined' ? Boolean(sensorOk) : undefined
    }
  });

  updateSystemsHealth({
    sensor: true,
    vibracall: typeof vibrationLevel === 'number' && vibrationLevel > 0
  });

  if (alertLevel === 'danger' || alertLevel === 'warning') {
    addSystemAlert(alertLevel, `${alertMsg} (${distance}cm)`);
  }
}

function handleModuleStatus(message) {
  const { module, distance, rssi, vibrationLevel, frameCount, temperature, humidity, systems, sensorOk } = message;

  if (module === 'sensor') {
    updateESP32Status('sensor', true);
    esp32Status.sensor.distance = distance;
    esp32Status.sensor.rssi = rssi;
    if (typeof temperature === 'number') esp32Status.sensor.temperature = temperature;
    if (typeof humidity === 'number') esp32Status.sensor.humidity = humidity;
    if (typeof sensorOk !== 'undefined') esp32Status.sensor.sensorOk = Boolean(sensorOk);
    esp32Status.sensor.lastUpdate = Date.now();

    broadcastToSSEClients('esp32-status', {
      module: 'sensor',
      connected: true,
      distance,
      rssi,
      timestamp: Date.now(),
      temperature,
      humidity,
      sensorOk: typeof sensorOk !== 'undefined' ? Boolean(sensorOk) : undefined
    });

    updateSystemsHealth({ sensor: true });
  } else if (module === 'motor') {
    updateESP32Status('motor', true);
    esp32Status.motor.vibrationLevel = vibrationLevel;
    esp32Status.motor.lastUpdate = Date.now();

    broadcastToSSEClients('esp32-status', {
      module: 'motor',
      connected: true,
      vibrationLevel,
      timestamp: Date.now()
    });

    updateSystemsHealth({ vibracall: typeof vibrationLevel === 'number' && vibrationLevel > 0 });
  } else if (module === 'camera') {
    updateESP32Status('camera', true);
    esp32Status.camera.frameCount = frameCount;
    esp32Status.camera.rssi = rssi;
    esp32Status.camera.lastUpdate = Date.now();

    broadcastToSSEClients('esp32-status', {
      module: 'camera',
      connected: true,
      frameCount,
      rssi,
      timestamp: Date.now()
    });

    updateSystemsHealth({ camera: true });
  }

  if (systems) {
    updateSystemsHealth({
      pai: typeof systems.pai === 'boolean' ? systems.pai : systemsHealth.pai,
      sensor: typeof systems.sensor === 'boolean' ? systems.sensor : systemsHealth.sensor,
      vibracall: typeof systems.vibracall === 'boolean' ? systems.vibracall : systemsHealth.vibracall,
      camera: typeof systems.camera === 'boolean' ? systems.camera : systemsHealth.camera
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

// ===== ROTAS WEBSOCKET (WEBSOCKET-EXPRESS) =====
/**
 * @swagger
 * /ws:
 *   get:
 *     summary: Canal WebSocket do aplicativo mobile
 *     description: >-
 *       Endpoint usado pelo app para receber histórico inicial, detecções em tempo real e eventos de sensor.
 *       O handshake deve ser feito via Upgrade: websocket. Após aceitar a conexão, o servidor envia um
 *       pacote `history` seguido de atualizações `current`, `detection` e `sensor-update`.
 *     tags: [WebSockets]
 *     responses:
 *       101:
 *         description: Handshake WebSocket aceito. Eventos subsequentes seguem o formato JSON documentado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppWebSocketHistory'
 *       426:
 *         description: Requisição sem cabeçalhos de upgrade WebSocket.
 *     x-websocket:
 *       outbound:
 *         - $ref: '#/components/schemas/AppWebSocketHistory'
 *         - $ref: '#/components/schemas/Detection'
 *         - $ref: '#/components/schemas/SensorUpdateMessage'
 *       inbound:
 *         - description: Mensagens arbitrárias enviadas pelo app (debug/chat)
 *           schema:
 *             type: object
 *             additionalProperties: true
 */
router.ws('/ws', async (req, res) => {
  const ws = await res.accept();
  console.log('📱 App Mobile conectado');
  appClients.add(ws);

  ws.send(JSON.stringify({
    type: 'history',
    data: detectionHistory.slice(-10)
  }));

  if (lastDetections.length > 0) {
    ws.send(JSON.stringify({
      type: 'current',
      data: lastDetections[lastDetections.length - 1]
    }));
  }

  ws.send(JSON.stringify({
    type: 'mode-change',
    data: getOperationModeState({ timestamp: Date.now(), source: 'server-bootstrap' })
  }));

  ws.on('message', (message) => {
    const raw = message.toString();
    console.log('📱 App enviou:', raw);

    try {
      const payload = JSON.parse(raw);
      if (payload?.type === 'set-mode' && payload.mode) {
        const result = setOperationMode(payload.mode, {
          triggeredBy: payload.triggeredBy || 'app',
          source: 'app-websocket'
        });

        if (result.error) {
          ws.send(JSON.stringify({
            type: 'mode-error',
            error: result.error,
            allowed: result.allowed || Object.values(OperationModes)
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'mode-change',
            data: result.state,
            ack: true
          }));
        }
      }
    } catch (err) {
      console.error('❌ Erro ao processar mensagem do app:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('📱 App Mobile desconectado');
    appClients.delete(ws);
  });
});

/**
 * @swagger
 * /esp32:
 *   get:
 *     summary: Canal WebSocket para o ESP32-PAI-MESTRE
 *     description: >-
 *       Utilizado para receber telemetria (`sensor_update`, `status`, `alert`, `heartbeat`) e enviar comandos
 *       JSON (`command`). O dispositivo deve se identificar enviando `{"type":"identify","deviceId":"ESP32-PAI-MESTRE"}`.
 *     tags: [WebSockets]
 *     responses:
 *       101:
 *         description: Handshake WebSocket aceito para o módulo pai.
 *     x-websocket:
 *       inbound:
 *         - $ref: '#/components/schemas/ESP32IdentifyMessage'
 *         - $ref: '#/components/schemas/SensorUpdateMessage'
 *         - $ref: '#/components/schemas/ESP32StatusMessage'
 *         - $ref: '#/components/schemas/ESP32AlertMessage'
 *         - description: Mensagens heartbeat
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: heartbeat
 *               timestamp:
 *                 type: integer
 *                 format: int64
 *       outbound:
 *         - $ref: '#/components/schemas/ESP32CommandEnvelope'
 *         - $ref: '#/components/schemas/OperationModeState'
 */
router.ws('/esp32', async (req, res) => {
  const ws = await res.accept();
  console.log('\n🤝 ESP32-PAI conectado');

  esp32PaiConnection = ws;
  updateESP32Status('pai', true);
  updateSystemsHealth({ pai: true });

  ws.send(JSON.stringify({
    type: 'mode-sync',
    ...getOperationModeState({ timestamp: Date.now(), source: 'server-bootstrap' })
  }));

  sendCommandToESP32({
    type: 'command',
    command: 'set_mode',
    value: operationMode,
    timestamp: Date.now()
  });

  notifyPaiCameraStatus(esp32CamConnection && esp32CamConnection.readyState === WebSocket.OPEN);

  ws.on('message', (message) => {
    console.log('received: %s', message);

    try {
      const msg = JSON.parse(message.toString());
      console.log(`📥 ESP32-PAI enviou (${msg.type}):`, msg);
      handleESP32PaiMessage(msg, ws);
    } catch (err) {
      console.error('❌ Erro ao processar mensagem ESP32-PAI:', err);
    }
  });

  ws.on('close', () => {
    console.log('❌ ESP32-PAI desconectado');
    esp32PaiConnection = null;
    updateESP32Status('pai', false);
    updateESP32Status('sensor', false);
    updateESP32Status('motor', false);
    updateSystemsHealth({ pai: false, sensor: false, vibracall: false });
  });
});

/**
 * @swagger
 * /esp32-cam:
 *   get:
 *     summary: Canal WebSocket para o ESP32-CAM (detecção já processada)
 *     description: >-
 *       Recebe mensagens `identify`, `detection` e `heartbeat`. O corpo de `detection` segue o schema Detection.
 *     tags: [WebSockets]
 *     responses:
 *       101:
 *         description: Handshake WebSocket aceito para o módulo ESP32-CAM.
 *     x-websocket:
 *       inbound:
 *         - $ref: '#/components/schemas/ESP32IdentifyMessage'
 *         - $ref: '#/components/schemas/Detection'
 *       outbound:
 *         - description: Eventos `mode-sync` contendo o estado atual
 *           schema:
 *             $ref: '#/components/schemas/OperationModeState'
 *         - description: Acks textuais informando recebimento da mensagem
 *           schema:
 *             type: string
 */
router.ws('/esp32-cam', async (req, res) => {
  const ws = await res.accept();
  console.log('\n📷 ESP32-CAM conectado');

  esp32CamConnection = ws;
  updateESP32Status('camera', true);
  updateSystemsHealth({ camera: true });
  notifyPaiCameraStatus(true);
  ws.send(JSON.stringify({
    type: 'mode-sync',
    ...getOperationModeState({ timestamp: Date.now(), source: 'server-bootstrap' })
  }));

  ws.on('message', (message) => {
    console.log('received: %s', message);

    try {
      const msg = JSON.parse(message.toString());
      console.log(`📥 ESP32-CAM enviou (${msg.type}):`, msg);
      handleESP32CamMessage(msg, ws);
    } catch (err) {
      console.error('❌ Erro ao processar mensagem ESP32-CAM:', err);
    }
  });

  ws.on('close', () => {
    console.log('❌ ESP32-CAM desconectado');
    esp32CamConnection = null;
    updateESP32Status('camera', false);
    updateSystemsHealth({ camera: false });
    notifyPaiCameraStatus(false);
  });
});

// ===== SWAGGER =====
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vision API - Sistema ESP32 sem COCO-SSD',
      version: '3.0.0',
      description: 'Sistema de detecção de objetos recebendo descrições já processadas e traduzidas do ESP32-CAM.'
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: 'Base HTTP local' },
      { url: `ws://localhost:${PORT}`, description: 'Base WebSocket local (Upgrade obrigatório)' }
    ],
    tags: [
      { name: 'Status', description: 'Monitoramento do servidor e módulos ESP32' },
      { name: 'Detecções', description: 'Consultas de detecções processadas pelo ESP32-CAM' },
      { name: 'ESP32', description: 'Comandos HTTP destinados aos módulos ESP32' },
      { name: 'Streams', description: 'Eventos em tempo real via Server-Sent Events (SSE)' },
      { name: 'WebSockets', description: 'Canais WebSocket para App Mobile, ESP32-PAI e ESP32-CAM' }
    ],
    components: {
      schemas: {
        Detection: {
          type: 'object',
          required: ['description', 'objects', 'timestamp'],
          properties: {
            description: { type: 'string', description: 'Descrição em português retornada pelo ESP32-CAM' },
            description_kz: { type: 'string', description: 'Descrição em cazaque', nullable: true },
            objects: {
              type: 'array',
              description: 'Lista de objetos detectados',
              items: { type: 'string' }
            },
            confidence: { type: 'number', format: 'float', nullable: true },
            timestamp: { type: 'integer', format: 'int64', description: 'Timestamp informado pelo ESP32-CAM (ms)' },
            receivedAt: { type: 'integer', format: 'int64', description: 'Timestamp em que o servidor recebeu a mensagem', nullable: true }
          },
          example: {
            description: 'Cadeira à frente a 40cm',
            description_kz: 'Алдыңғы орындық 40см',
            objects: ['cadeira'],
            confidence: 0.78,
            timestamp: 1700000000000,
            receivedAt: 1700000000500
          }
        },
        DetectionHistoryResponse: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            returned: { type: 'integer' },
            detections: {
              type: 'array',
              items: { $ref: '#/components/schemas/Detection' }
            }
          }
        },
        CurrentDetectionResponse: {
          type: 'object',
          properties: {
            detecting: { type: 'boolean' },
            count: { type: 'integer' },
            description: { type: 'string' },
            description_kz: { type: 'string', nullable: true },
            objects: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number', format: 'float', nullable: true },
            timestamp: { type: 'string', format: 'date-time' },
            secondsAgo: { type: 'integer', nullable: true, description: 'Tempo em segundos desde a última detecção quando disponível' }
          }
        },
        ESP32ModuleStatus: {
          type: 'object',
          properties: {
            connected: { type: 'boolean' },
            lastSeen: { type: 'string', format: 'date-time', nullable: true },
            lastUpdate: { type: 'integer', format: 'int64', nullable: true },
            distance: { type: 'number', nullable: true },
            level: { type: 'string', enum: ['safe', 'warning', 'danger'], nullable: true },
            rssi: { type: 'integer', nullable: true },
            vibrationLevel: { type: 'number', nullable: true },
            frameCount: { type: 'integer', nullable: true },
            temperature: { type: 'number', format: 'float', nullable: true },
            humidity: { type: 'number', format: 'float', nullable: true },
            sensorOk: { type: 'boolean', nullable: true }
          }
        },
        ESP32StatusMap: {
          type: 'object',
          properties: {
            pai: { $ref: '#/components/schemas/ESP32ModuleStatus' },
            sensor: { $ref: '#/components/schemas/ESP32ModuleStatus' },
            motor: { $ref: '#/components/schemas/ESP32ModuleStatus' },
            camera: { $ref: '#/components/schemas/ESP32ModuleStatus' }
          }
        },
        ConnectedClients: {
          type: 'object',
          properties: {
            app: { type: 'integer', description: 'Número de apps conectados via WebSocket' },
            esp32Pai: { type: 'integer' },
            esp32Cam: { type: 'integer' }
          }
        },
        SystemStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'online' },
            uptime: { type: 'number', description: 'Tempo em segundos desde o boot' },
            serverStartTime: { type: 'integer', format: 'int64' },
            esp32Status: { $ref: '#/components/schemas/ESP32StatusMap' },
            totalDetections: { type: 'integer' },
            connectedClients: { $ref: '#/components/schemas/ConnectedClients' },
            sseClients: { type: 'integer' },
            lastDetection: { $ref: '#/components/schemas/Detection', nullable: true },
            currentObjects: { type: 'integer' },
            version: { type: 'string' },
            mode: { type: 'string', example: 'no-coco-ssd' },
            operationMode: { $ref: '#/components/schemas/OperationModeState' },
            systemsHealth: { $ref: '#/components/schemas/SystemsHealth' }
          }
        },
        SystemsHealth: {
          type: 'object',
          properties: {
            pai: { type: 'boolean', example: true },
            sensor: { type: 'boolean', example: true },
            vibracall: { type: 'boolean', example: false },
            camera: { type: 'boolean', example: true }
          },
          description: 'Indicadores simples de conectividade/atividade dos módulos monitorados'
        },
        OperationModeState: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: Object.values(OperationModes), example: 'realtime' },
            updatedAt: { type: 'integer', format: 'int64' },
            triggeredBy: { type: 'string' },
            source: { type: 'string' },
            timestamp: { type: 'integer', format: 'int64', nullable: true }
          },
          description: 'Estado atual do modo de operação manual/realtime',
          example: {
            mode: 'realtime',
            updatedAt: 1700000000100,
            triggeredBy: 'server',
            source: 'boot',
            timestamp: 1700000000100
          }
        },
        SetOperationModeRequest: {
          type: 'object',
          required: ['mode'],
          properties: {
            mode: { type: 'string', enum: Object.values(OperationModes) },
            triggeredBy: { type: 'string', description: 'Identificação opcional do cliente' }
          },
          example: {
            mode: 'manual',
            triggeredBy: 'mobile-app'
          }
        },
        SetOperationModeResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            changed: { type: 'boolean' },
            state: { $ref: '#/components/schemas/OperationModeState' },
            availableModes: {
              type: 'array',
              items: { type: 'string', enum: Object.values(OperationModes) }
            }
          },
          example: {
            success: true,
            changed: true,
            state: {
              mode: 'manual',
              updatedAt: 1700001234567,
              triggeredBy: 'mobile-app',
              source: 'http-api',
              timestamp: 1700001234567
            },
            availableModes: ['realtime', 'manual']
          }
        },
        GetOperationModeResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            state: { $ref: '#/components/schemas/OperationModeState' },
            availableModes: {
              type: 'array',
              items: { type: 'string', enum: Object.values(OperationModes) }
            }
          },
          example: {
            success: true,
            state: {
              mode: 'realtime',
              updatedAt: 1700009876543,
              triggeredBy: 'server',
              source: 'boot',
              timestamp: 1700009876543
            },
            availableModes: ['realtime', 'manual']
          }
        },
        CommandRequest: {
          type: 'object',
          required: ['command'],
          properties: {
            command: {
              type: 'string',
              enum: ['test_motor', 'get_status', 'calibrate_sensor', 'reboot', 'set_vibration', 'set_mode'],
              description: 'Comando suportado pelo firmware do ESP32-PAI'
            },
            value: {
              oneOf: [{ type: 'number' }, { type: 'string' }],
              nullable: true,
              description: 'Valor opcional (ex: intensidade de vibração)'
            }
          }
        },
        CommandResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            command: {
              $ref: '#/components/schemas/ESP32CommandEnvelope'
            }
          }
        },
        DescriptionRequest: {
          type: 'object',
          required: ['description_pt'],
          properties: {
            description_pt: { type: 'string' },
            description_kz: { type: 'string', nullable: true },
            objects: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number', format: 'float', nullable: true }
          }
        },
        SSEEvent: {
          type: 'object',
          properties: {
            event: { type: 'string', description: 'Nome do evento SSE' },
            data: {
              oneOf: [
                { $ref: '#/components/schemas/Detection' },
                { $ref: '#/components/schemas/SensorUpdateMessage' },
                { $ref: '#/components/schemas/ESP32StatusMessage' },
                { $ref: '#/components/schemas/ESP32AlertMessage' },
                { $ref: '#/components/schemas/OperationModeState' },
                { $ref: '#/components/schemas/SystemsHealth' }
              ]
            }
          }
        },
        SensorUpdateMessage: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'sensor_update' },
            distance: { type: 'number', description: 'Distância em centímetros' },
            vibrationLevel: { type: 'number' },
            alertLevel: { type: 'string', enum: ['safe', 'warning', 'danger'] },
            alertMsg: { type: 'string' },
            moduleId: { type: 'integer' },
            rssi: { type: 'integer', description: 'Força do sinal Wi-Fi em dBm' },
            timestamp: { type: 'integer', format: 'int64' },
            temperature: { type: 'number', format: 'float', nullable: true },
            humidity: { type: 'number', format: 'float', nullable: true },
            sensorOk: { type: 'boolean', nullable: true }
          }
        },
        ESP32StatusMessage: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'status' },
            module: { type: 'string', enum: ['sensor', 'motor', 'camera'] },
            distance: { type: 'number', nullable: true },
            rssi: { type: 'integer', nullable: true },
            timestamp: { type: 'integer', format: 'int64' },
            lastSensorUpdate: { type: 'integer', format: 'int64', nullable: true },
            level: { type: 'string', enum: ['safe', 'warning', 'danger'], nullable: true },
            vibrationLevel: { type: 'number', nullable: true },
            frameCount: { type: 'integer', nullable: true },
            temperature: { type: 'number', format: 'float', nullable: true },
            humidity: { type: 'number', format: 'float', nullable: true },
            sensorOk: { type: 'boolean', nullable: true },
            systems: { $ref: '#/components/schemas/SystemsHealth' }
          }
        },
        ESP32AlertMessage: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'alert' },
            level: { type: 'string', enum: ['info', 'warning', 'danger'] },
            msg: { type: 'string' },
            distance: { type: 'number', nullable: true },
            timestamp: { type: 'integer', format: 'int64', nullable: true }
          }
        },
        ESP32CommandEnvelope: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'command' },
            command: {
              type: 'string',
              enum: ['test_motor', 'get_status', 'calibrate_sensor', 'reboot', 'set_vibration', 'set_mode']
            },
            value: {
              oneOf: [{ type: 'number' }, { type: 'string' }],
              nullable: true
            },
            timestamp: { type: 'integer', format: 'int64' }
          }
        },
        ESP32IdentifyMessage: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'identify' },
            deviceId: { type: 'string', example: 'ESP32-PAI-MESTRE' }
          }
        },
        AppWebSocketHistory: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['history', 'current', 'detection', 'sensor-update'] },
            data: {
              oneOf: [
                {
                  type: 'array',
                  description: 'Últimas detecções entregues no evento history',
                  items: { $ref: '#/components/schemas/Detection' }
                },
                { $ref: '#/components/schemas/Detection' },
                { $ref: '#/components/schemas/SensorUpdateMessage' }
              ]
            }
          }
        }
      },
      parameters: {
        LimitParam: {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100 },
          description: 'Quantidade máxima de detecções retornadas (default: 20)'
        }
      },
      examples: {
        WarningSensorUpdate: {
          summary: 'Atualização de sensor com alerta WARNING',
          value: {
            type: 'sensor_update',
            distance: 40,
            vibrationLevel: 2,
            alertLevel: 'warning',
            alertMsg: '⚠️ ATENÇÃO! Objeto próximo',
            moduleId: 1,
            rssi: -58,
            timestamp: 80973
          }
        },
        WarningAlert: {
          summary: 'Alerta enviado pelo ESP32-PAI com nível WARNING',
          value: {
            type: 'alert',
            level: 'warning',
            msg: '⚠️ ATENÇÃO! Objeto próximo',
            distance: 40,
            timestamp: 80976
          }
        }
      }
    }
  },
  apis: ['./teste-web.js']
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

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Retorna o estado atual do servidor de visão
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Informações de uptime, conexões e últimos eventos dos módulos ESP32.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemStatus'
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    serverStartTime: SERVER_START_TIME,
    esp32Status,
    totalDetections: detectionHistory.length,
    connectedClients: {
      app: appClients.size,
      esp32Pai: esp32PaiConnection && esp32PaiConnection.readyState === WebSocket.OPEN ? 1 : 0,
      esp32Cam: esp32CamConnection && esp32CamConnection.readyState === WebSocket.OPEN ? 1 : 0
    },
    sseClients: sseClients.size,
    lastDetection: lastDetections.length > 0 ? lastDetections[lastDetections.length - 1] : null,
    currentObjects: lastDetections.length > 0 ? lastDetections[lastDetections.length - 1].objects.length : 0,
    version: '3.0.0',
    mode: 'no-coco-ssd',
    operationMode: getOperationModeState(),
    systemsHealth
  });
});

/**
 * @swagger
 * /api/detections/current:
 *   get:
 *     summary: Consulta a última detecção recebida do ESP32-CAM
 *     tags: [Detecções]
 *     responses:
 *       200:
 *         description: Última detecção conhecida ou mensagem informando ausência de dados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentDetectionResponse'
 */
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

/**
 * @swagger
 * /api/detections/history:
 *   get:
 *     summary: Lista o histórico de detecções armazenadas em memória
 *     tags: [Detecções]
 *     parameters:
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Lista paginada (em memória) das últimas detecções.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DetectionHistoryResponse'
 */
app.get('/api/detections/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const history = detectionHistory.slice(-limit).reverse();

  res.json({
    total: detectionHistory.length,
    returned: history.length,
    detections: history
  });
});

/**
 * @swagger
 * /api/stream/events:
 *   get:
 *     summary: Abre um canal Server-Sent Events (SSE) com telemetria em tempo real
 *     tags: [Streams]
 *     responses:
 *       200:
 *         description: Fluxo contínuo SSE contendo eventos `detection`, `sensor-update`, `mode-change`, `systems-health`, `system-alert` e `ping`.
 *         content:
 *           text/event-stream:
 *             schema:
 *               $ref: '#/components/schemas/SSEEvent'
 */
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
  sendSSEUpdate(res, 'mode-change', getOperationModeState({ timestamp: Date.now() }));
  sendSSEUpdate(res, 'systems-health', systemsHealth);

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

/**
 * @swagger
 * /api/operation-mode:
 *   get:
 *     summary: Retorna o modo de operação atual (manual ou realtime)
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Estado atual do modo e metadados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetOperationModeResponse'
 *             examples:
 *               realtime:
 *                 summary: Modo atual em realtime
 *                 value:
 *                   success: true
 *                   state:
 *                     mode: realtime
 *                     updatedAt: 1700009876543
 *                     triggeredBy: server
 *                     source: boot
 *                     timestamp: 1700009876543
 *                   availableModes: [realtime, manual]
 *   post:
 *     summary: Alterna o modo de operação e notifica app + ESP32
 *     tags: [ESP32]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetOperationModeRequest'
 *           examples:
 *             manual:
 *               summary: Alterar para modo manual
 *               value:
 *                 mode: manual
 *                 triggeredBy: painel-de-teste
 *             realtime:
 *               summary: Retornar para modo em tempo real
 *               value:
 *                 mode: realtime
 *                 triggeredBy: operador
 *     responses:
 *       200:
 *         description: Modo atualizado com sucesso (ou já estava no modo solicitado).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SetOperationModeResponse'
 *             examples:
 *               manual:
 *                 summary: Mudança para modo manual
 *                 value:
 *                   success: true
 *                   changed: true
 *                   state:
 *                     mode: manual
 *                     updatedAt: 1700001234567
 *                     triggeredBy: painel-de-teste
 *                     source: http-api
 *                     timestamp: 1700001234567
 *                   availableModes: [realtime, manual]
 *               realtime:
 *                 summary: Já estava em realtime
 *                 value:
 *                   success: true
 *                   changed: false
 *                   state:
 *                     mode: realtime
 *                     updatedAt: 1700009876543
 *                     triggeredBy: server
 *                     source: boot
 *                     timestamp: 1700009876543
 *                   availableModes: [realtime, manual]
 *       400:
 *         description: Modo inválido ou ausente.
 */
app.get('/api/operation-mode', (req, res) => {
  res.json({
    success: true,
    state: getOperationModeState(),
    availableModes: Object.values(OperationModes)
  });
});

app.post('/api/operation-mode', (req, res) => {
  const { mode, triggeredBy } = req.body || {};
  const result = setOperationMode(mode, {
    triggeredBy: triggeredBy || 'http-api',
    source: 'http-api'
  });

  if (result.error) {
    return res.status(400).json({
      success: false,
      error: result.error,
      allowedModes: result.allowed || Object.values(OperationModes)
    });
  }

  res.json({
    success: true,
    changed: result.changed,
    state: result.state,
    availableModes: Object.values(OperationModes)
  });
});

/**
 * @swagger
 * /api/esp32/command:
 *   post:
 *     summary: Envia um comando JSON ao ESP32-PAI conectado via WebSocket
 *     tags: [ESP32]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommandRequest'
 *     responses:
 *       200:
 *         description: Comando transmitido ao ESP32-PAI.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommandResponse'
 *       400:
 *         description: Comando ausente ou não suportado.
 *       503:
 *         description: ESP32-PAI não está conectado ao servidor.
 */
app.post('/api/esp32/command', (req, res) => {
  const { command, value } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      message: 'Comando não especificado'
    });
  }

  const validCommands = ['test_motor', 'get_status', 'calibrate_sensor', 'reboot', 'set_vibration', 'set_mode'];
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

/**
 * @swagger
 * /api/esp32-cam/send-description:
 *   post:
 *     summary: Simula o envio de uma descrição já traduzida (útil para testes)
 *     tags: [Detecções]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DescriptionRequest'
 *     responses:
 *       200:
 *         description: Descrição aceita e distribuída via SSE/WebSocket.
 *       400:
 *         description: Campo description_pt ausente.
 */
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

/**
 * @swagger
 * /api/esp32-cam/capture-now:
 *   post:
 *     summary: Solicita captura manual imediata da câmera
 *     description: Envia sinal para o script Python capturar e processar uma imagem agora
 *     tags: [ESP32-CAM]
 *     responses:
 *       200:
 *         description: Sinal de captura enviado
 */
app.post('/api/esp32-cam/capture-now', (req, res) => {
  // Apenas retorna OK - o script Python verifica periodicamente este endpoint
  // ou podemos usar uma flag global
  global.manualCaptureRequested = true;
  global.manualCaptureTimestamp = Date.now();

  console.log('📸 Captura manual solicitada via API');

  res.json({
    success: true,
    message: 'Sinal de captura manual enviado',
    timestamp: global.manualCaptureTimestamp
  });
});

/**
 * @swagger
 * /api/esp32-cam/capture-status:
 *   get:
 *     summary: Verifica se há solicitação de captura manual pendente
 *     description: Endpoint para o script Python verificar se deve capturar
 *     tags: [ESP32-CAM]
 *     responses:
 *       200:
 *         description: Status da captura manual
 */
app.get('/api/esp32-cam/capture-status', (req, res) => {
  const shouldCapture = global.manualCaptureRequested || false;
  const timestamp = global.manualCaptureTimestamp || 0;

  // Reset da flag após consulta
  if (shouldCapture) {
    global.manualCaptureRequested = false;
  }

  res.json({
    shouldCapture,
    timestamp,
    mode: operationMode
  });
});

// ===== INICIALIZAÇÃO =====
app.use(router);
app.set('shutdown timeout', 1000);

const server = app.createServer();
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
  console.log('   Use este IP no main.cpp:\n');
  console.log(`   const char* wsServer = "${localIP}";`);
  console.log(`   const int wsPort = ${PORT};`);
  console.log('   const char* wsPath = "/esp32";\n');
  console.log('✅ Servidor pronto para receber conexões!\n');
});
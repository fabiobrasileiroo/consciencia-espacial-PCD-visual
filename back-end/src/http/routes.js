const {
  commandRequestSchema,
  sendDescriptionSchema,
  detectionsHistoryQuerySchema
} = require('../validators/zodSchemas');
const {
  registerSSEClient,
  unregisterSSEClient,
  sendSSEUpdate
} = require('../services/broadcastService');
const {
  handleObjectDetection,
  sendCommandToESP32
} = require('../services/systemService');
const { getLocalIP } = require('../utils/network');
const {
  SERVER_START_TIME,
  PORT,
  SSE_PING_INTERVAL
} = require('../config/constants');
const { DEFAULT_COMMANDS } = require('../config/constants');

function registerHttpRoutes(router, state) {
  router.get('/', (req, res) => {
    const localIP = getLocalIP();
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Vision API - ESP32 (Sem COCO-SSD)</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
            .card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #667eea; }
            .badge { display: inline-block; background: #10b981; color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px; margin-left: 10px; }
            a { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px; }
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

  router.get('/api/status', (req, res) => {
    const lastDetection = state.lastDetections.length > 0 ? state.lastDetections[state.lastDetections.length - 1] : null;
    const currentObjects = lastDetection ? (lastDetection.objects || []).length : 0;

    res.json({
      status: 'online',
      uptime: process.uptime(),
      serverStartTime: SERVER_START_TIME,
      esp32Status: state.esp32Status,
      totalDetections: state.detectionHistory.length,
      connectedClients: {
        app: state.appClients.size,
        esp32Pai: state.esp32PaiConnection && state.esp32PaiConnection.readyState === 1 ? 1 : 0,
        esp32Cam: state.esp32CamConnection && state.esp32CamConnection.readyState === 1 ? 1 : 0
      },
      sseClients: state.sseClients.size,
      lastDetection,
      currentObjects,
      version: '3.0.0',
      mode: 'no-coco-ssd'
    });
  });

  router.get('/api/detections/current', (req, res) => {
    if (state.lastDetections.length === 0) {
      return res.json({
        detecting: false,
        count: 0,
        description: 'Nenhuma detecção recente',
        objects: [],
        timestamp: new Date().toISOString()
      });
    }

    const latest = state.lastDetections[state.lastDetections.length - 1];
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

  router.get('/api/detections/history', (req, res) => {
    const validation = detectionsHistoryQuerySchema.safeParse(req.query);
    const limit = validation.success && validation.data.limit ? validation.data.limit : 20;
    const history = state.detectionHistory.slice(-limit).reverse();

    res.json({
      total: state.detectionHistory.length,
      returned: history.length,
      detections: history
    });
  });

  router.get('/api/stream/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    registerSSEClient(state, res);
    console.log(`📡 Cliente SSE conectado (total: ${state.sseClients.size})`);

    sendSSEUpdate(res, 'connected', { message: 'Conectado ao servidor', timestamp: Date.now() });
    sendSSEUpdate(res, 'esp32-status-all', state.esp32Status);

    if (state.lastDetections.length > 0) {
      const latest = state.lastDetections[state.lastDetections.length - 1];
      sendSSEUpdate(res, 'detection', {
        description: latest.description,
        objects: latest.objects,
        count: latest.objects.length,
        timestamp: latest.timestamp
      });
    }

    const keepalive = setInterval(() => {
      sendSSEUpdate(res, 'ping', { timestamp: Date.now() });
    }, SSE_PING_INTERVAL);

    req.on('close', () => {
      clearInterval(keepalive);
      unregisterSSEClient(state, res);
      console.log(`📡 Cliente SSE desconectado (restam: ${state.sseClients.size})`);
    });
  });

  router.post('/api/esp32/command', (req, res) => {
    const validation = commandRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Payload inválido',
        errors: validation.error.flatten()
      });
    }

    if (!DEFAULT_COMMANDS.includes(validation.data.command)) {
      return res.status(400).json({
        success: false,
        message: `Comando inválido. Use: ${DEFAULT_COMMANDS.join(', ')}`
      });
    }

    const commandMsg = {
      type: 'command',
      ...validation.data,
      timestamp: Date.now()
    };

    const sent = sendCommandToESP32(state, commandMsg);

    return res.status(sent ? 200 : 503).json({
      success: sent,
      message: sent ? 'Comando enviado ao ESP32-PAI' : 'ESP32-PAI não está conectado',
      command: commandMsg
    });
  });

  router.post('/api/esp32-cam/send-description', (req, res) => {
    const validation = sendDescriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Payload inválido',
        errors: validation.error.flatten()
      });
    }

    handleObjectDetection(state, {
      type: 'detection',
      ...validation.data,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      message: 'Descrição recebida e distribuída',
      receivedAt: Date.now()
    });
  });
}

module.exports = { registerHttpRoutes };

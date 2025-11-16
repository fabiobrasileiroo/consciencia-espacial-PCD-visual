const WebSocket = require('ws');
const {
  esp32PaiMessageSchema,
  esp32CamMessageSchema
} = require('../validators/zodSchemas');
const {
  registerAppClient,
  unregisterAppClient
} = require('../services/broadcastService');
const {
  handleESP32PaiMessage,
  handleESP32CamMessage
} = require('../services/systemService');

function parseMessage(message, schema) {
  let payload;
  try {
    payload = JSON.parse(message);
  } catch (error) {
    return { success: false, error: 'JSON inválido' };
  }

  const validation = schema.safeParse(payload);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten() };
  }

  return { success: true, data: validation.data };
}

function registerWebsocketRoutes(router, state) {
  router.ws('/ws', async (req, res) => {
    const ws = await res.accept();
    console.log('📱 App Mobile conectado');
    registerAppClient(state, ws);

    ws.send(JSON.stringify({
      type: 'history',
      data: state.detectionHistory.slice(-10)
    }));

    if (state.lastDetections.length > 0) {
      ws.send(JSON.stringify({
        type: 'current',
        data: state.lastDetections[state.lastDetections.length - 1]
      }));
    }

    ws.on('message', (message) => {
      console.log('📱 App enviou:', message.toString());
    });

    ws.on('close', () => {
      console.log('📱 App Mobile desconectado');
      unregisterAppClient(state, ws);
    });
  });

  router.ws('/esp32', async (req, res) => {
    const ws = await res.accept();
    console.log('\n🤝 ESP32-PAI conectado');

    state.esp32PaiConnection = ws;
    state.esp32Status.pai.connected = true;
    state.esp32Status.pai.lastSeen = new Date().toISOString();

    ws.on('message', (message) => {
      const parsed = parseMessage(message, esp32PaiMessageSchema);
      if (!parsed.success) {
        console.error('❌ Payload inválido do ESP32-PAI:', parsed.error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Payload inválido do ESP32-PAI',
          details: parsed.error
        }));
        return;
      }

      handleESP32PaiMessage(state, parsed.data);
      ws.send(JSON.stringify({ status: 'ok', receivedAt: Date.now() }));
    });

    ws.on('close', () => {
      console.log('❌ ESP32-PAI desconectado');
      state.esp32PaiConnection = null;
      state.esp32Status.pai.connected = false;
      state.esp32Status.sensor.connected = false;
      state.esp32Status.motor.connected = false;
    });
  });

  router.ws('/esp32-cam', async (req, res) => {
    const ws = await res.accept();
    console.log('\n📷 ESP32-CAM conectado');

    state.esp32CamConnection = ws;
    state.esp32Status.camera.connected = true;
    state.esp32Status.camera.lastSeen = new Date().toISOString();

    ws.on('message', (message) => {
      const parsed = parseMessage(message, esp32CamMessageSchema);
      if (!parsed.success) {
        console.error('❌ Payload inválido do ESP32-CAM:', parsed.error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Payload inválido do ESP32-CAM',
          details: parsed.error
        }));
        return;
      }

      handleESP32CamMessage(state, parsed.data);
      ws.send(JSON.stringify({ status: 'ok', receivedAt: Date.now() }));
    });

    ws.on('close', () => {
      console.log('❌ ESP32-CAM desconectado');
      state.esp32CamConnection = null;
      state.esp32Status.camera.connected = false;
    });
  });
}

module.exports = { registerWebsocketRoutes };

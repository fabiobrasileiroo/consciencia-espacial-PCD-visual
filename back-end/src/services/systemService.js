const { MAX_HISTORY, MAX_ALERTS } = require('../state/systemState');
const { broadcastToAppClients, broadcastToSSEClients } = require('./broadcastService');

function addSystemAlert(state, level, message) {
  const alert = {
    level,
    message,
    timestamp: Date.now(),
    timestampStr: new Date().toISOString()
  };

  state.systemAlerts.unshift(alert);
  if (state.systemAlerts.length > MAX_ALERTS) {
    state.systemAlerts.pop();
  }

  broadcastToSSEClients(state, 'system-alert', alert);
  return alert;
}

function handleObjectDetection(state, payload) {
  const detection = {
    description: payload.description_pt,
    description_kz: payload.description_kz || payload.description_pt,
    objects: payload.objects || [],
    confidence: payload.confidence,
    timestamp: payload.timestamp || Date.now(),
    receivedAt: Date.now()
  };

  state.lastDetections.push(detection);
  if (state.lastDetections.length > 5) {
    state.lastDetections.shift();
  }

  state.detectionHistory.push(detection);
  if (state.detectionHistory.length > MAX_HISTORY) {
    state.detectionHistory.shift();
  }

  state.esp32Status.camera.connected = true;
  state.esp32Status.camera.lastSeen = new Date().toISOString();

  broadcastToSSEClients(state, 'detection', {
    description: detection.description,
    description_kz: detection.description_kz,
    objects: detection.objects,
    confidence: detection.confidence,
    count: detection.objects.length,
    timestamp: detection.timestamp
  });

  broadcastToAppClients(state, {
    type: 'detection',
    data: detection
  });
}

function handleSensorUpdate(state, payload) {
  state.esp32Status.sensor = {
    ...state.esp32Status.sensor,
    connected: true,
    lastSeen: new Date().toISOString(),
    distance: payload.distance,
    level: payload.alertLevel,
    rssi: payload.rssi
  };

  state.esp32Status.motor = {
    ...state.esp32Status.motor,
    connected: true,
    lastSeen: new Date().toISOString(),
    vibrationLevel: payload.vibrationLevel
  };

  broadcastToSSEClients(state, 'sensor-update', {
    distance: payload.distance,
    vibrationLevel: payload.vibrationLevel,
    alertLevel: payload.alertLevel,
    alertMsg: payload.alertMsg,
    rssi: payload.rssi,
    moduleId: payload.moduleId,
    timestamp: Date.now(),
    sensorTimestamp: payload.timestamp
  });

  broadcastToAppClients(state, {
    type: 'sensor-update',
    data: {
      distance: payload.distance,
      vibrationLevel: payload.vibrationLevel,
      alertLevel: payload.alertLevel,
      alertMsg: payload.alertMsg,
      rssi: payload.rssi,
      timestamp: Date.now()
    }
  });

  if (payload.alertLevel === 'danger' || payload.alertLevel === 'warning') {
    addSystemAlert(state, payload.alertLevel, `${payload.alertMsg} (${payload.distance}cm)`);
  }
}

function handleModuleStatus(state, payload) {
  if (payload.module === 'sensor') {
    state.esp32Status.sensor = {
      ...state.esp32Status.sensor,
      connected: true,
      lastSeen: new Date().toISOString(),
      distance: payload.distance,
      rssi: payload.rssi
    };

    broadcastToSSEClients(state, 'esp32-status', {
      module: 'sensor',
      connected: true,
      distance: payload.distance,
      rssi: payload.rssi,
      timestamp: Date.now()
    });
  } else if (payload.module === 'motor') {
    state.esp32Status.motor = {
      ...state.esp32Status.motor,
      connected: true,
      lastSeen: new Date().toISOString(),
      vibrationLevel: payload.vibrationLevel
    };

    broadcastToSSEClients(state, 'esp32-status', {
      module: 'motor',
      connected: true,
      vibrationLevel: payload.vibrationLevel,
      timestamp: Date.now()
    });
  } else if (payload.module === 'camera') {
    state.esp32Status.camera = {
      ...state.esp32Status.camera,
      connected: true,
      lastSeen: new Date().toISOString(),
      frameCount: payload.frameCount,
      rssi: payload.rssi
    };

    broadcastToSSEClients(state, 'esp32-status', {
      module: 'camera',
      connected: true,
      frameCount: payload.frameCount,
      rssi: payload.rssi,
      timestamp: Date.now()
    });
  }
}

function handleESP32Alert(state, payload) {
  addSystemAlert(state, payload.level, payload.msg);

  if (payload.level === 'danger') {
    broadcastToSSEClients(state, 'alert', {
      type: 'danger',
      message: payload.msg,
      distance: payload.distance,
      timestamp: Date.now()
    });
  }
}

function handleESP32PaiMessage(state, payload) {
  switch (payload.type) {
    case 'identify':
      console.log(`✅ ESP32-PAI identificado: ${payload.deviceId}`);
      state.esp32Status.pai.connected = true;
      state.esp32Status.pai.lastSeen = new Date().toISOString();
      addSystemAlert(state, 'info', `ESP32-PAI conectado: ${payload.deviceId}`);
      break;
    case 'sensor_update':
      handleSensorUpdate(state, payload);
      break;
    case 'status':
      handleModuleStatus(state, payload);
      break;
    case 'alert':
      handleESP32Alert(state, payload);
      break;
    case 'heartbeat':
      state.esp32Status.pai.connected = true;
      state.esp32Status.pai.lastSeen = new Date().toISOString();
      break;
    default:
      console.log(`⚠️ Tipo de mensagem ESP32-PAI não suportado: ${payload.type}`);
  }
}

function handleESP32CamMessage(state, payload) {
  switch (payload.type) {
    case 'identify':
      console.log(`✅ ESP32-CAM identificado: ${payload.deviceId}`);
      state.esp32Status.camera.connected = true;
      state.esp32Status.camera.lastSeen = new Date().toISOString();
      addSystemAlert(state, 'info', `ESP32-CAM conectado: ${payload.deviceId}`);
      break;
    case 'detection':
      handleObjectDetection(state, payload);
      break;
    case 'heartbeat':
      state.esp32Status.camera.connected = true;
      state.esp32Status.camera.lastSeen = new Date().toISOString();
      break;
    default:
      console.log(`⚠️ Tipo de mensagem ESP32-CAM não suportado: ${payload.type}`);
  }
}

function sendCommandToESP32(state, command) {
  if (!state.esp32PaiConnection || state.esp32PaiConnection.readyState !== 1) {
    return false;
  }

  try {
    state.esp32PaiConnection.send(JSON.stringify(command));
    console.log('📤 Comando enviado ao ESP32-PAI:', command);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar comando ao ESP32-PAI:', error);
    return false;
  }
}

module.exports = {
  addSystemAlert,
  handleObjectDetection,
  handleSensorUpdate,
  handleModuleStatus,
  handleESP32Alert,
  handleESP32PaiMessage,
  handleESP32CamMessage,
  sendCommandToESP32
};

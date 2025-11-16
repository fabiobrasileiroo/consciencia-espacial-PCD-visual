const { MAX_HISTORY, MAX_ALERTS } = require('../config/constants');

const systemState = {
  lastDetections: [],
  detectionHistory: [],
  esp32Status: {
    pai: { connected: false, lastSeen: null },
    sensor: { connected: false, lastSeen: null, distance: null, level: null, rssi: null },
    motor: { connected: false, lastSeen: null, vibrationLevel: 0 },
    camera: { connected: false, lastSeen: null, frameCount: null, rssi: null }
  },
  systemAlerts: [],
  sseClients: new Set(),
  appClients: new Set(),
  esp32PaiConnection: null,
  esp32CamConnection: null
};

module.exports = {
  systemState,
  MAX_HISTORY,
  MAX_ALERTS
};

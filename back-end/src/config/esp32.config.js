/**
 * Configurações do ESP32-CAM
 */

module.exports = {
  // IP do ESP32-CAM (SEM http://)
  ip: process.env.ESP32_IP || '192.168.100.56',

  // Porta do stream
  streamPort: parseInt(process.env.ESP32_STREAM_PORT || '81'),

  // Modo de operação: true = streaming contínuo, false = captura individual
  useStreaming: process.env.USE_STREAMING === 'true' || false,

  // Intervalo entre processamentos (ms)
  captureInterval: parseInt(process.env.CAPTURE_INTERVAL || '2000'),

  // Confiança mínima para detecção
  minConfidence: parseFloat(process.env.MIN_CONFIDENCE || '0.5'),

  // Máximo de objetos por frame
  maxDetectionsPerFrame: parseInt(process.env.MAX_DETECTIONS || '5'),

  // Timeout para stream (ms)
  streamTimeout: parseInt(process.env.STREAM_TIMEOUT || '10000'),

  // Logs detalhados
  debug: process.env.DEBUG === 'true' || true,

  // URLs construídas
  getUrls: function () {
    return {
      stream: `http://${this.ip}:${this.streamPort}/stream`,
      capture: `http://${this.ip}/capture`,
      status: `http://${this.ip}/status`,
      control: `http://${this.ip}/control`
    };
  }
};

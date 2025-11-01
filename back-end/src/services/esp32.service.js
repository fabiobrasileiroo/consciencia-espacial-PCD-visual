/**
 * Serviço de Captura do ESP32-CAM
 */

const axios = require('axios');
const esp32Config = require('../config/esp32.config');

class ESP32Service {
  constructor() {
    this.config = esp32Config;
    this.urls = this.config.getUrls();
  }

  /**
   * Captura frame individual do ESP32-CAM
   */
  async captureFrame() {
    try {
      if (this.config.debug) {
        console.log(`📡 Capturando frame de ${this.urls.capture}...`);
      }

      const response = await axios.get(this.urls.capture, {
        responseType: 'arraybuffer',
        timeout: 5000
      });

      const buffer = Buffer.from(response.data);

      if (this.config.debug) {
        console.log(`✅ Frame capturado: ${buffer.length} bytes`);
      }

      return buffer;
    } catch (error) {
      console.error('❌ Erro ao capturar frame:', error.message);
      return null;
    }
  }

  /**
   * Testa conexão com ESP32-CAM
   */
  async testConnection() {
    try {
      const response = await axios.get(this.urls.status, { timeout: 3000 });
      return {
        success: true,
        status: 'ESP32-CAM online',
        ip: this.config.ip,
        mode: this.config.useStreaming ? 'streaming' : 'capture',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        status: 'ESP32-CAM offline',
        error: error.message
      };
    }
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig) {
    if (newConfig.ip) this.config.ip = newConfig.ip;
    if (typeof newConfig.useStreaming !== 'undefined') {
      this.config.useStreaming = newConfig.useStreaming;
    }
    if (newConfig.captureInterval) {
      this.config.captureInterval = newConfig.captureInterval;
    }
    if (newConfig.minConfidence) {
      this.config.minConfidence = newConfig.minConfidence;
    }

    // Atualizar URLs
    this.urls = this.config.getUrls();

    return this.config;
  }

  /**
   * Retorna configuração atual
   */
  getConfig() {
    return this.config;
  }
}

module.exports = new ESP32Service();

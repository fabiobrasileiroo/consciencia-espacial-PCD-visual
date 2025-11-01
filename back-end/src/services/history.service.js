/**
 * Serviço de Gerenciamento de Histórico
 */

const serverConfig = require('../config/server.config');

class HistoryService {
  constructor() {
    this.detections = [];
    this.lastDetections = [];
    this.maxSize = serverConfig.maxHistory;
    this.frameCount = 0;
  }

  /**
   * Adiciona detecção ao histórico
   */
  addDetection(detection) {
    this.frameCount++;

    const entry = {
      id: Date.now(),
      frameNumber: this.frameCount,
      timestamp: new Date().toISOString(),
      ...detection
    };

    this.detections.push(entry);

    // Limitar tamanho
    if (this.detections.length > this.maxSize) {
      this.detections.shift();
    }

    this.lastDetections = detection.objects || [];

    return entry;
  }

  /**
   * Retorna histórico
   */
  getHistory(limit) {
    const l = limit || this.maxSize;
    return this.detections.slice(-l);
  }

  /**
   * Retorna última detecção
   */
  getLastDetection() {
    return this.detections[this.detections.length - 1] || null;
  }

  /**
   * Retorna últimos objetos detectados
   */
  getLastDetections() {
    return this.lastDetections;
  }

  /**
   * Limpa histórico
   */
  clear() {
    const count = this.detections.length;
    this.detections = [];
    this.lastDetections = [];
    return count;
  }

  /**
   * Retorna estatísticas
   */
  getStats() {
    return {
      total: this.detections.length,
      frameCount: this.frameCount,
      lastDetection: this.getLastDetection(),
      currentObjects: this.lastDetections.length
    };
  }
}

module.exports = new HistoryService();

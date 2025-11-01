/**
 * Controlador de Status
 */

const historyService = require('../services/history.service');
const esp32Config = require('../config/esp32.config');
const serverConfig = require('../config/server.config');

class StatusController {
  /**
   * Status do sistema
   */
  getStatus(req, res) {
    try {
      const stats = historyService.getStats();

      res.json({
        success: true,
        status: 'running',
        server: {
          name: serverConfig.name,
          version: serverConfig.version,
          port: serverConfig.port,
          wsPort: serverConfig.wsPort
        },
        esp32: {
          ip: esp32Config.ip,
          connected: true // TODO: verificar conexão real
        },
        detections: {
          total: stats.total,
          current: stats.currentObjects
        },
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter status',
        error: error.message
      });
    }
  }

  /**
   * Health check
   */
  healthCheck(req, res) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }

  /**
   * Página inicial
   */
  index(req, res) {
    res.json({
      name: serverConfig.name,
      version: serverConfig.version,
      status: 'running',
      endpoints: {
        documentation: '/api/docs',
        viewer: '/viewer',
        health: '/health',
        status: '/api/status',
        esp32: {
          test: '/api/esp32/test',
          capture: '/api/esp32/capture',
          captureImage: '/api/esp32/capture-image',
          config: '/api/esp32/config'
        },
        history: '/api/history'
      }
    });
  }
}

module.exports = new StatusController();

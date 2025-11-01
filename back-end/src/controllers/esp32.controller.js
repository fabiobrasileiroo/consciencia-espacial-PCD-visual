/**
 * Controlador ESP32
 */

const esp32Service = require('../services/esp32.service');
const visionService = require('../services/vision.service');
const historyService = require('../services/history.service');
const esp32Config = require('../config/esp32.config');

class ESP32Controller {
  /**
   * Testa conexão com ESP32
   */
  async testConnection(req, res) {
    try {
      const result = await esp32Service.testConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao testar conexão com ESP32',
        error: error.message
      });
    }
  }

  /**
   * Captura imagem e processa detecções
   */
  async capture(req, res) {
    try {
      const imageBuffer = await esp32Service.captureFrame();

      // Se ESP32 enviar detecções, usar. Senão, mock
      let detections = req.body?.detections || visionService.mockDetection();

      // Desenhar bounding boxes
      const processedBuffer = await visionService.drawBoundingBoxes(
        imageBuffer,
        detections
      );

      const result = {
        timestamp: new Date().toISOString(),
        objects: detections,
        objectCount: detections.length,
        description: visionService.generateDescription(detections)
      };

      // Adicionar ao histórico
      historyService.addDetection(result);

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao capturar e processar imagem',
        error: error.message
      });
    }
  }

  /**
   * Captura imagem com bounding boxes
   */
  async captureImage(req, res) {
    try {
      const imageBuffer = await esp32Service.captureFrame();

      // Usar detecções do request ou mock
      const detections = req.body?.detections || visionService.mockDetection();

      // Desenhar bounding boxes
      const processedBuffer = await visionService.drawBoundingBoxes(
        imageBuffer,
        detections
      );

      // Adicionar ao histórico
      historyService.addDetection({
        timestamp: new Date().toISOString(),
        objects: detections,
        objectCount: detections.length
      });

      res.set('Content-Type', 'image/jpeg');
      res.send(processedBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao capturar imagem',
        error: error.message
      });
    }
  }

  /**
   * Atualiza configuração do ESP32
   */
  async updateConfig(req, res) {
    try {
      const updates = req.body;

      // Validar configurações
      if (updates.captureInterval &&
        (updates.captureInterval < 100 || updates.captureInterval > 60000)) {
        return res.status(400).json({
          success: false,
          message: 'Intervalo de captura deve estar entre 100ms e 60000ms'
        });
      }

      if (updates.confidenceThreshold &&
        (updates.confidenceThreshold < 0 || updates.confidenceThreshold > 1)) {
        return res.status(400).json({
          success: false,
          message: 'Limiar de confiança deve estar entre 0 e 1'
        });
      }

      const result = await esp32Service.updateConfig(updates);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configuração',
        error: error.message
      });
    }
  }

  /**
   * Retorna configuração atual
   */
  getConfig(req, res) {
    res.json({
      success: true,
      config: {
        ip: esp32Config.ip,
        captureInterval: esp32Config.captureInterval,
        confidenceThreshold: esp32Config.confidenceThreshold,
        frameWidth: esp32Config.frameWidth,
        frameHeight: esp32Config.frameHeight
      }
    });
  }
}

module.exports = new ESP32Controller();

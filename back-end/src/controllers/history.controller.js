/**
 * Controlador de Histórico
 */

const historyService = require('../services/history.service');

class HistoryController {
  /**
   * Retorna histórico de detecções
   */
  getHistory(req, res) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      const history = historyService.getHistory(limit);

      res.json({
        success: true,
        count: history.length,
        history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter histórico',
        error: error.message
      });
    }
  }

  /**
   * Limpa histórico
   */
  clearHistory(req, res) {
    try {
      const count = historyService.clear();

      res.json({
        success: true,
        message: `Histórico limpo. ${count} entradas removidas.`,
        cleared: count
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao limpar histórico',
        error: error.message
      });
    }
  }

  /**
   * Retorna última detecção
   */
  getLastDetection(req, res) {
    try {
      const detection = historyService.getLastDetection();

      if (!detection) {
        return res.status(404).json({
          success: false,
          message: 'Nenhuma detecção encontrada'
        });
      }

      res.json({
        success: true,
        detection
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter última detecção',
        error: error.message
      });
    }
  }

  /**
   * Retorna estatísticas
   */
  getStats(req, res) {
    try {
      const stats = historyService.getStats();

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: error.message
      });
    }
  }
}

module.exports = new HistoryController();

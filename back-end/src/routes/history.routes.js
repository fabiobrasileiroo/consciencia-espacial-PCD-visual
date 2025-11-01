/**
 * Rotas de Histórico
 */

const express = require('express');
const router = express.Router();
const historyController = require('../controllers/history.controller');

/**
 * @swagger
 * /api/history:
 *   get:
 *     summary: Retorna histórico de detecções
 *     tags: [Histórico]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de entradas
 *     responses:
 *       200:
 *         description: Histórico de detecções
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       frameNumber:
 *                         type: number
 *                       timestamp:
 *                         type: string
 *                       objects:
 *                         type: array
 *                       objectCount:
 *                         type: number
 *       500:
 *         description: Erro ao obter histórico
 *   delete:
 *     summary: Limpa histórico de detecções
 *     tags: [Histórico]
 *     responses:
 *       200:
 *         description: Histórico limpo com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 cleared:
 *                   type: number
 *       500:
 *         description: Erro ao limpar histórico
 */
router.get('/', historyController.getHistory);
router.delete('/', historyController.clearHistory);

/**
 * @swagger
 * /api/history/last:
 *   get:
 *     summary: Retorna última detecção
 *     tags: [Histórico]
 *     responses:
 *       200:
 *         description: Última detecção
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 detection:
 *                   type: object
 *       404:
 *         description: Nenhuma detecção encontrada
 *       500:
 *         description: Erro ao obter detecção
 */
router.get('/last', historyController.getLastDetection);

/**
 * @swagger
 * /api/history/stats:
 *   get:
 *     summary: Retorna estatísticas do histórico
 *     tags: [Histórico]
 *     responses:
 *       200:
 *         description: Estatísticas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     frameCount:
 *                       type: number
 *                     lastDetection:
 *                       type: object
 *                     currentObjects:
 *                       type: number
 *       500:
 *         description: Erro ao obter estatísticas
 */
router.get('/stats', historyController.getStats);

module.exports = router;

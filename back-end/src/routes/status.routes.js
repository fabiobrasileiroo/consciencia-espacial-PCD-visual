/**
 * Rotas de Status
 */

const express = require('express');
const router = express.Router();
const statusController = require('../controllers/status.controller');

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Retorna status completo do sistema
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Status do sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 server:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     version:
 *                       type: string
 *                     port:
 *                       type: number
 *                     wsPort:
 *                       type: number
 *                 esp32:
 *                   type: object
 *                   properties:
 *                     ip:
 *                       type: string
 *                     connected:
 *                       type: boolean
 *                 detections:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     current:
 *                       type: number
 *                 uptime:
 *                   type: number
 *       500:
 *         description: Erro ao obter status
 */
router.get('/', statusController.getStatus);

module.exports = router;

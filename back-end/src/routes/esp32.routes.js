/**
 * Rotas ESP32
 */

const express = require('express');
const router = express.Router();
const esp32Controller = require('../controllers/esp32.controller');

/**
 * @swagger
 * /api/esp32/test:
 *   get:
 *     summary: Testa conexão com ESP32-CAM
 *     tags: [ESP32]
 *     responses:
 *       200:
 *         description: Status da conexão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 esp32:
 *                   type: object
 *                   properties:
 *                     ip:
 *                       type: string
 *                     status:
 *                       type: string
 *       500:
 *         description: Erro ao testar conexão
 */
router.get('/test', esp32Controller.testConnection);

/**
 * @swagger
 * /api/esp32/capture:
 *   post:
 *     summary: Captura imagem e detecta objetos
 *     tags: [ESP32]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               detections:
 *                 type: array
 *                 description: Detecções do ESP32 (opcional, usará mock se não fornecido)
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Detecções encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   type: string
 *                 objects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       class:
 *                         type: string
 *                       score:
 *                         type: number
 *                       bbox:
 *                         type: array
 *                         items:
 *                           type: number
 *                 objectCount:
 *                   type: number
 *                 description:
 *                   type: string
 *       500:
 *         description: Erro ao processar imagem
 */
router.post('/capture', esp32Controller.capture);

/**
 * @swagger
 * /api/esp32/capture-image:
 *   post:
 *     summary: Captura imagem com bounding boxes desenhados
 *     tags: [ESP32]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               detections:
 *                 type: array
 *                 description: Detecções do ESP32 (opcional)
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Imagem JPEG com bounding boxes
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Erro ao capturar imagem
 */
router.post('/capture-image', esp32Controller.captureImage);

/**
 * @swagger
 * /api/esp32/config:
 *   get:
 *     summary: Retorna configuração atual do ESP32
 *     tags: [ESP32]
 *     responses:
 *       200:
 *         description: Configuração atual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 config:
 *                   type: object
 *   put:
 *     summary: Atualiza configuração do ESP32
 *     tags: [ESP32]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               captureInterval:
 *                 type: number
 *                 description: Intervalo de captura em ms (100-60000)
 *               confidenceThreshold:
 *                 type: number
 *                 description: Limiar de confiança (0-1)
 *     responses:
 *       200:
 *         description: Configuração atualizada
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro ao atualizar
 */
router.get('/config', esp32Controller.getConfig);
router.put('/config', esp32Controller.updateConfig);

module.exports = router;

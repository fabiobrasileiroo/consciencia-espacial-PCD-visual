/**
 * Agregador de Rotas
 */

const express = require('express');
const router = express.Router();

const esp32Routes = require('./esp32.routes');
const historyRoutes = require('./history.routes');
const statusRoutes = require('./status.routes');

// Montar rotas
router.use('/esp32', esp32Routes);
router.use('/history', historyRoutes);
router.use('/status', statusRoutes);

module.exports = router;

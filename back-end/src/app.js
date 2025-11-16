const express = require('express');
const cors = require('cors');
const { join } = require('path');
const { WebSocketExpress, Router } = require('websocket-express');

const { registerWebsocketRoutes } = require('./websocket/routes');
const { registerHttpRoutes } = require('./http/routes');
const { registerSwagger } = require('./swagger/swaggerConfig');
const { systemState } = require('./state/systemState');
const { SHUTDOWN_TIMEOUT } = require('./config/constants');

function createVisionServer() {
  const app = new WebSocketExpress();
  const router = new Router();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/static', express.static(join(__dirname, '..', 'public')));

  registerSwagger(app);
  registerHttpRoutes(router, systemState);
  registerWebsocketRoutes(router, systemState);

  app.use(router);
  app.set('shutdown timeout', SHUTDOWN_TIMEOUT);

  const server = app.createServer();

  return { app, server, state: systemState };
}

module.exports = { createVisionServer };

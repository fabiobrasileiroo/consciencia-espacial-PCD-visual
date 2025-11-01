/**
 * Configurações do Servidor
 */

module.exports = {
  // Porta HTTP
  port: parseInt(process.env.PORT || '3000'),

  // Porta WebSocket
  wsPort: parseInt(process.env.WS_PORT || '8080'),

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Tamanho máximo do histórico
  maxHistory: parseInt(process.env.MAX_HISTORY || '100'),

  // Nome da aplicação
  appName: 'Vision API - ESP32-CAM',

  // Versão
  version: '2.1.0'
};

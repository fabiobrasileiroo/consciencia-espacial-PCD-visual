const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { PORT } = require('../config/constants');

const detectionProperties = {
  description: { type: 'string', description: 'Descrição em português' },
  description_kz: { type: 'string', description: 'Descrição em cazaque' },
  objects: { type: 'array', items: { type: 'string' } },
  confidence: { type: 'number', minimum: 0, maximum: 1 },
  timestamp: { type: 'integer', format: 'int64' },
  receivedAt: { type: 'integer', format: 'int64' }
};

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Vision API - Sistema ESP32 sem COCO-SSD',
    version: '4.0.0',
    description: 'API HTTP/SSE/WS para distribuir descrições geradas pelo ESP32-CAM e dados do ecossistema ESP32.'
  },
  servers: [
    { url: `http://localhost:${PORT}`, description: 'Servidor local' }
  ],
  tags: [
    { name: 'Status', description: 'Monitoração do sistema' },
    { name: 'Detecções', description: 'Histórico e detecção atual' },
    { name: 'ESP32', description: 'Integração com módulos ESP32' }
  ],
  components: {
    schemas: {
      Detection: {
        type: 'object',
        properties: detectionProperties
      },
      DetectionHistoryResponse: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          returned: { type: 'integer' },
          detections: {
            type: 'array',
            items: { $ref: '#/components/schemas/Detection' }
          }
        }
      },
      CurrentDetectionResponse: {
        oneOf: [
          {
            type: 'object',
            properties: {
              detecting: { type: 'boolean', const: false },
              description: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          },
          {
            type: 'object',
            properties: {
              detecting: { type: 'boolean', const: true },
              count: { type: 'integer' },
              description: { type: 'string' },
              description_kz: { type: 'string' },
              objects: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
              secondsAgo: { type: 'integer' }
            }
          }
        ]
      },
      SensorUpdate: {
        type: 'object',
        properties: {
          distance: { type: 'number' },
          vibrationLevel: { type: 'number' },
          alertLevel: { type: 'string', enum: ['ok', 'warning', 'danger'] },
          alertMsg: { type: 'string' },
          rssi: { type: 'number' }
        }
      },
      SystemAlert: {
        type: 'object',
        properties: {
          level: { type: 'string', enum: ['info', 'warning', 'danger'] },
          message: { type: 'string' },
          timestamp: { type: 'integer', format: 'int64' }
        }
      },
      SystemStatus: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          uptime: { type: 'number' },
          serverStartTime: { type: 'integer', format: 'int64' },
          esp32Status: {
            type: 'object',
            properties: {
              pai: { type: 'object' },
              sensor: { type: 'object' },
              motor: { type: 'object' },
              camera: { type: 'object' }
            }
          },
          totalDetections: { type: 'integer' },
          connectedClients: {
            type: 'object',
            properties: {
              app: { type: 'integer' },
              esp32Pai: { type: 'integer' },
              esp32Cam: { type: 'integer' }
            }
          },
          sseClients: { type: 'integer' },
          lastDetection: { $ref: '#/components/schemas/Detection' },
          currentObjects: { type: 'integer' },
          version: { type: 'string' },
          mode: { type: 'string' }
        }
      },
      CommandRequest: {
        type: 'object',
        properties: {
          command: { type: 'string', enum: ['test_motor', 'get_status', 'calibrate_sensor', 'reboot', 'set_vibration'] },
          value: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'object' }] }
        },
        required: ['command']
      },
      CommandResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          command: { $ref: '#/components/schemas/CommandRequest' }
        }
      },
      SendDescriptionRequest: {
        type: 'object',
        properties: {
          description_pt: { type: 'string' },
          description_kz: { type: 'string' },
          objects: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number', minimum: 0, maximum: 1 }
        },
        required: ['description_pt']
      }
    }
  },
  paths: {
    '/api/status': {
      get: {
        tags: ['Status'],
        summary: 'Recupera o status completo do sistema',
        responses: {
          200: {
            description: 'Status atual',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SystemStatus' }
              }
            }
          }
        }
      }
    },
    '/api/detections/current': {
      get: {
        tags: ['Detecções'],
        summary: 'Obtém a última detecção registrada',
        responses: {
          200: {
            description: 'Detecção atual ou mensagem de ausência',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CurrentDetectionResponse' }
              }
            }
          }
        }
      }
    },
    '/api/detections/history': {
      get: {
        tags: ['Detecções'],
        summary: 'Lista detecções anteriores',
        parameters: [
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 200 },
            description: 'Quantidade máxima de registros (default 20)'
          }
        ],
        responses: {
          200: {
            description: 'Histórico de detecções',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DetectionHistoryResponse' }
              }
            }
          }
        }
      }
    },
    '/api/stream/events': {
      get: {
        tags: ['Status'],
        summary: 'Stream SSE com atualizações em tempo real',
        responses: {
          200: {
            description: 'Fluxo SSE contendo eventos detection, sensor-update, alert, etc.',
            content: {
              'text/event-stream': {
                schema: { type: 'string' }
              }
            }
          }
        }
      }
    },
    '/api/esp32/command': {
      post: {
        tags: ['ESP32'],
        summary: 'Envia comandos para o ESP32-PAI',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CommandRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Comando aceito',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CommandResponse' }
              }
            }
          },
          400: { description: 'Payload inválido' },
          503: { description: 'ESP32 não conectado' }
        }
      }
    },
    '/api/esp32-cam/send-description': {
      post: {
        tags: ['ESP32'],
        summary: 'Injeta manualmente uma descrição no fluxo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SendDescriptionRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Detecção registrada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    receivedAt: { type: 'integer', format: 'int64' }
                  }
                }
              }
            }
          },
          400: { description: 'Payload inválido' }
        }
      }
    }
  }
};

const swaggerSpec = swaggerJsdoc({ definition: swaggerDefinition, apis: [] });

function registerSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

module.exports = { registerSwagger };

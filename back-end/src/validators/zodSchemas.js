const { z } = require('zod');

const detectionMessageSchema = z.object({
  type: z.literal('detection'),
  description_pt: z.string().min(1, 'Descrição em português é obrigatória'),
  description_kz: z.string().optional(),
  objects: z.array(z.string()).optional().default([]),
  confidence: z.number().min(0).max(1).optional(),
  timestamp: z.number().optional()
});

const identifySchema = z.object({
  type: z.literal('identify'),
  deviceId: z.string().min(1)
});

const heartbeatSchema = z.object({
  type: z.literal('heartbeat')
});

const sensorUpdateSchema = z.object({
  type: z.literal('sensor_update'),
  distance: z.number().nonnegative(),
  vibrationLevel: z.number().nonnegative(),
  alertLevel: z.enum(['ok', 'warning', 'danger']),
  alertMsg: z.string(),
  moduleId: z.string().optional(),
  rssi: z.number().optional(),
  timestamp: z.number().optional()
});

const statusSchema = z.object({
  type: z.literal('status'),
  module: z.enum(['sensor', 'motor', 'camera']),
  distance: z.number().optional(),
  rssi: z.number().optional(),
  vibrationLevel: z.number().optional(),
  frameCount: z.number().optional()
});

const alertSchema = z.object({
  type: z.literal('alert'),
  level: z.enum(['info', 'warning', 'danger']),
  msg: z.string(),
  distance: z.number().optional()
});

const esp32PaiMessageSchema = z.discriminatedUnion('type', [
  identifySchema,
  sensorUpdateSchema,
  statusSchema,
  alertSchema,
  heartbeatSchema
]);

const esp32CamMessageSchema = z.discriminatedUnion('type', [
  identifySchema,
  detectionMessageSchema,
  heartbeatSchema
]);

const commandRequestSchema = z.object({
  command: z.enum(['test_motor', 'get_status', 'calibrate_sensor', 'reboot', 'set_vibration']),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.any())]).optional()
});

const sendDescriptionSchema = z.object({
  description_pt: z.string().min(1),
  description_kz: z.string().optional(),
  objects: z.array(z.string()).optional().default([]),
  confidence: z.number().min(0).max(1).optional()
});

const detectionsHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional()
});

module.exports = {
  detectionMessageSchema,
  identifySchema,
  heartbeatSchema,
  sensorUpdateSchema,
  statusSchema,
  alertSchema,
  esp32PaiMessageSchema,
  esp32CamMessageSchema,
  commandRequestSchema,
  sendDescriptionSchema,
  detectionsHistoryQuerySchema
};

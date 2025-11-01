import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('api/health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check do servidor',
    description: 'Verifica se o servidor está operacional',
  })
  @ApiResponse({
    status: 200,
    description: 'Servidor operacional',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-10-29T15:30:00.000Z',
        uptime: 3600,
        memory: {
          used: 45678901,
          total: 536870912,
          percentage: '8.51%',
        },
      },
    },
  })
  check() {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const percentage = ((usedMemory / totalMemory) * 100).toFixed(2);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: `${percentage}%`,
      },
      nodeVersion: process.version,
      platform: process.platform,
    };
  }
}

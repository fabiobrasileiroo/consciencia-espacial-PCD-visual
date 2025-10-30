import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Sse,
  MessageEvent,
  Logger,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Observable, interval, map, merge } from 'rxjs';
import { VisionService } from './vision.service';
import { VisionDetectionDto } from './dto/vision-detection.dto';
import { VisionResponseDto } from './dto/vision-response.dto';

@ApiTags('vision')
@Controller('api/vision')
export class VisionController {
  private readonly logger = new Logger(VisionController.name);

  constructor(private readonly visionService: VisionService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recebe detecção do ESP32-CAM',
    description:
      '## 📡 Endpoint Principal de Detecção\n\n' +
      'Este endpoint recebe dados de objetos detectados pelo ESP32-CAM e os processa em tempo real.\n\n' +
      '### 📥 Campos do Body (JSON):\n\n' +
      '**moduleId** (string, obrigatório)\n' +
      '- Identificador único do ESP32 que envia os dados\n' +
      '- Use IDs consistentes para cada dispositivo físico\n' +
      '- Exemplos: "module-2", "cam-01", "esp32-sala"\n\n' +
      '**objects** (array, obrigatório)\n' +
      '- Lista de objetos detectados neste frame\n' +
      '- Cada objeto contém:\n' +
      '  - **name**: Nome em português (ex: "pessoa", "cadeira")\n' +
      '  - **confidence**: Confiança 0-100 (ex: 95 = 95% de certeza)\n' +
      '  - **description**: Texto descritivo opcional para áudio/voz\n' +
      '- Array vazio [] é válido quando nada foi detectado\n\n' +
      '**timestamp** (string ISO 8601, opcional)\n' +
      '- Data/hora da detecção no formato "2025-10-29T15:30:00.000Z"\n' +
      '- Se omitido, usa horário do servidor\n\n' +
      '**metrics** (object, opcional mas recomendado)\n' +
      '- Métricas de performance para monitoramento:\n' +
      '  - **captureTime**: Tempo (ms) para capturar imagem\n' +
      '  - **detectionTime**: Tempo (ms) para detectar objetos\n' +
      '  - **sendTime**: Tempo (ms) para enviar ao servidor\n' +
      '  - **totalTime**: Tempo total do ciclo (ms)\n' +
      '  - **freeHeap**: RAM livre no ESP32 (bytes)\n' +
      '  - **rssi**: Força WiFi em dBm (-67 é bom, -90 é fraco)\n' +
      '  - **fps**: Frames por segundo\n\n' +
      '### ✅ Resposta de Sucesso (200):\n' +
      'Retorna confirmação com ID da detecção e estatísticas.\n\n' +
      '### ❌ Erro de Validação (400):\n' +
      'Retornado quando dados estão inválidos ou campos obrigatórios faltando.',
  })
  @ApiBody({
    type: VisionDetectionDto,
    description:
      'Payload JSON contendo dados da detecção. ' +
      'Veja a seção Schemas abaixo para detalhes de cada campo.',
    examples: {
      'Detecção Completa': {
        value: {
          moduleId: 'module-2',
          objects: [
            { name: 'pessoa', confidence: 95, description: 'Uma pessoa à frente' },
            { name: 'cadeira', confidence: 87, description: 'Cadeira ao lado direito' },
          ],
          timestamp: '2025-10-29T15:30:00.000Z',
          metrics: {
            captureTime: 245,
            detectionTime: 1823,
            sendTime: 156,
            totalTime: 2224,
            freeHeap: 89456,
            rssi: -67,
            fps: 0.45,
          },
        },
      },
      'Detecção Simples': {
        value: {
          moduleId: 'cam-01',
          objects: [
            { name: 'pessoa', confidence: 92 },
          ],
        },
      },
      'Nenhum Objeto': {
        value: {
          moduleId: 'module-2',
          objects: [],
          metrics: {
            freeHeap: 89456,
            rssi: -67,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      '✅ Detecção processada com sucesso. ' +
      'Dados foram salvos no histórico e transmitidos via SSE para subscribers.',
    type: VisionResponseDto,
    schema: {
      example: {
        status: 'success',
        message: 'Detecção recebida e processada com sucesso',
        timestamp: '2025-10-29T15:30:00.000Z',
        data: {
          detectionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          objectsDetected: 2,
          moduleId: 'module-2',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      '❌ Dados inválidos. Possíveis causas:\n' +
      '- Campo obrigatório faltando (moduleId ou objects)\n' +
      '- Tipo de dado incorreto (ex: confidence não é número)\n' +
      '- Valor fora do range (ex: confidence > 100)\n' +
      '- Formato de timestamp inválido',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'moduleId should not be empty',
          'objects must be an array',
          'confidence must not be greater than 100',
        ],
        error: 'Bad Request',
      },
    },
  })
  async receiveDetection(
    @Body() detectionDto: VisionDetectionDto,
  ): Promise<VisionResponseDto> {
    this.logger.debug(
      `Detecção recebida do módulo ${detectionDto.moduleId}`,
    );

    const detection = await this.visionService.processDetection(detectionDto);

    return {
      status: 'success',
      message: 'Detecção recebida e processada com sucesso',
      timestamp: new Date().toISOString(),
      data: {
        detectionId: detection.id,
        objectsDetected: detection.objects.length,
        moduleId: detection.moduleId,
      },
    };
  }

  @Get('stream')
  @Sse()
  @ApiOperation({
    summary: 'Stream de detecções em tempo real (SSE)',
    description:
      'Retorna um stream Server-Sent Events com todas as detecções em tempo real. ' +
      'Ideal para dashboards e monitoramento ao vivo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stream de eventos de detecção',
  })
  streamDetections(): Observable<MessageEvent> {
    this.logger.log('Cliente conectado ao stream SSE');

    // Stream de detecções
    const detectionStream = this.visionService.getDetectionStream().pipe(
      map((detection) => ({
        type: 'detection',
        data: detection,
      })),
    );

    // Keepalive ping a cada 30 segundos
    const keepaliveInterval = parseInt(
      process.env.ESP32_STREAM_KEEPALIVE_INTERVAL || '30000',
      10,
    );
    const keepaliveStream = interval(keepaliveInterval).pipe(
      map(() => ({
        type: 'keepalive',
        data: { timestamp: new Date().toISOString() },
      })),
    );

    // Merge dos streams
    return merge(detectionStream, keepaliveStream);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Retorna histórico de detecções',
    description: 'Retorna as últimas N detecções processadas.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de detecções a retornar',
    example: 50,
  })
  @ApiQuery({
    name: 'moduleId',
    required: false,
    type: String,
    description: 'Filtrar por módulo específico',
    example: 'module-2',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de detecções',
  })
  getHistory(
    @Query('limit') limit?: number,
    @Query('moduleId') moduleId?: string,
  ) {
    if (moduleId) {
      return {
        status: 'success',
        data: this.visionService.getDetectionsByModule(moduleId, limit),
        count: this.visionService.getDetectionsByModule(moduleId, limit).length,
      };
    }

    const history = this.visionService.getDetectionsHistory(limit);
    return {
      status: 'success',
      data: history,
      count: history.length,
    };
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Retorna estatísticas do sistema',
    description:
      'Retorna estatísticas gerais como total de detecções, módulos ativos, ' +
      'médias de FPS, objetos detectados, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do sistema',
  })
  getStatistics() {
    return {
      status: 'success',
      data: this.visionService.getStatistics(),
    };
  }

  @Get('connection-status')
  @ApiOperation({
    summary: 'Status de conexão dos ESP32',
    description:
      'Verifica se há módulos ESP32 conectados (que enviaram detecção nos últimos 30 segundos)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de conexão',
  })
  getConnectionStatus() {
    return {
      status: 'success',
      data: this.visionService.getConnectionStatus(),
    };
  }

  @Delete('history')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Limpa o histórico de detecções',
    description: 'Remove todas as detecções armazenadas no histórico.',
  })
  @ApiResponse({
    status: 204,
    description: 'Histórico limpo com sucesso',
  })
  clearHistory() {
    this.visionService.clearHistory();
  }
}

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { VisionService } from './vision.service';
import { VisionDetectionDto } from './dto/vision-detection.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/vision',
})
export class VisionGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VisionGateway.name);
  private esp32Clients = new Map<string, Socket>();

  constructor(private readonly visionService: VisionService) { }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);

    // Enviar status de conexão
    client.emit('connected', {
      message: 'Conectado ao servidor Vision API',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);

    // Remover dos ESP32 se for um
    for (const [moduleId, socket] of this.esp32Clients.entries()) {
      if (socket.id === client.id) {
        this.esp32Clients.delete(moduleId);
        this.logger.log(`ESP32 ${moduleId} desconectado`);
        break;
      }
    }
  }

  /**
   * ESP32 registra seu moduleId ao conectar
   */
  @SubscribeMessage('register_esp32')
  handleRegisterESP32(
    @MessageBody() data: { moduleId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { moduleId } = data;
    this.esp32Clients.set(moduleId, client);

    this.logger.log(`✅ ESP32 ${moduleId} registrado`);

    client.emit('registered', {
      moduleId,
      message: 'ESP32 registrado com sucesso',
      timestamp: new Date().toISOString(),
    });

    // Notificar todos os clientes que um ESP32 conectou
    this.server.emit('esp32_connected', {
      moduleId,
      totalESP32: this.esp32Clients.size,
    });

    return { success: true, moduleId };
  }

  /**
   * Recebe detecção do ESP32 via WebSocket
   */
  @SubscribeMessage('detection')
  async handleDetection(
    @MessageBody() detectionDto: VisionDetectionDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Processar detecção
      const detection = await this.visionService.processDetection(detectionDto);

      this.logger.debug(
        `📡 Detecção via WebSocket - Módulo: ${detectionDto.moduleId}, Objetos: ${detectionDto.objects.length}`,
      );

      // Confirmar recebimento para o ESP32
      client.emit('detection_ack', {
        detectionId: detection.id,
        success: true,
        timestamp: new Date().toISOString(),
      });

      // Broadcast para todos os clientes (apps mobile, dashboards)
      this.server.emit('new_detection', detection);

      return {
        success: true,
        detectionId: detection.id,
        objectsDetected: detection.objects.length,
      };
    } catch (error) {
      this.logger.error(`Erro ao processar detecção: ${error.message}`);

      client.emit('detection_error', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Servidor envia comando para ESP32 específico
   */
  sendCommandToESP32(moduleId: string, command: string, data?: any) {
    const client = this.esp32Clients.get(moduleId);

    if (!client) {
      this.logger.warn(`ESP32 ${moduleId} não está conectado`);
      return false;
    }

    client.emit('command', {
      command,
      data,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`📤 Comando enviado para ESP32 ${moduleId}: ${command}`);
    return true;
  }

  /**
   * Broadcast de comando para todos ESP32
   */
  broadcastCommandToAllESP32(command: string, data?: any) {
    let sent = 0;

    this.esp32Clients.forEach((client, moduleId) => {
      client.emit('command', {
        command,
        data,
        timestamp: new Date().toISOString(),
      });
      sent++;
    });

    this.logger.log(`📤 Comando broadcast para ${sent} ESP32: ${command}`);
    return sent;
  }

  /**
   * Retorna ESP32 conectados
   */
  getConnectedESP32() {
    return Array.from(this.esp32Clients.keys());
  }

  /**
   * Envia estatísticas para clientes
   */
  @SubscribeMessage('get_statistics')
  handleGetStatistics() {
    const stats = this.visionService.getStatistics();
    return {
      ...stats,
      connectedESP32: this.esp32Clients.size,
      esp32Modules: this.getConnectedESP32(),
    };
  }

  /**
   * Cliente solicita histórico
   */
  @SubscribeMessage('get_history')
  handleGetHistory(@MessageBody() data: { limit?: number }) {
    const history = this.visionService.getDetectionsHistory(data?.limit);
    return {
      total: history.length,
      detections: history,
    };
  }
}

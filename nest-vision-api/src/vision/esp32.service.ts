import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ESP32Config {
  ip: string;
  port: number;
  captureEndpoint: string;
  streamEndpoint: string;
  timeout: number;
}

@Injectable()
export class ESP32Service {
  private readonly logger = new Logger(ESP32Service.name);
  private readonly config: ESP32Config;

  constructor() {
    this.config = {
      ip: process.env.ESP32_CAM_IP || '192.168.100.56',
      port: parseInt(process.env.ESP32_CAM_PORT || '81'),
      captureEndpoint: '/capture',
      streamEndpoint: '/stream',
      timeout: 5000,
    };
  }

  /**
   * Retorna URL de captura
   */
  getCaptureUrl(): string {
    return `http://${this.config.ip}${this.config.captureEndpoint}`;
  }

  /**
   * Retorna URL de stream
   */
  getStreamUrl(): string {
    return `http://${this.config.ip}:${this.config.port}${this.config.streamEndpoint}`;
  }

  /**
   * Captura frame individual do ESP32-CAM
   */
  async captureFrame(): Promise<Buffer | null> {
    try {
      const url = this.getCaptureUrl();

      if (process.env.VISION_DEBUG === 'true') {
        this.logger.debug(`📡 Capturando frame de ${url}...`);
      }

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: this.config.timeout,
      });

      const buffer = Buffer.from(response.data);

      if (process.env.VISION_DEBUG === 'true') {
        this.logger.debug(`✅ Frame capturado: ${buffer.length} bytes`);
      }

      return buffer;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao capturar frame: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Testa conexão com ESP32-CAM
   */
  async testConnection(): Promise<boolean> {
    try {
      const frame = await this.captureFrame();
      return frame !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retorna informações de configuração
   */
  getConfig(): ESP32Config {
    return { ...this.config };
  }

  /**
   * Atualiza configuração do ESP32
   */
  updateConfig(config: Partial<ESP32Config>): void {
    if (config.ip) this.config.ip = config.ip;
    if (config.port) this.config.port = config.port;
    if (config.timeout) this.config.timeout = config.timeout;

    this.logger.log('⚙️ Configuração do ESP32 atualizada');
  }
}

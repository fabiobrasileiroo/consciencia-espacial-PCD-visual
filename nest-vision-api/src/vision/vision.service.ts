import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { VisionDetectionDto } from './dto/vision-detection.dto';
import { VisionDetection } from './entities/vision-detection.entity';
import { v4 as uuidv4 } from 'uuid';
import { TensorFlowService, ProcessedImage } from './tensorflow.service';
import { ESP32Service } from './esp32.service';

@Injectable()
export class VisionService implements OnModuleInit {
  private readonly logger = new Logger(VisionService.name);
  private readonly detectionSubject = new Subject<VisionDetection>();
  private readonly detectionsHistory: VisionDetection[] = [];
  private readonly maxHistorySize = parseInt(
    process.env.ESP32_MAX_DETECTIONS_HISTORY || '100',
    10,
  );
  private captureIntervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private frameCount = 0;
  private lastDetections: any[] = [];

  constructor(
    private readonly tensorFlowService: TensorFlowService,
    private readonly esp32Service: ESP32Service,
  ) {
    this.logger.log('Vision Service inicializado');
  }

  async onModuleInit() {
    this.logger.log('✅ Vision Service pronto (modo simplificado)');

    // Iniciar processamento automático se configurado
    const useAutoCapture = process.env.VISION_USE_STREAMING === 'false';
    if (useAutoCapture) {
      // Desabilitado por padrão - use a API para iniciar
      this.logger.log('⏸️  Captura automática desabilitada. Use POST /api/vision/esp32/auto-capture/start');
    }
  }

  /**
   * Processa uma nova detecção recebida do ESP32
   */
  async processDetection(
    detectionDto: VisionDetectionDto,
  ): Promise<VisionDetection> {
    const detection: VisionDetection = {
      id: uuidv4(),
      moduleId: detectionDto.moduleId,
      objects: detectionDto.objects,
      timestamp: detectionDto.timestamp
        ? new Date(detectionDto.timestamp)
        : new Date(),
      metrics: detectionDto.metrics,
    };

    // Adiciona ao histórico
    this.addToHistory(detection);

    // Emite evento para subscribers (SSE)
    this.detectionSubject.next(detection);

    // Log da detecção
    this.logger.log(
      `Nova detecção processada - Módulo: ${detection.moduleId}, ` +
      `Objetos: ${detection.objects.length}, ` +
      `FPS: ${detection.metrics?.fps?.toFixed(2) || 'N/A'}`,
    );

    return detection;
  }

  /**
   * Retorna um Observable para streaming de detecções (SSE)
   */
  getDetectionStream(): Observable<VisionDetection> {
    return this.detectionSubject.asObservable();
  }

  /**
   * Retorna o histórico de detecções
   */
  getDetectionsHistory(limit?: number): VisionDetection[] {
    const historyLimit = limit || this.maxHistorySize;
    return this.detectionsHistory.slice(-historyLimit);
  }

  /**
   * Retorna detecções de um módulo específico
   */
  getDetectionsByModule(moduleId: string, limit?: number): VisionDetection[] {
    const moduleDetections = this.detectionsHistory.filter(
      (d) => d.moduleId === moduleId,
    );
    const historyLimit = limit || this.maxHistorySize;
    return moduleDetections.slice(-historyLimit);
  }

  /**
   * Retorna estatísticas gerais
   */
  getStatistics() {
    const totalDetections = this.detectionsHistory.length;
    const modules = [...new Set(this.detectionsHistory.map((d) => d.moduleId))];
    const lastDetection =
      this.detectionsHistory[this.detectionsHistory.length - 1];

    let avgObjectsPerDetection = 0;
    let avgFps = 0;
    let avgFreeHeap = 0;

    if (totalDetections > 0) {
      avgObjectsPerDetection =
        this.detectionsHistory.reduce((sum, d) => sum + d.objects.length, 0) /
        totalDetections;

      const detectionsWithFps = this.detectionsHistory.filter(
        (d) => d.metrics?.fps,
      );
      if (detectionsWithFps.length > 0) {
        avgFps =
          detectionsWithFps.reduce((sum, d) => sum + (d.metrics?.fps || 0), 0) /
          detectionsWithFps.length;
      }

      const detectionsWithHeap = this.detectionsHistory.filter(
        (d) => d.metrics?.freeHeap,
      );
      if (detectionsWithHeap.length > 0) {
        avgFreeHeap =
          detectionsWithHeap.reduce(
            (sum, d) => sum + (d.metrics?.freeHeap || 0),
            0,
          ) / detectionsWithHeap.length;
      }
    }

    return {
      totalDetections,
      activeModules: modules.length,
      modules,
      lastDetection: lastDetection
        ? {
          timestamp: lastDetection.timestamp,
          moduleId: lastDetection.moduleId,
          objectsCount: lastDetection.objects.length,
        }
        : null,
      averages: {
        objectsPerDetection: parseFloat(avgObjectsPerDetection.toFixed(2)),
        fps: parseFloat(avgFps.toFixed(2)),
        freeHeap: Math.round(avgFreeHeap),
      },
    };
  }

  /**
   * Verifica se há ESP32 conectados (receberam detecção nos últimos 30 segundos)
   */
  getConnectionStatus() {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30000);

    const recentDetections = this.detectionsHistory.filter(
      (d) => d.timestamp >= thirtySecondsAgo,
    );

    const connectedModules = [...new Set(recentDetections.map((d) => d.moduleId))];

    return {
      isConnected: connectedModules.length > 0,
      connectedModules,
      totalConnected: connectedModules.length,
      lastActivity: this.detectionsHistory.length > 0
        ? this.detectionsHistory[this.detectionsHistory.length - 1].timestamp
        : null,
    };
  }  /**
   * Limpa o histórico de detecções
   */
  clearHistory(): void {
    this.detectionsHistory.length = 0;
    this.logger.log('Histórico de detecções limpo');
  }

  /**
   * Adiciona detecção ao histórico com limite de tamanho
   */
  private addToHistory(detection: VisionDetection): void {
    this.detectionsHistory.push(detection);

    // Mantém apenas as últimas N detecções
    if (this.detectionsHistory.length > this.maxHistorySize) {
      this.detectionsHistory.shift();
    }
  }

  /**
   * Captura e processa imagem do ESP32-CAM
   */
  async captureAndProcessImage(): Promise<ProcessedImage | null> {
    if (this.isProcessing) {
      this.logger.debug('⏭️  Pulando captura (processamento em andamento)');
      return null;
    }

    this.isProcessing = true;
    this.frameCount++;

    try {
      const frameBuffer = await this.esp32Service.captureFrame();
      if (!frameBuffer) {
        this.logger.warn('⚠️  Nenhum frame capturado');
        return null;
      }

      // Por enquanto, sem detecções automáticas
      // As detecções devem vir do ESP32 ou API externa
      const detections = []; // Vazio por padrão

      const processed = await this.tensorFlowService.processImage(
        frameBuffer,
        detections,
      );

      if (detections.length > 0) {
        const description = this.tensorFlowService.generateDescription(
          detections,
        );

        this.logger.log(`🎯 Frame #${this.frameCount}: ${description}`);

        detections.forEach((d) => {
          const label = this.tensorFlowService.translateToPortuguese(d.class);
          this.logger.log(`   📦 ${label}: ${(d.score * 100).toFixed(1)}%`);
        });

        // Emitir evento se houver mudanças
        const hasChanges =
          JSON.stringify(detections.map((d) => d.class)) !==
          JSON.stringify(this.lastDetections.map((d) => d.class));

        if (hasChanges) {
          this.lastDetections = detections;
          // Aqui você pode emitir via WebSocket se necessário
        }
      } else {
        this.logger.debug(
          `📸 Frame #${this.frameCount}: Capturado sem detecções`,
        );
      }

      return processed;
    } catch (error) {
      this.logger.error(`❌ Erro ao processar frame: ${error.message}`);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Inicia captura automática
   */
  startAutomaticCapture(): void {
    const interval = parseInt(
      process.env.VISION_CAPTURE_INTERVAL || '2000',
      10,
    );

    this.logger.log('📸 Iniciando processamento automático em modo CAPTURA...');
    this.logger.log(`📡 URL: ${this.esp32Service.getCaptureUrl()}`);
    this.logger.log(`⏱️  Intervalo de captura: ${interval}ms\n`);

    // Limpar intervalo anterior se existir
    if (this.captureIntervalId) {
      clearInterval(this.captureIntervalId);
    }

    // Primeira captura imediata
    this.captureAndProcessImage().catch((err) =>
      this.logger.error('Erro na captura inicial:', err),
    );

    // Configurar loop contínuo
    this.captureIntervalId = setInterval(async () => {
      try {
        await this.captureAndProcessImage();
      } catch (error) {
        this.logger.error('❌ Erro no loop de captura:', error.message);
      }
    }, interval);

    this.logger.log('✅ Loop de captura iniciado!\n');
  }

  /**
   * Para captura automática
   */
  stopAutomaticCapture(): void {
    if (this.captureIntervalId) {
      clearInterval(this.captureIntervalId);
      this.captureIntervalId = null;
      this.logger.log('⏹️  Loop de captura parado');
    }
  }

  /**
   * Verifica se está capturando automaticamente
   */
  isAutoCapturing(): boolean {
    return this.captureIntervalId !== null;
  }

  /**
   * Testa conexão com ESP32-CAM
   */
  async testESP32Connection(): Promise<boolean> {
    return await this.esp32Service.testConnection();
  }

  /**
   * Retorna configuração do ESP32
   */
  getESP32Config() {
    return this.esp32Service.getConfig();
  }
}


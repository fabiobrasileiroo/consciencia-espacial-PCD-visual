import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { VisionDetectionDto } from './dto/vision-detection.dto';
import { VisionDetection } from './entities/vision-detection.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private readonly detectionSubject = new Subject<VisionDetection>();
  private readonly detectionsHistory: VisionDetection[] = [];
  private readonly maxHistorySize = parseInt(
    process.env.ESP32_MAX_DETECTIONS_HISTORY || '100',
    10,
  );

  constructor() {
    this.logger.log('Vision Service inicializado');
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
}

import { Injectable, Logger } from '@nestjs/common';
import { createCanvas, loadImage } from 'canvas';

export interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  detections: Detection[];
}

/**
 * Serviço simplificado de visão
 * Não carrega TensorFlow - apenas desenha bounding boxes
 * As detecções vêm do ESP32-CAM ou API externa
 */
@Injectable()
export class TensorFlowService {
  private readonly logger = new Logger(TensorFlowService.name);

  // Traduções PT-BR
  private readonly translations: Record<string, string> = {
    person: 'pessoa',
    car: 'carro',
    bicycle: 'bicicleta',
    motorcycle: 'moto',
    dog: 'cachorro',
    cat: 'gato',
    chair: 'cadeira',
    couch: 'sofá',
    table: 'mesa',
    bottle: 'garrafa',
    cup: 'xícara',
    phone: 'telefone',
    'cell phone': 'celular',
    laptop: 'notebook',
    keyboard: 'teclado',
    mouse: 'mouse',
    book: 'livro',
    clock: 'relógio',
    door: 'porta',
    window: 'janela',
    bag: 'bolsa',
    backpack: 'mochila',
    umbrella: 'guarda-chuva',
    tv: 'televisão',
    bed: 'cama',
  };

  constructor() {
    this.logger.log('✅ Vision Service inicializado (modo simplificado - sem TensorFlow)');
  }

  /**
   * Verifica se o modelo está carregado (sempre true neste modo)
   */
  isModelLoaded(): boolean {
    return true;
  }

  /**
   * Desenha bounding boxes na imagem
   */
  async drawBoundingBoxes(
    imageBuffer: Buffer,
    detections: Detection[],
  ): Promise<Buffer> {
    try {
      const img = await loadImage(imageBuffer);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');

      // Desenhar imagem original
      ctx.drawImage(img, 0, 0);

      // Cores para bounding boxes
      const colors = [
        '#00FF00', // Verde
        '#FF0000', // Vermelho
        '#0000FF', // Azul
        '#FFFF00', // Amarelo
        '#FF00FF', // Magenta
        '#00FFFF', // Ciano
        '#FFA500', // Laranja
        '#800080', // Roxo
      ];

      // Desenhar cada detecção
      detections.forEach((detection, index) => {
        const [x, y, width, height] = detection.bbox;
        const label = this.translateToPortuguese(detection.class);
        const confidence = (detection.score * 100).toFixed(1);
        const text = `${label} ${confidence}%`;
        const color = colors[index % colors.length];

        // Desenhar retângulo (bounding box)
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Preparar texto do label
        ctx.font = 'bold 16px Arial';
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 20;

        // Desenhar fundo do label
        ctx.fillStyle = color;
        ctx.fillRect(x, y - textHeight - 4, textWidth + 10, textHeight + 4);

        // Desenhar texto do label
        ctx.fillStyle = '#000000';
        ctx.fillText(text, x + 5, y - 8);

        // Desenhar ponto central
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Adicionar informações no canto superior esquerdo
      if (detections.length > 0) {
        const info = `Objetos detectados: ${detections.length}`;
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, ctx.measureText(info).width + 20, 30);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(info, 20, 32);
      }

      // Converter canvas para buffer JPEG
      return canvas.toBuffer('image/jpeg', { quality: 0.95 });
    } catch (error) {
      this.logger.error('❌ Erro ao desenhar bounding boxes:', error);
      return imageBuffer; // Retornar imagem original em caso de erro
    }
  }

  /**
   * Processa imagem completa: desenha bounding boxes
   * (detecções devem vir de fora - ESP32 ou API externa)
   */
  async processImage(
    imageBuffer: Buffer,
    detections: Detection[],
  ): Promise<ProcessedImage> {
    const imageWithBoxes = await this.drawBoundingBoxes(
      imageBuffer,
      detections,
    );

    const img = await loadImage(imageBuffer);

    return {
      buffer: imageWithBoxes,
      width: img.width,
      height: img.height,
      detections,
    };
  }

  /**
   * Traduz classe para português
   */
  translateToPortuguese(className: string): string {
    return this.translations[className] || className;
  }

  /**
   * Gera descrição em português dos objetos detectados
   */
  generateDescription(detections: Detection[]): string {
    if (detections.length === 0) {
      return 'Nenhum objeto detectado';
    }

    const items = detections.map((d) => {
      const name = this.translateToPortuguese(d.class);
      const confidence = (d.score * 100).toFixed(0);
      return `${name} (${confidence}%)`;
    });

    if (items.length === 1) {
      return `Detectado: ${items[0]}`;
    }

    return `Detectados ${items.length} objetos: ${items.join(', ')}`;
  }
}

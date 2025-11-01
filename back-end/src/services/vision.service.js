/**
 * Serviço de Processamento de Imagens (Mock/API Externa)
 * 
 * NOTA: Este serviço NÃO usa TensorFlow localmente devido a problemas de compatibilidade.
 * Você pode:
 * 1. Receber detecções já processadas do ESP32
 * 2. Usar API externa (Google Cloud Vision, AWS Rekognition)
 * 3. Implementar modelo Edge Impulse no ESP32
 */

const { createCanvas, loadImage } = require('canvas');

// Traduções PT-BR
const translations = {
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
  bed: 'cama'
};

class VisionService {
  /**
   * Processa detecções recebidas (do ESP32 ou API externa)
   * @param {Array} detections - Array de objetos com { class, score, bbox }
   * @returns {Array}
   */
  processDetections(detections) {
    const minConfidence = require('../config/esp32.config').minConfidence;
    const maxDetections = require('../config/esp32.config').maxDetectionsPerFrame;

    return detections
      .filter(d => d.score >= minConfidence)
      .slice(0, maxDetections);
  }

  /**
   * Desenha bounding boxes na imagem
   */
  async drawBoundingBoxes(imageBuffer, detections) {
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
        '#800080'  // Roxo
      ];

      // Desenhar cada detecção
      detections.forEach((detection, index) => {
        const [x, y, width, height] = detection.bbox;
        const label = this.translateToPortuguese(detection.class);
        const confidence = (detection.score * 100).toFixed(1);
        const text = `${label} ${confidence}%`;
        const color = colors[index % colors.length];

        // Desenhar retângulo
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Fundo do label
        ctx.font = 'bold 16px Arial';
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 20;

        ctx.fillStyle = color;
        ctx.fillRect(x, y - textHeight - 4, textWidth + 10, textHeight + 4);

        // Texto do label
        ctx.fillStyle = '#000000';
        ctx.fillText(text, x + 5, y - 8);

        // Ponto central
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Contador de objetos
      if (detections.length > 0) {
        const info = `Objetos detectados: ${detections.length}`;
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, ctx.measureText(info).width + 20, 30);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(info, 20, 32);
      }

      return canvas.toBuffer('image/jpeg', { quality: 0.95 });
    } catch (error) {
      console.error('❌ Erro ao desenhar bounding boxes:', error);
      return imageBuffer;
    }
  }

  /**
   * Traduz classe para português
   */
  translateToPortuguese(className) {
    return translations[className] || className;
  }

  /**
   * Gera descrição em português
   */
  generateDescription(detections) {
    if (detections.length === 0) {
      return 'Nenhum objeto detectado';
    }

    const items = detections.map(d => {
      const name = this.translateToPortuguese(d.class);
      const confidence = (d.score * 100).toFixed(0);
      return `${name} (${confidence}%)`;
    });

    if (items.length === 1) {
      return `Detectado: ${items[0]}`;
    }

    return `Detectados ${items.length} objetos: ${items.join(', ')}`;
  }

  /**
   * Mock de detecção (para testes quando ESP32 não tem modelo)
   * Retorna detecções fictícias para demonstração
   */
  mockDetection() {
    return [
      {
        class: 'person',
        score: 0.95,
        bbox: [100, 150, 200, 400]
      }
    ];
  }
}

module.exports = new VisionService();

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, Min, Max, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class DetectedObjectDto {
  @ApiProperty({
    description:
      'Nome do objeto detectado em português. ' +
      'Exemplos comuns: "pessoa", "cadeira", "mesa", "porta", "carro", "cachorro", etc. ' +
      'Este campo identifica o tipo de objeto encontrado pela câmera.',
    example: 'pessoa',
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description:
      'Nível de confiança da detecção em porcentagem (0-100). ' +
      'Quanto maior o valor, mais certeza o sistema tem sobre a detecção. ' +
      'Valores acima de 80 geralmente indicam alta precisão. ' +
      'Exemplo: 95 significa 95% de confiança que o objeto foi identificado corretamente.',
    example: 95,
    minimum: 0,
    maximum: 100,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;

  @ApiProperty({
    description:
      'Descrição contextual e em linguagem natural do objeto detectado. ' +
      'Ideal para sistemas de áudio que convertem para voz (acessibilidade para PCD visual). ' +
      'Deve incluir localização relativa quando possível. ' +
      'Exemplos: "Uma pessoa está à frente", "Cadeira ao lado direito", "Porta aberta à esquerda".',
    example: 'Uma pessoa está à frente',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class MetricsDto {
  @ApiProperty({
    description:
      'Tempo em milissegundos para capturar a imagem da câmera OV2640. ' +
      'Valores típicos: 200-500ms. Valores muito altos podem indicar problema na câmera.',
    example: 245,
    required: false,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  captureTime?: number;

  @ApiProperty({
    description:
      'Tempo em milissegundos para processar a imagem e detectar objetos. ' +
      'Valores típicos: 1000-3000ms dependendo da resolução e complexidade. ' +
      'Tempo alto pode indicar imagem com muitos objetos ou processamento pesado.',
    example: 1823,
    required: false,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  detectionTime?: number;

  @ApiProperty({
    description:
      'Tempo em milissegundos para enviar os dados ao servidor via HTTP POST. ' +
      'Valores típicos: 100-300ms em WiFi local. ' +
      'Tempo alto indica problema de rede ou servidor lento.',
    example: 156,
    required: false,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  sendTime?: number;

  @ApiProperty({
    description:
      'Tempo total do ciclo completo em milissegundos (capture + detection + send). ' +
      'Use este valor para calcular o throughput do sistema. ' +
      'Exemplo: 2224ms = aproximadamente 0.45 FPS',
    example: 2224,
    required: false,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  totalTime?: number;

  @ApiProperty({
    description:
      'Memória RAM livre disponível no ESP32 em bytes. ' +
      'ESP32 típico tem ~320KB de RAM. ' +
      'Valores baixos (<50000 bytes) indicam risco de crash por falta de memória. ' +
      'Use para detectar memory leaks.',
    example: 89456,
    required: false,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  freeHeap?: number;

  @ApiProperty({
    description:
      'Força do sinal WiFi em dBm (decibel-miliwatts). ' +
      'Valores são sempre negativos. Escala de qualidade: ' +
      '-30 a -50 dBm = Excelente | ' +
      '-50 a -70 dBm = Bom | ' +
      '-70 a -80 dBm = Regular | ' +
      '-80 a -90 dBm = Fraco | ' +
      'Abaixo de -90 dBm = Muito fraco (risco de desconexão)',
    example: -67,
    required: false,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  rssi?: number;

  @ApiProperty({
    description:
      'Taxa de frames por segundo - quantas detecções o sistema consegue processar por segundo. ' +
      'Calculado como: 1000 / totalTime. ' +
      'Valores típicos: 0.3 a 1.0 FPS para detecção com ML. ' +
      'FPS baixo (<0.2) indica sistema sobrecarregado.',
    example: 0.45,
    required: false,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  fps?: number;
}

export class VisionDetectionDto {
  @ApiProperty({
    description:
      'Identificador único do módulo ESP32 que está enviando os dados. ' +
      'Use um ID consistente para cada dispositivo físico. ' +
      'Útil quando há múltiplos ESP32 trabalhando em conjunto. ' +
      'Formato sugerido: "module-1", "cam-01", "esp32-sala", etc.',
    example: 'module-2',
    type: String,
  })
  @IsString()
  moduleId: string;

  @ApiProperty({
    description:
      'Array contendo todos os objetos detectados neste frame da câmera. ' +
      'Pode conter múltiplos objetos se vários foram identificados simultaneamente. ' +
      'Array vazio [] é válido quando nenhum objeto foi detectado. ' +
      'Cada objeto contém: name (nome), confidence (confiança 0-100) e description (descrição opcional).',
    type: [DetectedObjectDto],
    example: [
      { name: 'pessoa', confidence: 95, description: 'Uma pessoa à frente' },
      { name: 'cadeira', confidence: 87, description: 'Cadeira ao lado direito' },
    ],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetectedObjectDto)
  objects: DetectedObjectDto[];

  @ApiProperty({
    description:
      'Timestamp no formato ISO 8601 indicando quando a detecção ocorreu. ' +
      'Se não for fornecido, o servidor usará o horário de recebimento. ' +
      'Útil para sincronização e análise temporal dos dados. ' +
      'Formato: "2025-10-29T15:30:00.000Z"',
    example: '2025-10-29T15:30:00.000Z',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  timestamp?: string;

  @ApiProperty({
    description:
      'Objeto contendo métricas de performance do ESP32 para monitoramento e diagnóstico. ' +
      'Todos os campos são opcionais mas altamente recomendados. ' +
      'Use para identificar gargalos, problemas de memória e qualidade de conexão WiFi.',
    required: false,
    type: MetricsDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MetricsDto)
  metrics?: MetricsDto;
}

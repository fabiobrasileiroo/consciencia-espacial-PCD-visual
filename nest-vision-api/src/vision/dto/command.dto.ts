import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CommandDto {
  @ApiProperty({
    description: 'Tipo de comando a ser enviado para o ESP32',
    example: 'setFPS',
    enum: [
      'setFPS',
      'setResolution',
      'setThreshold',
      'toggleMode',
      'reboot',
      'calibrate',
      'getStatus',
    ],
  })
  @IsString()
  @IsNotEmpty()
  command: string;

  @ApiProperty({
    description: 'Dados adicionais do comando (varia conforme o tipo)',
    example: { fps: 15 },
    required: false,
    examples: {
      setFPS: {
        value: { fps: 15 },
        description: 'Define FPS (1-30)',
      },
      setResolution: {
        value: { resolution: 'VGA' },
        description: 'VGA, SVGA, XGA, HD, FHD',
      },
      setThreshold: {
        value: { threshold: 0.7 },
        description: 'Confiança mínima (0-1)',
      },
      toggleMode: {
        value: { mode: 'continuous' },
        description: 'continuous, ondemand, scheduled',
      },
    },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class CommandResponseDto {
  @ApiProperty({
    description: 'Indica se o comando foi enviado com sucesso',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ID do módulo que recebeu o comando',
    example: 'ESP32_CAM_001',
  })
  moduleId: string;

  @ApiProperty({
    description: 'Comando que foi enviado',
    example: 'setFPS',
  })
  command: string;

  @ApiProperty({
    description: 'Mensagem de status',
    example: 'Comando enviado com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp do envio',
    example: '2025-01-08T14:30:00.000Z',
  })
  timestamp: string;
}

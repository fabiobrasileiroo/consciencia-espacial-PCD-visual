import { ApiProperty } from '@nestjs/swagger';

export class VisionResponseDto {
  @ApiProperty({
    description: 'Status do processamento',
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: 'Mensagem de resposta',
    example: 'Detecção recebida e processada com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp do processamento',
    example: '2025-10-29T15:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Dados da detecção processada',
    required: false,
  })
  data?: any;
}

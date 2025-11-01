import { Module } from '@nestjs/common';
import { VisionController } from './vision.controller';
import { VisionService } from './vision.service';
import { VisionGateway } from './vision.gateway';
import { TensorFlowService } from './tensorflow.service';
import { ESP32Service } from './esp32.service';

@Module({
  controllers: [VisionController],
  providers: [
    VisionService,
    VisionGateway,
    TensorFlowService,
    ESP32Service,
  ],
  exports: [VisionService, VisionGateway, TensorFlowService, ESP32Service],
})
export class VisionModule { }

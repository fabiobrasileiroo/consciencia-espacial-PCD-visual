import { Module } from '@nestjs/common';
import { VisionController } from './vision.controller';
import { VisionService } from './vision.service';
import { VisionGateway } from './vision.gateway';

@Module({
  controllers: [VisionController],
  providers: [VisionService, VisionGateway],
  exports: [VisionService, VisionGateway],
})
export class VisionModule { }

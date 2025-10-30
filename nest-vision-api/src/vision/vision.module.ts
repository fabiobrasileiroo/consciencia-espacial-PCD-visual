import { Module } from '@nestjs/common';
import { VisionController } from './vision.controller';
import { VisionService } from './vision.service';

@Module({
  controllers: [VisionController],
  providers: [VisionService],
  exports: [VisionService],
})
export class VisionModule { }

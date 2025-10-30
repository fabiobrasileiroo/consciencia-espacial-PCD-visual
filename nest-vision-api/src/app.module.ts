import { Module } from '@nestjs/common';
import { VisionModule } from './vision/vision.module';
import { HealthModule } from './health/health.module';
import { AppController } from './app.controller';

@Module({
  imports: [VisionModule, HealthModule],
  controllers: [AppController],
})
export class AppModule { }

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Vision API - Sistema de Detecção de Objetos')
    .setDescription(
      'API para receber e processar dados de detecção de objetos do ESP32-CAM em tempo real. ' +
      'Sistema desenvolvido para auxiliar pessoas com deficiência visual (PCD visual).',
    )
    .setVersion('1.0')
    .addTag('vision', 'Endpoints de detecção de visão')
    .addTag('health', 'Health checks e status do sistema')
    .addServer('http://localhost:3000', 'Servidor Local')
    .addServer('http://192.168.100.11:3000', 'Servidor Rede Local')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Vision API - Documentação',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
    ],
  });

  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0');

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║             🚀 Vision API - Sistema de Detecção                ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  ✅ Servidor rodando em: http://localhost:${port}`);
  console.log(`  ✅ Rede local em: http://192.168.100.11:${port}`);
  console.log(`  📚 Documentação Swagger: http://localhost:${port}/api/docs`);
  console.log(`  📡 Stream SSE: http://localhost:${port}/api/vision/stream`);
  console.log(`  💚 Health check: http://localhost:${port}/api/health`);
  console.log('');
  console.log('  Aguardando conexões do ESP32-CAM...');
  console.log('');
}

bootstrap();

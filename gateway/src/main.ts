import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Configuration } from './config/Configuration';

async function bootstrap() {
  // Initialize application
  const app = await NestFactory.create(AppModule);

  // Create Swagger page
  const documentation = new DocumentBuilder()
    .setTitle(`Hyperledger Fabric 2.4.7 Gateway — ${Configuration.mspID}`)
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, documentation);
  SwaggerModule.setup('swagger', app, swaggerDocument);

  // Enable CORS
  app.enableCors();

  // Start application on port 4000
  await app.listen(4000);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // habilitando CORS
  app.enableCors();

  // clas-validator
  app.useGlobalPipes(new ValidationPipe({
    disableErrorMessages: false,
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Backend Api')
    .setDescription('Proyecto Backend api rest')
    .setVersion('1.0')
    .addTag('node')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  // Swagger
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

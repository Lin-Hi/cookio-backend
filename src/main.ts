import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: 'http://localhost:3000',
        credentials: true,
    });

    // Global DTO validation
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    // Swagger
    const config = new DocumentBuilder()
        .setTitle('Cookio Backend API')
        .setDescription('API docs for Cookio')
        .setVersion('0.1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    const port = Number(process.env.PORT) || 8080;
    await app.listen(port);
    console.log(`🚀 Server http://localhost:${port}`);
    console.log(`📚 Swagger http://localhost:${port}/docs`);
}
bootstrap();

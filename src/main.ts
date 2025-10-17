import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 允许所有 CORS（根据需要调整）
  app.enableCors();

  // 使用 Vercel 提供的端口，否则使用 3000
  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}
bootstrap();

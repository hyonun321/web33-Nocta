import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // 개발 중에는 모든 origin 허용
    credentials: true, // 쿠키 전송을 위해 필수
  });
  await app.listen(process.env.PORT ?? 3000);
};
bootstrap();

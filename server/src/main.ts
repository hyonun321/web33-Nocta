import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  const isDevelopment = process.env.NODE_ENV === "development";

  const allowedOrigins = ["https://nocta.site", "https://www.nocta.site"];

  app.enableCors({
    origin: (origin, callback) => {
      if (isDevelopment) {
        // 개발 환경: 모든 Origin 허용
        callback(null, true);
      } else {
        // 배포 환경: 특정 Origin만 허용
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true, // 쿠키 전송을 위해 필수
  });

  app.setGlobalPrefix("api");

  await app.listen(process.env.PORT ?? 3000);
};
bootstrap();

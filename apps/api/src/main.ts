import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: { origin: true, credentials: true } });
  app.use(cookieParser());
  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port, "0.0.0.0");
  console.log(`Werewolf API en http://localhost:${port}`);
}

void bootstrap();

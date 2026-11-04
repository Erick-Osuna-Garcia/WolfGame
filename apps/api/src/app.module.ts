import { Module } from "@nestjs/common";
import { GameGateway } from "./game.gateway";
import { HealthController } from "./http.controller";
import { liveHub } from "./live.hub";
import { RoomsService } from "./rooms.service";
import { MemoryStore } from "./store";

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: "APP_STORE",
      useFactory: async () => {
        if (process.env.DATABASE_URL) {
          const { PrismaClient } = await import("@prisma/client");
          const { PrismaStore } = await import("./prisma.store");
          return new PrismaStore(new PrismaClient());
        }
        return new MemoryStore();
      },
    },
    {
      provide: RoomsService,
      useFactory: (store: MemoryStore) => new RoomsService(store, (code) => liveHub.emit(code)),
      inject: ["APP_STORE"],
    },
    GameGateway,
  ],
})
export class AppModule {}

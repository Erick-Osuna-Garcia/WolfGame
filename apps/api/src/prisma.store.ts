import { PrismaClient } from "@prisma/client";
import type { RoomConfigSnapshot } from "@werewolf/shared";
import type { AppStore, StoredRoom, StoredSession } from "./store";

export class PrismaStore implements AppStore {
  constructor(private readonly prisma: PrismaClient) {}

  async saveRoom(room: StoredRoom): Promise<void> {
    await this.prisma.roomRecord.upsert({
      where: { code: room.game.code },
      create: {
        id: room.game.roomId,
        code: room.game.code,
        status: room.game.status,
        state: room as object,
      },
      update: {
        status: room.game.status,
        state: room as object,
      },
    });
  }

  async getRoom(code: string): Promise<StoredRoom | null> {
    const row = await this.prisma.roomRecord.findUnique({ where: { code } });
    return row ? (row.state as unknown as StoredRoom) : null;
  }

  async listRooms(): Promise<StoredRoom[]> {
    const rows = await this.prisma.roomRecord.findMany();
    return rows.map((row) => row.state as unknown as StoredRoom);
  }

  async saveSession(session: StoredSession): Promise<void> {
    await this.prisma.sessionRecord.upsert({
      where: { tokenHash: session.tokenHash },
      create: session,
      update: session,
    });
  }

  async getSessionByToken(tokenHash: string): Promise<StoredSession | null> {
    return this.prisma.sessionRecord.findUnique({ where: { tokenHash } });
  }

  async getSessionByRecovery(recoveryHash: string): Promise<StoredSession | null> {
    return this.prisma.sessionRecord.findUnique({ where: { recoveryHash } });
  }

  async deleteSessionsForParticipant(participantId: string): Promise<void> {
    await this.prisma.sessionRecord.deleteMany({ where: { participantId } });
  }

  async saveConfig(config: RoomConfigSnapshot): Promise<void> {
    await this.prisma.configRecord.upsert({
      where: { id: config.id },
      create: { id: config.id, name: config.name, snapshot: config as object },
      update: { name: config.name, snapshot: config as object },
    });
  }

  async listConfigs(): Promise<RoomConfigSnapshot[]> {
    const rows = await this.prisma.configRecord.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((row) => row.snapshot as unknown as RoomConfigSnapshot);
  }

  async getConfig(id: string): Promise<RoomConfigSnapshot | null> {
    const row = await this.prisma.configRecord.findUnique({ where: { id } });
    return row ? (row.snapshot as unknown as RoomConfigSnapshot) : null;
  }
}

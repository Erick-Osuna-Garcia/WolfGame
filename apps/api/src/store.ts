import type { RoomConfigSnapshot } from "@werewolf/shared";
import type { GameState } from "@werewolf/game-rules";

export type StoredParticipant = {
  id: string;
  kind: "GAME_MASTER" | "PLAYER";
  name: string | null;
  tokenHash: string;
  recoveryHash: string;
  kicked: boolean;
};

export type StoredRoom = {
  game: GameState;
  participants: StoredParticipant[];
};

export type StoredSession = {
  tokenHash: string;
  recoveryHash: string;
  roomCode: string;
  participantId: string;
  kind: "GAME_MASTER" | "PLAYER";
};

export interface AppStore {
  saveRoom(room: StoredRoom): Promise<void>;
  getRoom(code: string): Promise<StoredRoom | null>;
  listRooms(): Promise<StoredRoom[]>;
  saveSession(session: StoredSession): Promise<void>;
  getSessionByToken(tokenHash: string): Promise<StoredSession | null>;
  getSessionByRecovery(recoveryHash: string): Promise<StoredSession | null>;
  deleteSessionsForParticipant(participantId: string): Promise<void>;
  saveConfig(config: RoomConfigSnapshot): Promise<void>;
  listConfigs(): Promise<RoomConfigSnapshot[]>;
  getConfig(id: string): Promise<RoomConfigSnapshot | null>;
}

export class MemoryStore implements AppStore {
  private rooms = new Map<string, StoredRoom>();
  private sessions = new Map<string, StoredSession>();
  private recoveries = new Map<string, StoredSession>();
  private configs = new Map<string, RoomConfigSnapshot>();

  async saveRoom(room: StoredRoom): Promise<void> {
    this.rooms.set(room.game.code, structuredClone(room));
  }

  async getRoom(code: string): Promise<StoredRoom | null> {
    const room = this.rooms.get(code);
    return room ? structuredClone(room) : null;
  }

  async listRooms(): Promise<StoredRoom[]> {
    return [...this.rooms.values()].map((room) => structuredClone(room));
  }

  async saveSession(session: StoredSession): Promise<void> {
    this.sessions.set(session.tokenHash, session);
    this.recoveries.set(session.recoveryHash, session);
  }

  async getSessionByToken(tokenHash: string): Promise<StoredSession | null> {
    return this.sessions.get(tokenHash) ?? null;
  }

  async getSessionByRecovery(recoveryHash: string): Promise<StoredSession | null> {
    return this.recoveries.get(recoveryHash) ?? null;
  }

  async deleteSessionsForParticipant(participantId: string): Promise<void> {
    for (const [hash, session] of this.sessions) {
      if (session.participantId === participantId) {
        this.sessions.delete(hash);
        this.recoveries.delete(session.recoveryHash);
      }
    }
  }

  async saveConfig(config: RoomConfigSnapshot): Promise<void> {
    this.configs.set(config.id, config);
  }

  async listConfigs(): Promise<RoomConfigSnapshot[]> {
    return [...this.configs.values()];
  }

  async getConfig(id: string): Promise<RoomConfigSnapshot | null> {
    return this.configs.get(id) ?? null;
  }
}

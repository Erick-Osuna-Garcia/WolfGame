import {
  apply,
  classicComposition,
  createEmptyState,
  expireHunter,
  shuffleRoles,
  toGameMasterView,
  toPlayerView,
  type Command,
  type GameState,
} from "@werewolf/game-rules";
import {
  MAX_NAME_LENGTH,
  MAX_PLAYERS,
  MIN_NAME_LENGTH,
  type ClientView,
  type RoomConfigSnapshot,
} from "@werewolf/shared";
import { createId, createRecoveryCode, createRoomCode, createToken, hashSecret } from "./ids";
import type { AppStore, StoredParticipant, StoredRoom } from "./store";

export class RoomError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export type SessionContext = {
  token: string;
  recoveryCode?: string;
  participantId: string;
  roomCode: string;
  kind: "GAME_MASTER" | "PLAYER";
};

export class RoomsService {
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly store: AppStore,
    private readonly emit: (roomCode: string) => Promise<void>,
  ) {}

  async createRoom(configId?: string): Promise<{ view: ClientView; session: SessionContext; qrPath: string }> {
    const token = createToken();
    const recoveryCode = createRecoveryCode();
    const gameMasterId = createId("gm");
    const game = createEmptyState({
      roomId: createId("room"),
      code: await this.uniqueCode(),
      gameMasterId,
    });
    if (configId) {
      const config = await this.store.getConfig(configId);
      if (config) applyConfig(game, config);
    }
    const participant: StoredParticipant = {
      id: gameMasterId,
      kind: "GAME_MASTER",
      name: "Game Master",
      tokenHash: hashSecret(token),
      recoveryHash: hashSecret(recoveryCode),
      kicked: false,
    };
    await this.store.saveRoom({ game, participants: [participant] });
    await this.store.saveSession({
      tokenHash: participant.tokenHash,
      recoveryHash: participant.recoveryHash,
      roomCode: game.code,
      participantId: gameMasterId,
      kind: "GAME_MASTER",
    });
    const view = toGameMasterView(game);
    view.recoveryCode = recoveryCode;
    return {
      view,
      session: {
        token,
        recoveryCode,
        participantId: gameMasterId,
        roomCode: game.code,
        kind: "GAME_MASTER",
      },
      qrPath: `/join?code=${game.code}`,
    };
  }

  async joinRoom(code: string, name: string): Promise<{ view: ClientView; session: SessionContext }> {
    const trimmed = name.trim();
    if (trimmed.length < MIN_NAME_LENGTH || trimmed.length > MAX_NAME_LENGTH) {
      throw new RoomError("BAD_NAME", "El nombre debe tener entre 2 y 24 caracteres");
    }
    const room = await this.requireRoom(code);
    if (room.game.status !== "OPEN" || room.game.phase !== "LOBBY") {
      throw new RoomError("STARTED", "La partida ya empezó");
    }
    if (room.game.players.length >= MAX_PLAYERS) {
      throw new RoomError("FULL", "La sala ya tiene 30 jugadores");
    }
    if (room.game.players.some((player) => player.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new RoomError("NAME_TAKEN", "Ese nombre ya está en la sala");
    }
    const token = createToken();
    const recoveryCode = createRecoveryCode();
    const playerId = createId("p");
    room.game.players.push({
      id: playerId,
      name: trimmed,
      roleId: null,
      alive: true,
      connected: true,
      lastProtectedTargetId: null,
      witchHealUsed: false,
      witchPoisonUsed: false,
      cupidLinked: false,
      littleGirlPeeked: false,
      littleGirlDiscovered: null,
      knownWerewolfIds: [],
      investigation: null,
      loverId: null,
    });
    const participant: StoredParticipant = {
      id: playerId,
      kind: "PLAYER",
      name: trimmed,
      tokenHash: hashSecret(token),
      recoveryHash: hashSecret(recoveryCode),
      kicked: false,
    };
    room.participants.push(participant);
    await this.store.saveRoom(room);
    await this.store.saveSession({
      tokenHash: participant.tokenHash,
      recoveryHash: participant.recoveryHash,
      roomCode: room.game.code,
      participantId: playerId,
      kind: "PLAYER",
    });
    await this.emit(room.game.code);
    const view = toPlayerView(room.game, playerId);
    view.recoveryCode = recoveryCode;
    return {
      view,
      session: {
        token,
        recoveryCode,
        participantId: playerId,
        roomCode: room.game.code,
        kind: "PLAYER",
      },
    };
  }

  async rejoin(token?: string, recoveryCode?: string): Promise<{ view: ClientView; session: SessionContext }> {
    const session = token
      ? await this.store.getSessionByToken(hashSecret(token))
      : recoveryCode
        ? await this.store.getSessionByRecovery(hashSecret(recoveryCode.toUpperCase()))
        : null;
    if (!session) throw new RoomError("NO_SESSION", "No encontramos esa sesión");
    const room = await this.requireRoom(session.roomCode, true);
    const participant = room.participants.find((item) => item.id === session.participantId);
    if (!participant || participant.kicked) {
      throw new RoomError("KICKED", "Ya no formas parte de esta sala");
    }
    if (session.kind === "PLAYER") {
      const player = room.game.players.find((item) => item.id === session.participantId);
      if (player) player.connected = true;
    }
    await this.store.saveRoom(room);
    await this.emit(room.game.code);
    return {
      view: this.viewFor(room.game, session.participantId, session.kind),
      session: {
        token: token ?? "",
        participantId: session.participantId,
        roomCode: session.roomCode,
        kind: session.kind,
      },
    };
  }

  async disconnect(token: string): Promise<void> {
    const session = await this.store.getSessionByToken(hashSecret(token));
    if (!session) return;
    const room = await this.store.getRoom(session.roomCode);
    if (!room) return;
    const player = room.game.players.find((item) => item.id === session.participantId);
    if (player) player.connected = false;
    await this.store.saveRoom(room);
    await this.emit(room.game.code);
  }

  async command(token: string, command: Command | { type: "KICK"; participantId: string }): Promise<ClientView> {
    const session = await this.requireSession(token);
    const room = await this.requireRoom(session.roomCode);
    if (command.type === "KICK") {
      if (session.kind !== "GAME_MASTER") throw new RoomError("FORBIDDEN", "Solo el Game Master puede expulsar");
      return this.kick(room, command.participantId);
    }
    if (needsMaster(command) && session.kind !== "GAME_MASTER") {
      throw new RoomError("FORBIDDEN", "Solo el Game Master puede hacer eso");
    }
    if (isPlayerCommand(command) && actorIdOf(command) !== session.participantId) {
      throw new RoomError("FORBIDDEN", "No puedes actuar por otro jugador");
    }
    const prepared = prepareCommand(room, command);
    const result = apply(room.game, prepared);
    if (!result.ok) throw new RoomError(result.error.code, result.error.message);
    room.game = result.state;
    this.scheduleTimers(room);
    await this.store.saveRoom(room);
    await this.emit(room.game.code);
    return this.viewFor(room.game, session.participantId, session.kind);
  }

  async saveConfig(token: string, name: string): Promise<RoomConfigSnapshot> {
    const session = await this.requireSession(token);
    if (session.kind !== "GAME_MASTER") throw new RoomError("FORBIDDEN", "Solo el Game Master guarda configuraciones");
    const room = await this.requireRoom(session.roomCode);
    const config: RoomConfigSnapshot = {
      id: createId("cfg"),
      name,
      roles: room.game.roleDraft ?? room.game.players.map((player) => player.roleId).filter((role): role is NonNullable<typeof role> => Boolean(role)),
      discussionSeconds: room.game.discussionSeconds,
      votingSeconds: room.game.votingSeconds,
      hunterSeconds: room.game.hunterSeconds,
      voteChangeEnabled: room.game.voteChangeEnabled,
      revealPolicy: room.game.revealPolicy,
      paceMode: room.game.paceMode,
    };
    await this.store.saveConfig(config);
    return config;
  }

  async listConfigs(): Promise<RoomConfigSnapshot[]> {
    return this.store.listConfigs();
  }

  async history(token: string) {
    const session = await this.requireSession(token);
    if (session.kind !== "GAME_MASTER") throw new RoomError("FORBIDDEN", "El historial completo es del Game Master");
    const room = await this.requireRoom(session.roomCode, true);
    return room.game.events;
  }

  async viewByToken(token: string): Promise<ClientView> {
    const session = await this.requireSession(token);
    const room = await this.requireRoom(session.roomCode, true);
    return this.viewFor(room.game, session.participantId, session.kind);
  }

  async roomViews(code: string): Promise<{ participantId: string; kind: "GAME_MASTER" | "PLAYER"; view: ClientView }[]> {
    const room = await this.store.getRoom(code);
    if (!room) return [];
    return room.participants
      .filter((participant) => !participant.kicked)
      .map((participant) => ({
        participantId: participant.id,
        kind: participant.kind,
        view: this.viewFor(room.game, participant.id, participant.kind),
      }));
  }

  private async kick(room: StoredRoom, participantId: string): Promise<ClientView> {
    const participant = room.participants.find((item) => item.id === participantId);
    if (!participant) throw new RoomError("NOT_FOUND", "Jugador no encontrado");
    participant.kicked = true;
    room.game.players = room.game.players.filter((player) => player.id !== participantId);
    await this.store.deleteSessionsForParticipant(participantId);
    await this.store.saveRoom(room);
    await this.emit(room.game.code);
    return toGameMasterView(room.game);
  }

  private viewFor(game: GameState, participantId: string, kind: "GAME_MASTER" | "PLAYER"): ClientView {
    return kind === "GAME_MASTER" ? toGameMasterView(game) : toPlayerView(game, participantId);
  }

  private async requireRoom(code: string, allowClosed = false): Promise<StoredRoom> {
    const room = await this.store.getRoom(code.toUpperCase());
    if (!room) throw new RoomError("NOT_FOUND", "No hay una sala con ese código");
    if (!allowClosed && room.game.status === "CLOSED") throw new RoomError("CLOSED", "Esta sesión ya terminó");
    return room;
  }

  private async requireSession(token: string) {
    const session = await this.store.getSessionByToken(hashSecret(token));
    if (!session) throw new RoomError("NO_SESSION", "Sesión no válida");
    return session;
  }

  private async uniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = createRoomCode();
      if (!(await this.store.getRoom(code))) return code;
    }
    throw new RoomError("CODE", "No se pudo crear un código de sala");
  }

  private scheduleTimers(room: StoredRoom): void {
    const existing = this.timers.get(room.game.code);
    if (existing) clearTimeout(existing);
    const ends = room.game.phase === "VOTING" ? room.game.timerEndsAt : room.game.hunterTimerEndsAt;
    if (!ends) return;
    const wait = Math.max(0, ends - Date.now());
    this.timers.set(
      room.game.code,
      setTimeout(() => {
        void this.onTimer(room.game.code);
      }, wait),
    );
  }

  private async onTimer(code: string): Promise<void> {
    const room = await this.store.getRoom(code);
    if (!room) return;
    if (room.game.phase === "VOTING") {
      const result = apply(room.game, { type: "ADVANCE_PHASE", to: "VOTING_RESULTS" });
      if (result.ok) room.game = result.state;
    } else if (room.game.pendingHunterId) {
      room.game = expireHunter(room.game);
    }
    await this.store.saveRoom(room);
    await this.emit(code);
  }
}

function needsMaster(command: Command): boolean {
  return [
    "ASSIGN_ROLES",
    "CORRECT_ROLE",
    "START_GAME",
    "ADVANCE_PHASE",
    "JUDGE_GIRL",
    "EXECUTE_RESULTS",
    "CLOSE_ROOM",
    "SET_PACE",
  ].includes(command.type);
}

function isPlayerCommand(command: Command): boolean {
  return command.type === "NIGHT_ACTION" || command.type === "CAST_VOTE" || command.type === "HUNTER_SHOOT";
}

function actorIdOf(command: Command): string | undefined {
  if (command.type === "NIGHT_ACTION") return command.actorId;
  if (command.type === "CAST_VOTE") return command.voterId;
  if (command.type === "HUNTER_SHOOT") return command.actorId;
  return undefined;
}

function prepareCommand(room: StoredRoom, command: Command): Command {
  if (command.type === "ASSIGN_ROLES" && command.roles.length === 0) {
    try {
      return { type: "ASSIGN_ROLES", roles: shuffleRoles(classicComposition(room.game.players.length)) };
    } catch (error) {
      throw new RoomError("ROLE_COUNT", error instanceof Error ? error.message : "No se pueden asignar roles");
    }
  }
  return command;
}

function applyConfig(game: GameState, config: RoomConfigSnapshot): void {
  game.discussionSeconds = config.discussionSeconds;
  game.votingSeconds = config.votingSeconds;
  game.hunterSeconds = config.hunterSeconds;
  game.voteChangeEnabled = config.voteChangeEnabled;
  game.revealPolicy = config.revealPolicy;
  game.paceMode = config.paceMode;
  if (config.roles.length > 0) game.roleDraft = config.roles;
}

import { Inject, OnModuleInit } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import type { Command } from "@werewolf/game-rules";
import type { AbilityId, GamePhase, PaceMode, RoleId } from "@werewolf/shared";
import { liveHub } from "./live.hub";
import { RoomsService, RoomError } from "./rooms.service";

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class GameGateway implements OnModuleInit {
  @WebSocketServer()
  server!: Server;

  constructor(@Inject(RoomsService) private readonly rooms: RoomsService) {}

  onModuleInit() {
    liveHub.setListener((code) => this.broadcast(code));
  }

  async broadcast(code: string): Promise<void> {
    if (!this.server) return;
    const views = await this.rooms.roomViews(code);
    for (const entry of views) {
      this.server.to(entry.participantId).emit("state", { view: entry.view });
    }
  }

  async handleConnection(socket: Socket) {
    const token = String(socket.handshake.auth?.token ?? "");
    if (!token) return;
    try {
      const result = await this.rooms.rejoin(token);
      socket.data.token = token;
      socket.data.participantId = result.session.participantId;
      socket.data.roomCode = result.session.roomCode;
      void socket.join(result.session.participantId);
      void socket.join(result.session.roomCode);
      socket.emit("state", { view: result.view });
    } catch (error) {
      emitError(socket, error);
    }
  }

  async handleDisconnect(socket: Socket) {
    const token = socket.data.token as string | undefined;
    if (token) await this.rooms.disconnect(token);
  }

  @SubscribeMessage("room:kick")
  kick(@ConnectedSocket() socket: Socket, @MessageBody() body: { participantId: string }) {
    return this.run(socket, { type: "KICK", participantId: body.participantId });
  }

  @SubscribeMessage("room:close")
  close(@ConnectedSocket() socket: Socket) {
    return this.run(socket, { type: "CLOSE_ROOM" });
  }

  @SubscribeMessage("room:assignRoles")
  assign(@ConnectedSocket() socket: Socket, @MessageBody() body: { roles?: RoleId[] }) {
    return this.run(socket, { type: "ASSIGN_ROLES", roles: body.roles ?? [] });
  }

  @SubscribeMessage("room:correctRole")
  correct(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { participantId: string; roleId: RoleId },
  ) {
    return this.run(socket, { type: "CORRECT_ROLE", playerId: body.participantId, roleId: body.roleId });
  }

  @SubscribeMessage("room:start")
  start(@ConnectedSocket() socket: Socket) {
    return this.run(socket, { type: "START_GAME" });
  }

  @SubscribeMessage("phase:advance")
  advance(@ConnectedSocket() socket: Socket, @MessageBody() body: { to: GamePhase }) {
    return this.run(socket, { type: "ADVANCE_PHASE", to: body.to });
  }

  @SubscribeMessage("phase:setPace")
  pace(@ConnectedSocket() socket: Socket, @MessageBody() body: { paceMode: PaceMode }) {
    return this.run(socket, { type: "SET_PACE", paceMode: body.paceMode });
  }

  @SubscribeMessage("action:night")
  night(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { abilityId: AbilityId; targetId?: string | null; secondTargetId?: string | null },
  ) {
    return this.run(socket, {
      type: "NIGHT_ACTION",
      actorId: socket.data.participantId,
      abilityId: body.abilityId,
      targetId: body.targetId,
      secondTargetId: body.secondTargetId,
    });
  }

  @SubscribeMessage("action:vote")
  vote(@ConnectedSocket() socket: Socket, @MessageBody() body: { targetId: string | null }) {
    return this.run(socket, {
      type: "CAST_VOTE",
      voterId: socket.data.participantId,
      targetId: body.targetId,
    });
  }

  @SubscribeMessage("action:hunter")
  hunter(@ConnectedSocket() socket: Socket, @MessageBody() body: { targetId: string | null }) {
    return this.run(socket, {
      type: "HUNTER_SHOOT",
      actorId: socket.data.participantId,
      targetId: body.targetId,
    });
  }

  @SubscribeMessage("gm:judgeGirl")
  judge(@ConnectedSocket() socket: Socket, @MessageBody() body: { discovered: boolean }) {
    return this.run(socket, { type: "JUDGE_GIRL", discovered: body.discovered });
  }

  @SubscribeMessage("gm:executeResults")
  execute(@ConnectedSocket() socket: Socket) {
    return this.run(socket, { type: "EXECUTE_RESULTS" });
  }

  @SubscribeMessage("config:save")
  async saveConfig(@ConnectedSocket() socket: Socket, @MessageBody() body: { name: string }) {
    try {
      const config = await this.rooms.saveConfig(socket.data.token, body.name);
      socket.emit("config:saved", config);
    } catch (error) {
      emitError(socket, error);
    }
  }

  @SubscribeMessage("history:get")
  async history(@ConnectedSocket() socket: Socket) {
    try {
      socket.emit("history", { events: await this.rooms.history(socket.data.token) });
    } catch (error) {
      emitError(socket, error);
    }
  }

  private async run(socket: Socket, command: Command | { type: "KICK"; participantId: string }) {
    try {
      const view = await this.rooms.command(socket.data.token, command);
      socket.emit("state", { view });
    } catch (error) {
      emitError(socket, error);
    }
  }
}

function emitError(socket: Socket, error: unknown) {
  if (error instanceof RoomError) {
    socket.emit("error", { code: error.code, message: error.message });
    if (error.code === "KICKED") socket.emit("kicked", { message: error.message });
    if (error.code === "CLOSED") socket.emit("closed", { message: error.message });
    return;
  }
  socket.emit("error", { code: "SERVER", message: "Error interno" });
}

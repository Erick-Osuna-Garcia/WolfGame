import { describe, expect, it } from "vitest";
import { RoomsService, RoomError } from "../src/rooms.service";
import { MemoryStore } from "../src/store";

function service() {
  return new RoomsService(new MemoryStore(), async () => undefined);
}

describe("RoomsService", () => {
  it("creates a room with a short code and recovery for the game master", async () => {
    const rooms = service();
    const created = await rooms.createRoom();
    expect(created.session.roomCode).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
    expect(created.session.recoveryCode).toMatch(/-/);
    expect(created.view.kind).toBe("GAME_MASTER");
  });

  it("lets a player join and rejects a repeated name", async () => {
    const rooms = service();
    const created = await rooms.createRoom();
    const joined = await rooms.joinRoom(created.session.roomCode, "Erick");
    expect(joined.view.kind).toBe("PLAYER");
    await expect(rooms.joinRoom(created.session.roomCode, "Erick")).rejects.toBeInstanceOf(RoomError);
  });

  it("restores the same seat after a disconnect", async () => {
    const rooms = service();
    const created = await rooms.createRoom();
    const joined = await rooms.joinRoom(created.session.roomCode, "Erick");
    await rooms.disconnect(joined.session.token);
    const again = await rooms.rejoin(joined.session.token);
    expect(again.session.participantId).toBe(joined.session.participantId);
    expect(again.view.kind === "PLAYER" && again.view.you.name).toBe("Erick");
  });

  it("keeps two rooms isolated", async () => {
    const rooms = service();
    const first = await rooms.createRoom();
    const second = await rooms.createRoom();
    await rooms.joinRoom(first.session.roomCode, "Ana");
    await rooms.joinRoom(second.session.roomCode, "Beto");
    const firstView = await rooms.viewByToken(first.session.token);
    expect(firstView.kind === "GAME_MASTER" && firstView.players.map((player) => player.name)).toEqual(["Ana"]);
  });

  it("saves a reusable configuration", async () => {
    const rooms = service();
    const created = await rooms.createRoom();
    const config = await rooms.saveConfig(created.session.token, "Clásico de mesa");
    expect(config.name).toBe("Clásico de mesa");
    const listed = await rooms.listConfigs();
    expect(listed).toHaveLength(1);
    const reused = await rooms.createRoom(config.id);
    expect(reused.view.kind === "GAME_MASTER" && reused.view.paceMode).toBe(created.view.kind === "GAME_MASTER" ? created.view.paceMode : "MANUAL");
  });

  it("assigns classic roles and starts without leaking them to a player", async () => {
    const rooms = service();
    const created = await rooms.createRoom();
    const players = [];
    for (const name of ["Ana", "Beto", "Ciro", "Dina", "Eva"]) {
      players.push(await rooms.joinRoom(created.session.roomCode, name));
    }
    await rooms.command(created.session.token, { type: "ASSIGN_ROLES", roles: [] });
    const started = await rooms.command(created.session.token, { type: "START_GAME" });
    expect(started.phase).toBe("ROLE_REVEAL");
    const playerView = await rooms.viewByToken(players[0].session.token);
    expect(playerView.kind).toBe("PLAYER");
    if (playerView.kind === "PLAYER") {
      expect(playerView.you.role).toBeTruthy();
      expect(playerView.players.every((player) => player.revealedRoleId === undefined)).toBe(true);
    }
  });
});

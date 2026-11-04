import { describe, expect, it } from "vitest";
import { evaluateWinner, type GameState, type PlayerState } from "../src/index";

function player(partial: Partial<PlayerState> & Pick<PlayerState, "id" | "roleId">): PlayerState {
  return {
    name: partial.id,
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
    ...partial,
  };
}

function stateOf(players: PlayerState[]): GameState {
  return {
    roomId: "room-1",
    code: "ABC234",
    phase: "DAY",
    round: 1,
    status: "IN_PROGRESS",
    paceMode: "MANUAL",
    voteChangeEnabled: false,
    revealPolicy: "ON_PROCESS",
    discussionSeconds: 180,
    votingSeconds: 60,
    hunterSeconds: 30,
    timerEndsAt: null,
    hunterTimerEndsAt: null,
    players,
    gameMasterId: "gm",
    roleDraft: null,
    nightActions: [],
    votes: [],
    events: [],
    winner: null,
    pendingHunterId: null,
    proposedVictimId: null,
    publicDeaths: [],
    votingResultsRevealed: false,
  };
}

describe("evaluateWinner", () => {
  it("awards lovers first when they are the only two alive", () => {
    const winner = evaluateWinner(
      stateOf([
        player({ id: "p1", roleId: "werewolf", loverId: "p2" }),
        player({ id: "p2", roleId: "villager", loverId: "p1" }),
        player({ id: "p3", roleId: "seer", alive: false }),
      ]),
    );
    expect(winner).toBe("LOVERS");
  });

  it("awards the village when no wolf remains", () => {
    const winner = evaluateWinner(
      stateOf([
        player({ id: "p1", roleId: "villager" }),
        player({ id: "p2", roleId: "seer" }),
        player({ id: "p3", roleId: "werewolf", alive: false }),
      ]),
    );
    expect(winner).toBe("VILLAGE");
  });

  it("awards wolves when they equal or outnumber the rest", () => {
    const winner = evaluateWinner(
      stateOf([
        player({ id: "p1", roleId: "werewolf" }),
        player({ id: "p2", roleId: "werewolf" }),
        player({ id: "p3", roleId: "villager" }),
        player({ id: "p4", roleId: "seer" }),
      ]),
    );
    expect(winner).toBe("WEREWOLF");
  });
});

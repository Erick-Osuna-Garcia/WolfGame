import { describe, expect, it } from "vitest";
import { apply } from "../src/index";
import { CLASSIC_EIGHT, mustApply, seatedState } from "./helpers";

describe("phase machine", () => {
  it("starts the game only when the draft matches seated players", () => {
    const short = seatedState(["Ana", "Beto", "Ciro", "Dina", "Eva"]);
    const rejected = apply(short, { type: "ASSIGN_ROLES", roles: CLASSIC_EIGHT });
    expect(rejected.ok).toBe(false);

    let state = seatedState(["Ana", "Beto", "Ciro", "Dina", "Eva", "Fabi", "Galo", "Hana"]);
    state = mustApply(state, { type: "ASSIGN_ROLES", roles: CLASSIC_EIGHT });
    state = mustApply(state, { type: "START_GAME" });
    expect(state.phase).toBe("ROLE_REVEAL");
    expect(state.players.every((player) => player.roleId)).toBe(true);
  });

  it("rejects voting without an active discussion", () => {
    let state = seatedState(["Ana", "Beto", "Ciro", "Dina", "Eva", "Fabi", "Galo", "Hana"], CLASSIC_EIGHT);
    state = mustApply(state, { type: "START_GAME" });
    const result = apply(state, { type: "ADVANCE_PHASE", to: "VOTING" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("ILLEGAL_TRANSITION");
  });

  it("follows the legal cycle from reveal to a new night", () => {
    let state = seatedState(["Ana", "Beto", "Ciro", "Dina", "Eva", "Fabi", "Galo", "Hana"], CLASSIC_EIGHT);
    state = mustApply(state, { type: "START_GAME" });
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "NIGHT" });
    expect(state.round).toBe(1);
    for (const wolf of state.players.filter((player) => player.roleId === "werewolf")) {
      state = mustApply(state, {
        type: "NIGHT_ACTION",
        actorId: wolf.id,
        abilityId: "werewolf_kill",
        targetId: "p3",
      });
    }
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: "p6",
      abilityId: "cupid_link",
      targetId: "p1",
      secondTargetId: "p2",
    });
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "DAY" });
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "DISCUSSION" });
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "VOTING" });
    expect(state.phase).toBe("VOTING");
    for (const player of state.players.filter((item) => item.alive)) {
      state = mustApply(state, { type: "CAST_VOTE", voterId: player.id, targetId: null });
    }
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "VOTING_RESULTS" });
    state = mustApply(state, { type: "EXECUTE_RESULTS" });
    expect(["NIGHT", "GAME_OVER"]).toContain(state.phase);
  });

  it("stays in night on manual pace when mandatory actions are done", () => {
    let state = seatedState(["Ana", "Beto", "Ciro", "Dina", "Eva", "Fabi", "Galo", "Hana"], CLASSIC_EIGHT);
    state = mustApply(state, { type: "START_GAME" });
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "NIGHT" });
    for (const wolf of state.players.filter((player) => player.roleId === "werewolf")) {
      state = mustApply(state, {
        type: "NIGHT_ACTION",
        actorId: wolf.id,
        abilityId: "werewolf_kill",
        targetId: "p3",
      });
    }
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: "p6",
      abilityId: "cupid_link",
      targetId: "p1",
      secondTargetId: "p2",
    });
    expect(state.phase).toBe("NIGHT");
  });

  it("closes night automatically in assisted mode after mandatory actions", () => {
    let state = seatedState(["Ana", "Beto", "Ciro", "Dina", "Eva", "Fabi", "Galo", "Hana"], CLASSIC_EIGHT);
    state.paceMode = "ASSISTED";
    state = mustApply(state, { type: "START_GAME" });
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "NIGHT" });
    for (const wolf of state.players.filter((player) => player.roleId === "werewolf")) {
      state = mustApply(state, {
        type: "NIGHT_ACTION",
        actorId: wolf.id,
        abilityId: "werewolf_kill",
        targetId: "p3",
      });
    }
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: "p6",
      abilityId: "cupid_link",
      targetId: "p1",
      secondTargetId: "p2",
    });
    expect(state.phase).toBe("DAY");
  });
});

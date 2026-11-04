import { describe, expect, it } from "vitest";
import { apply, toPlayerView } from "../src/index";
import { CLASSIC_EIGHT, living, mustApply, seatedState } from "./helpers";

function startNight() {
  let state = seatedState(["Ana", "Beto", "Ciro", "Dina", "Eva", "Fabi", "Galo", "Hana"], CLASSIC_EIGHT);
  state = mustApply(state, { type: "START_GAME" });
  return mustApply(state, { type: "ADVANCE_PHASE", to: "NIGHT" });
}

describe("night resolution", () => {
  it("lets wolves pick the most voted victim and hides that from villagers", () => {
    let state = startNight();
    const wolves = state.players.filter((player) => player.roleId === "werewolf");
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: wolves[0].id,
      abilityId: "werewolf_kill",
      targetId: "p3",
    });
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: wolves[1].id,
      abilityId: "werewolf_kill",
      targetId: "p3",
    });
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: "p6",
      abilityId: "cupid_link",
      targetId: "p1",
      secondTargetId: "p2",
    });
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "DAY" });
    expect(state.players.find((player) => player.id === "p3")?.alive).toBe(false);
    const villagerView = toPlayerView(state, "p8");
    expect(villagerView.you.proposedVictimId).toBeNull();
  });

  it("leaves no wolf victim on a tie", () => {
    let state = startNight();
    const wolves = state.players.filter((player) => player.roleId === "werewolf");
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: wolves[0].id,
      abilityId: "werewolf_kill",
      targetId: "p3",
    });
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: wolves[1].id,
      abilityId: "werewolf_kill",
      targetId: "p4",
    });
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: "p6",
      abilityId: "cupid_link",
      targetId: "p1",
      secondTargetId: "p2",
    });
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "DAY" });
    expect(state.players.filter((player) => !player.alive)).toHaveLength(0);
  });

  it("gives the seer a private alignment", () => {
    let state = startNight();
    const seer = living(state, "seer");
    const wolf = living(state, "werewolf");
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: seer.id,
      abilityId: "seer_investigate",
      targetId: wolf.id,
    });
    expect(state.players.find((player) => player.id === seer.id)?.investigation?.isWerewolf).toBe(true);
    const other = toPlayerView(state, wolf.id);
    expect(other.you.investigation).toBeNull();
  });

  it("lets the witch save the proposed victim", () => {
    let state = startNight();
    const wolves = state.players.filter((player) => player.roleId === "werewolf");
    for (const wolf of wolves) {
      state = mustApply(state, {
        type: "NIGHT_ACTION",
        actorId: wolf.id,
        abilityId: "werewolf_kill",
        targetId: "p3",
      });
    }
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: "p4",
      abilityId: "witch_heal",
      targetId: "p3",
    });
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: "p6",
      abilityId: "cupid_link",
      targetId: "p1",
      secondTargetId: "p2",
    });
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "DAY" });
    expect(state.players.find((player) => player.id === "p3")?.alive).toBe(true);
  });

  it("rejects protecting the same player two nights in a row", () => {
    let state = startNight();
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: "p8",
      abilityId: "protector_guard",
      targetId: "p3",
    });
    const wolves = state.players.filter((player) => player.roleId === "werewolf");
    for (const wolf of wolves) {
      state = mustApply(state, {
        type: "NIGHT_ACTION",
        actorId: wolf.id,
        abilityId: "werewolf_kill",
        targetId: "p4",
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
    for (const player of state.players.filter((item) => item.alive)) {
      state = mustApply(state, { type: "CAST_VOTE", voterId: player.id, targetId: null });
    }
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "VOTING_RESULTS" });
    state = mustApply(state, { type: "EXECUTE_RESULTS" });
    expect(state.phase).toBe("NIGHT");
    const result = apply(state, {
      type: "NIGHT_ACTION",
      actorId: "p8",
      abilityId: "protector_guard",
      targetId: "p3",
    });
    expect(result.ok).toBe(false);
  });

  it("links lovers and kills the pair together", () => {
    let state = startNight();
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: "p6",
      abilityId: "cupid_link",
      targetId: "p3",
      secondTargetId: "p4",
    });
    const wolves = state.players.filter((player) => player.roleId === "werewolf");
    for (const wolf of wolves) {
      state = mustApply(state, {
        type: "NIGHT_ACTION",
        actorId: wolf.id,
        abilityId: "werewolf_kill",
        targetId: "p3",
      });
    }
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "DAY" });
    expect(state.players.find((player) => player.id === "p3")?.alive).toBe(false);
    expect(state.players.find((player) => player.id === "p4")?.alive).toBe(false);
  });

  it("kills the little girl if the game master marks her discovered", () => {
    let state = startNight();
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: "p7",
      abilityId: "little_girl_peek",
    });
    state = mustApply(state, { type: "JUDGE_GIRL", discovered: true });
    const wolves = state.players.filter((player) => player.roleId === "werewolf");
    for (const wolf of wolves) {
      state = mustApply(state, {
        type: "NIGHT_ACTION",
        actorId: wolf.id,
        abilityId: "werewolf_kill",
        targetId: "p5",
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
    expect(state.players.find((player) => player.id === "p7")?.alive).toBe(false);
  });

  it("cancels an unjudged peek", () => {
    let state = startNight();
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: "p7",
      abilityId: "little_girl_peek",
    });
    const wolves = state.players.filter((player) => player.roleId === "werewolf");
    for (const wolf of wolves) {
      state = mustApply(state, {
        type: "NIGHT_ACTION",
        actorId: wolf.id,
        abilityId: "werewolf_kill",
        targetId: "p5",
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
    expect(state.players.find((player) => player.id === "p7")?.knownWerewolfIds).toEqual([]);
    expect(state.players.find((player) => player.id === "p7")?.alive).toBe(true);
  });

  it("lets the hunter shoot when eliminated", () => {
    let state = startNight();
    const wolves = state.players.filter((player) => player.roleId === "werewolf");
    for (const wolf of wolves) {
      state = mustApply(state, {
        type: "NIGHT_ACTION",
        actorId: wolf.id,
        abilityId: "werewolf_kill",
        targetId: "p5",
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
    expect(state.pendingHunterId).toBe("p5");
    state = mustApply(state, { type: "HUNTER_SHOOT", actorId: "p5", targetId: "p8" });
    expect(state.players.find((player) => player.id === "p8")?.alive).toBe(false);
  });

  it("gives villagers no night action", () => {
    const five = ["werewolf", "seer", "witch", "villager", "villager"] as const;
    let state = seatedState(["Ana", "Beto", "Ciro", "Dina", "Eva"], [...five]);
    state = mustApply(state, { type: "START_GAME" });
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "NIGHT" });
    const view = toPlayerView(state, "p4");
    expect(view.legalActions).toEqual([]);
  });
});

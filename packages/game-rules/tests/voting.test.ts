import { describe, expect, it } from "vitest";
import { apply, toGameMasterView, toPlayerView } from "../src/index";
import { CLASSIC_EIGHT, mustApply, seatedState } from "./helpers";

function discussionState() {
  let state = seatedState(["Ana", "Beto", "Ciro", "Dina", "Eva", "Fabi", "Galo", "Hana"], CLASSIC_EIGHT);
  state = mustApply(state, { type: "START_GAME" });
  state = mustApply(state, { type: "ADVANCE_PHASE", to: "NIGHT" });
  for (const wolf of state.players.filter((player) => player.roleId === "werewolf")) {
    state = mustApply(state, {
      type: "NIGHT_ACTION",
      actorId: wolf.id,
      abilityId: "werewolf_kill",
      targetId: "p8",
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
  return mustApply(state, { type: "ADVANCE_PHASE", to: "VOTING" });
}

describe("voting", () => {
  it("rejects a second vote when change is disabled", () => {
    let state = discussionState();
    state = mustApply(state, { type: "CAST_VOTE", voterId: "p1", targetId: "p3" });
    const again = apply(state, { type: "CAST_VOTE", voterId: "p1", targetId: "p4" });
    expect(again.ok).toBe(false);
  });

  it("keeps only the last vote when change is enabled", () => {
    let state = discussionState();
    state.voteChangeEnabled = true;
    state = mustApply(state, { type: "CAST_VOTE", voterId: "p1", targetId: "p3" });
    state = mustApply(state, { type: "CAST_VOTE", voterId: "p1", targetId: "p4" });
    expect(state.votes.find((vote) => vote.voterId === "p1")?.targetId).toBe("p4");
  });

  it("rejects votes from the dead", () => {
    const state = discussionState();
    const dead = state.players.find((player) => !player.alive);
    const result = apply(state, { type: "CAST_VOTE", voterId: dead!.id, targetId: "p1" });
    expect(result.ok).toBe(false);
  });

  it("eliminates nobody on a tie or abstention majority", () => {
    let state = discussionState();
    const living = state.players.filter((player) => player.alive);
    for (const player of living) {
      state = mustApply(state, { type: "CAST_VOTE", voterId: player.id, targetId: null });
    }
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "VOTING_RESULTS" });
    state = mustApply(state, { type: "EXECUTE_RESULTS" });
    expect(state.players.filter((player) => !player.alive && player.id !== "p8")).toHaveLength(0);
  });

  it("eliminates the unique leader and reveals that role", () => {
    let state = discussionState();
    const living = state.players.filter((player) => player.alive);
    for (const player of living) {
      state = mustApply(state, { type: "CAST_VOTE", voterId: player.id, targetId: "p3" });
    }
    state = mustApply(state, { type: "ADVANCE_PHASE", to: "VOTING_RESULTS" });
    state = mustApply(state, { type: "EXECUTE_RESULTS" });
    expect(state.players.find((player) => player.id === "p3")?.alive).toBe(false);
    const view = toPlayerView(state, "p1");
    expect(view.players.find((player) => player.id === "p3")?.revealedRoleId).toBe("seer");
  });

  it("hides vote direction from the game master until reveal", () => {
    let state = discussionState();
    state = mustApply(state, { type: "CAST_VOTE", voterId: "p1", targetId: "p3" });
    const gm = toGameMasterView(state);
    expect(gm.voting?.confirmedCount).toBe(1);
    expect(gm.voting?.tally).toBeUndefined();
  });
});

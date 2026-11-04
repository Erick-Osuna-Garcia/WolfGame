import { describe, expect, it } from "vitest";
import { toGameMasterView, toPlayerView } from "../src/index";
import { CLASSIC_EIGHT, mustApply, seatedState } from "./helpers";

describe("projections", () => {
  it("never includes another player's hidden role in a player view", () => {
    let state = seatedState(["Ana", "Beto", "Ciro", "Dina", "Eva", "Fabi", "Galo", "Hana"], CLASSIC_EIGHT);
    state = mustApply(state, { type: "START_GAME" });
    const view = toPlayerView(state, "p1");
    expect(view.you.role?.id).toBe("werewolf");
    expect(view.players.every((player) => player.revealedRoleId === undefined)).toBe(true);
    expect(JSON.stringify(view)).not.toContain("seer");
  });

  it("shows every role to the game master", () => {
    let state = seatedState(["Ana", "Beto", "Ciro", "Dina", "Eva", "Fabi", "Galo", "Hana"], CLASSIC_EIGHT);
    state = mustApply(state, { type: "START_GAME" });
    const view = toGameMasterView(state);
    expect(view.players.map((player) => player.roleId)).toEqual(CLASSIC_EIGHT);
  });
});

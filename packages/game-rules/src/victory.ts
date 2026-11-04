import type { Winner } from "@werewolf/shared";
import { livingPlayers } from "./state";
import type { GameState } from "./types";

export function evaluateWinner(state: GameState): Winner | null {
  const living = livingPlayers(state);
  if (living.length === 0) {
    return "VILLAGE";
  }

  if (
    living.length === 2 &&
    living[0].loverId === living[1].id &&
    living[1].loverId === living[0].id
  ) {
    return "LOVERS";
  }

  const wolves = living.filter((player) => player.roleId === "werewolf");
  if (wolves.length === 0) {
    return "VILLAGE";
  }
  if (wolves.length >= living.length - wolves.length) {
    return "WEREWOLF";
  }
  return null;
}

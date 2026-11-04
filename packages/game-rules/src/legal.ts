import type { LegalAction } from "@werewolf/shared";
import { findPlayer } from "./state";
import type { GameState } from "./types";

export function legalActionsFor(state: GameState, playerId: string): LegalAction[] {
  const player = findPlayer(state, playerId);
  if (!player || !player.alive || !player.roleId) {
    if (state.pendingHunterId === playerId) {
      return [{ abilityId: "hunter_shoot", label: "Disparar", requiresTarget: true }];
    }
    return [];
  }

  if (state.pendingHunterId === playerId) {
    return [{ abilityId: "hunter_shoot", label: "Disparar", requiresTarget: true }];
  }

  if (state.phase === "VOTING") {
    const already = state.votes.some((vote) => vote.voterId === playerId);
    if (already && !state.voteChangeEnabled) return [];
    return [
      { abilityId: "vote", label: "Votar", requiresTarget: true },
      { abilityId: "abstain", label: "Abstenerse", requiresTarget: false },
    ];
  }

  if (state.phase !== "NIGHT") return [];

  switch (player.roleId) {
    case "werewolf":
      if (state.nightActions.some((action) => action.actorId === playerId && action.abilityId === "werewolf_kill")) {
        return [];
      }
      return [{ abilityId: "werewolf_kill", label: "Elegir víctima", requiresTarget: true }];
    case "seer":
      if (state.nightActions.some((action) => action.actorId === playerId && action.abilityId === "seer_investigate")) {
        return [];
      }
      return [{ abilityId: "seer_investigate", label: "Investigar", requiresTarget: true }];
    case "witch": {
      const used = state.nightActions.some(
        (action) =>
          action.actorId === playerId &&
          (action.abilityId === "witch_heal" ||
            action.abilityId === "witch_poison" ||
            action.abilityId === "witch_pass"),
      );
      if (used) return [];
      const actions: LegalAction[] = [];
      if (!player.witchHealUsed) {
        actions.push({ abilityId: "witch_heal", label: "Curar", requiresTarget: true });
      }
      if (!player.witchPoisonUsed) {
        actions.push({ abilityId: "witch_poison", label: "Envenenar", requiresTarget: true });
      }
      actions.push({ abilityId: "witch_pass", label: "Pasar", requiresTarget: false });
      return actions;
    }
    case "protector":
      if (state.nightActions.some((action) => action.actorId === playerId && action.abilityId === "protector_guard")) {
        return [];
      }
      return [{ abilityId: "protector_guard", label: "Proteger", requiresTarget: true }];
    case "cupid":
      if (state.round !== 1 || player.cupidLinked) return [];
      return [{ abilityId: "cupid_link", label: "Enlazar", requiresTarget: true, extra: "secondTarget" }];
    case "little_girl":
      if (state.nightActions.some((action) => action.actorId === playerId && action.abilityId === "little_girl_peek")) {
        return [];
      }
      return [{ abilityId: "little_girl_peek", label: "Mirar a los lobos", requiresTarget: false }];
    default:
      return [];
  }
}

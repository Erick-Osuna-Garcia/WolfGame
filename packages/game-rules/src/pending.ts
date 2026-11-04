import type { PendingAction } from "@werewolf/shared";
import type { GameState } from "./types";

export function pendingNightActions(state: GameState): PendingAction[] {
  const wolves = state.players.filter((player) => player.alive && player.roleId === "werewolf");
  const cupid = state.players.find((player) => player.alive && player.roleId === "cupid");
  const seer = state.players.find((player) => player.alive && player.roleId === "seer");
  const witch = state.players.find((player) => player.alive && player.roleId === "witch");
  const protector = state.players.find((player) => player.alive && player.roleId === "protector");
  const girl = state.players.find((player) => player.alive && player.roleId === "little_girl");

  const done = (actorId: string, abilityPrefix: string) =>
    state.nightActions.some((action) => action.actorId === actorId && action.abilityId.startsWith(abilityPrefix));

  const actions: PendingAction[] = [];

  if (wolves.length > 0) {
    const pendingWolves = wolves.filter((wolf) => !done(wolf.id, "werewolf_kill"));
    actions.push({
      key: "werewolf_kill",
      label: "Hombre lobo selecciona víctima",
      status: pendingWolves.length === 0 ? "completed" : "pending",
      actorIds: pendingWolves.map((wolf) => wolf.id),
    });
  }

  if (cupid && state.round === 1) {
    actions.push({
      key: "cupid_link",
      label: "Cupido enlaza",
      status: done(cupid.id, "cupid_link") ? "completed" : "pending",
      actorIds: done(cupid.id, "cupid_link") ? [] : [cupid.id],
    });
  }

  if (seer) {
    actions.push({
      key: "seer_investigate",
      label: "Vidente investiga",
      status: done(seer.id, "seer_investigate") ? "completed" : "pending",
      actorIds: done(seer.id, "seer_investigate") ? [] : [seer.id],
    });
  }

  if (witch) {
    const witchDone = state.nightActions.some(
      (action) =>
        action.actorId === witch.id &&
        (action.abilityId === "witch_heal" ||
          action.abilityId === "witch_poison" ||
          action.abilityId === "witch_pass"),
    );
    actions.push({
      key: "witch",
      label: "Bruja utiliza habilidad",
      status: witchDone ? "completed" : "pending",
      actorIds: witchDone ? [] : [witch.id],
    });
  }

  if (protector) {
    actions.push({
      key: "protector_guard",
      label: "Protector selecciona objetivo",
      status: done(protector.id, "protector_guard") ? "completed" : "pending",
      actorIds: done(protector.id, "protector_guard") ? [] : [protector.id],
    });
  }

  if (girl) {
    actions.push({
      key: "little_girl_peek",
      label: "Niña pide mirar",
      status: done(girl.id, "little_girl_peek") ? "completed" : "pending",
      actorIds: done(girl.id, "little_girl_peek") ? [] : [girl.id],
    });
  }

  return actions;
}

export function mandatoryNightComplete(state: GameState): boolean {
  const wolves = state.players.filter((player) => player.alive && player.roleId === "werewolf");
  const wolvesDone = wolves.every((wolf) =>
    state.nightActions.some((action) => action.actorId === wolf.id && action.abilityId === "werewolf_kill"),
  );
  const cupid = state.players.find((player) => player.alive && player.roleId === "cupid");
  const cupidDone =
    !cupid ||
    state.round !== 1 ||
    state.nightActions.some((action) => action.actorId === cupid.id && action.abilityId === "cupid_link");
  return wolvesDone && cupidDone;
}

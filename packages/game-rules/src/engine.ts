import type { AbilityId, GamePhase, RoleId } from "@werewolf/shared";
import { mandatoryNightComplete } from "./pending";
import { countVotes } from "./projections";
import { shuffleRoles } from "./composition";
import { appendEvent, cloneState, findPlayer, livingPlayers } from "./state";
import type { Command, EngineResult, GameState, NightAction, PlayerState } from "./types";
import { evaluateWinner } from "./victory";

const TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  LOBBY: ["ROLE_REVEAL"],
  ROLE_REVEAL: ["NIGHT"],
  NIGHT: ["DAY"],
  DAY: ["DISCUSSION"],
  DISCUSSION: ["VOTING"],
  VOTING: ["VOTING_RESULTS"],
  VOTING_RESULTS: ["NIGHT", "GAME_OVER"],
  GAME_OVER: [],
};

function fail(code: string, message: string): EngineResult {
  return { ok: false, error: { code, message } };
}

function ok(state: GameState): EngineResult {
  return { ok: true, state };
}

export function apply(state: GameState, command: Command): EngineResult {
  const next = cloneState(state);
  switch (command.type) {
    case "ASSIGN_ROLES":
      return assignRoles(next, command.roles);
    case "CORRECT_ROLE":
      return correctRole(next, command.playerId, command.roleId);
    case "START_GAME":
      return startGame(next);
    case "ADVANCE_PHASE":
      return advancePhase(next, command.to);
    case "NIGHT_ACTION":
      return nightAction(next, command);
    case "JUDGE_GIRL":
      return judgeGirl(next, command.discovered);
    case "CAST_VOTE":
      return castVote(next, command.voterId, command.targetId);
    case "EXECUTE_RESULTS":
      return executeResults(next);
    case "HUNTER_SHOOT":
      return hunterShoot(next, command.actorId, command.targetId);
    case "CLOSE_ROOM":
      next.status = "CLOSED";
      next.phase = next.phase === "LOBBY" ? "LOBBY" : next.winner ? "GAME_OVER" : next.phase;
      appendEvent(next, "room_closed", {});
      return ok(next);
    case "SET_PACE":
      next.paceMode = command.paceMode;
      return ok(next);
    default:
      return fail("UNKNOWN", "Acción no reconocida");
  }
}

function assignRoles(state: GameState, roles: RoleId[]): EngineResult {
  if (state.phase !== "LOBBY") {
    return fail("WRONG_PHASE", "Solo puedes asignar roles en la sala de espera");
  }
  if (roles.length !== state.players.length) {
    const delta = roles.length - state.players.length;
    return fail(
      "ROLE_COUNT",
      delta > 0 ? `Sobran ${delta} roles` : `Faltan ${Math.abs(delta)} roles`,
    );
  }
  const shuffled = shuffleRoles(roles);
  state.roleDraft = shuffled;
  state.players.forEach((player, index) => {
    player.roleId = shuffled[index] ?? null;
  });
  appendEvent(state, "roles_assigned", { count: roles.length }, "GAME_MASTER");
  return ok(state);
}

function correctRole(state: GameState, playerId: string, roleId: RoleId): EngineResult {
  if (state.phase !== "LOBBY") {
    return fail("WRONG_PHASE", "Solo puedes corregir roles antes de empezar");
  }
  const player = findPlayer(state, playerId);
  if (!player) return fail("NOT_FOUND", "Jugador no encontrado");
  player.roleId = roleId;
  state.roleDraft = state.players.map((item) => item.roleId).filter((item): item is RoleId => item !== null);
  appendEvent(state, "role_corrected", { playerId, roleId }, "GAME_MASTER");
  return ok(state);
}

function startGame(state: GameState): EngineResult {
  if (state.phase !== "LOBBY") {
    return fail("WRONG_PHASE", "La partida ya empezó");
  }
  if (state.players.length === 0) {
    return fail("NO_PLAYERS", "No hay jugadores sentados");
  }
  if (state.players.some((player) => !player.roleId)) {
    return fail("ROLE_COUNT", "Cada jugador sentado necesita un rol");
  }
  state.phase = "ROLE_REVEAL";
  state.status = "IN_PROGRESS";
  appendEvent(state, "game_started", {});
  return ok(state);
}

function advancePhase(state: GameState, to: GamePhase): EngineResult {
  if (!TRANSITIONS[state.phase].includes(to)) {
    return fail("ILLEGAL_TRANSITION", `No puedes pasar de ${state.phase} a ${to}`);
  }
  if (to === "NIGHT" && state.phase !== "ROLE_REVEAL" && !mandatoryNightComplete(state) && state.phase === "NIGHT") {
    return fail("PENDING_ACTIONS", "Todavía hay acciones obligatorias sin procesar");
  }
  if (state.phase === "NIGHT" && to === "DAY") {
    resolveDawn(state);
  }
  if (to === "NIGHT") {
    beginNight(state);
  }
  if (to === "DISCUSSION") {
    state.timerEndsAt = Date.now() + state.discussionSeconds * 1000;
  }
  if (to === "VOTING") {
    state.votes = [];
    state.votingResultsRevealed = false;
    state.timerEndsAt = Date.now() + state.votingSeconds * 1000;
    appendEvent(state, "voting_started", {});
  }
  if (to === "VOTING_RESULTS") {
    if (state.revealPolicy === "IMMEDIATE") {
      state.votingResultsRevealed = true;
    }
    appendEvent(state, "voting_closed", { confirmed: state.votes.length });
  }
  state.phase = to;
  if (to !== "VOTING" && to !== "DISCUSSION") {
    if (to !== "DAY") state.timerEndsAt = null;
  }
  appendEvent(state, "phase_changed", { phase: to, round: state.round });
  return ok(state);
}

function beginNight(state: GameState): void {
  state.round += 1;
  state.nightActions = [];
  state.votes = [];
  state.proposedVictimId = null;
  state.votingResultsRevealed = false;
  state.publicDeaths = [];
  for (const player of state.players) {
    player.littleGirlPeeked = false;
    player.littleGirlDiscovered = null;
  }
  appendEvent(state, "night_started", { round: state.round });
}

function nightAction(
  state: GameState,
  command: Extract<Command, { type: "NIGHT_ACTION" }>,
): EngineResult {
  if (state.phase !== "NIGHT") {
    return fail("WRONG_PHASE", "Solo puedes usar esta habilidad de noche");
  }
  const actor = findPlayer(state, command.actorId);
  if (!actor || !actor.alive) {
    return fail("ELIMINATED", "Un jugador eliminado no puede actuar");
  }
  const allowed = allowedAbility(actor, command.abilityId, state);
  if (!allowed) {
    return fail("WRONG_ABILITY", "Esa habilidad no corresponde a tu rol o a esta fase");
  }
  if (command.targetId) {
    const target = findPlayer(state, command.targetId);
    if (!target || !target.alive) {
      return fail("DEAD_TARGET", "No puedes elegir a un eliminado");
    }
  }
  if (command.abilityId === "cupid_link") {
    if (state.round !== 1) return fail("WRONG_NIGHT", "Cupido solo enlaza la primera noche");
    if (!command.targetId || !command.secondTargetId || command.targetId === command.secondTargetId) {
      return fail("INVALID_LINK", "Cupido debe enlazar a dos jugadores distintos");
    }
    const second = findPlayer(state, command.secondTargetId);
    if (!second || !second.alive) return fail("DEAD_TARGET", "No puedes elegir a un eliminado");
    const first = findPlayer(state, command.targetId)!;
    first.loverId = second.id;
    second.loverId = first.id;
    actor.cupidLinked = true;
    appendEvent(state, "cupid_linked", { a: first.id, b: second.id }, "GAME_MASTER");
    appendEvent(state, "you_were_linked", { loverId: second.id }, { playerId: first.id });
    appendEvent(state, "you_were_linked", { loverId: first.id }, { playerId: second.id });
  }
  if (command.abilityId === "protector_guard") {
    if (actor.lastProtectedTargetId && actor.lastProtectedTargetId === command.targetId) {
      return fail("REPEAT_PROTECT", "No puedes proteger al mismo jugador dos noches seguidas");
    }
  }
  if (command.abilityId === "seer_investigate" && command.targetId) {
    const target = findPlayer(state, command.targetId)!;
    actor.investigation = {
      targetId: target.id,
      isWerewolf: target.roleId === "werewolf",
      night: state.round,
    };
    appendEvent(
      state,
      "investigation_done",
      { targetId: target.id, isWerewolf: target.roleId === "werewolf" },
      { playerId: actor.id },
    );
    appendEvent(state, "seer_investigated", {}, "GAME_MASTER");
  }
  if (command.abilityId === "witch_heal") {
    if (actor.witchHealUsed) return fail("POTION_GONE", "La poción de curación ya se usó");
  }
  if (command.abilityId === "witch_poison") {
    if (actor.witchPoisonUsed) return fail("POTION_GONE", "La poción de veneno ya se usó");
  }
  if (command.abilityId === "little_girl_peek") {
    actor.littleGirlPeeked = true;
  }

  state.nightActions = state.nightActions.filter((action) => {
    if (action.actorId !== command.actorId) return true;
    if (command.abilityId.startsWith("witch_")) {
      return !action.abilityId.startsWith("witch_");
    }
    return action.abilityId !== command.abilityId;
  });
  state.nightActions.push({
    actorId: command.actorId,
    abilityId: command.abilityId,
    targetId: command.targetId ?? null,
    secondTargetId: command.secondTargetId,
  });

  if (command.abilityId === "werewolf_kill") {
    refreshProposedVictim(state);
    appendEvent(state, "wolves_chose", {}, "GAME_MASTER");
  }

  if (state.paceMode === "ASSISTED" && mandatoryNightComplete(state)) {
    resolveDawn(state);
    state.phase = "DAY";
    appendEvent(state, "phase_changed", { phase: "DAY", round: state.round });
  }
  return ok(state);
}

function allowedAbility(actor: PlayerState, abilityId: AbilityId, state: GameState): boolean {
  const map: Record<string, AbilityId[]> = {
    werewolf: ["werewolf_kill"],
    seer: ["seer_investigate"],
    witch: ["witch_heal", "witch_poison", "witch_pass"],
    protector: ["protector_guard"],
    cupid: ["cupid_link"],
    little_girl: ["little_girl_peek"],
    hunter: ["hunter_shoot"],
    villager: [],
  };
  if (actor.roleId && map[actor.roleId]?.includes(abilityId)) {
    if (abilityId === "cupid_link") return state.round === 1 && !actor.cupidLinked;
    return true;
  }
  return false;
}

function refreshProposedVictim(state: GameState): void {
  const votes = state.nightActions.filter((action) => action.abilityId === "werewolf_kill");
  const counts = new Map<string, number>();
  for (const vote of votes) {
    if (!vote.targetId) continue;
    counts.set(vote.targetId, (counts.get(vote.targetId) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  if (ranked.length === 0 || (ranked[1] && ranked[0][1] === ranked[1][1])) {
    state.proposedVictimId = null;
    return;
  }
  state.proposedVictimId = ranked[0][0];
}

function judgeGirl(state: GameState, discovered: boolean): EngineResult {
  const girl = state.players.find((player) => player.roleId === "little_girl" && player.alive);
  if (!girl || !girl.littleGirlPeeked) {
    return fail("NO_PEEK", "La niña no pidió mirar");
  }
  girl.littleGirlDiscovered = discovered;
  appendEvent(state, "girl_judged", { discovered }, "GAME_MASTER");
  return ok(state);
}

function castVote(state: GameState, voterId: string, targetId: string | null): EngineResult {
  if (state.phase !== "VOTING") {
    return fail("ILLEGAL_TRANSITION", "No hay una votación activa");
  }
  const voter = findPlayer(state, voterId);
  if (!voter || !voter.alive) {
    return fail("ELIMINATED", "Un jugador eliminado no puede votar");
  }
  if (targetId) {
    const target = findPlayer(state, targetId);
    if (!target || !target.alive) return fail("DEAD_TARGET", "No puedes votar a un eliminado");
  }
  const existing = state.votes.find((vote) => vote.voterId === voterId);
  if (existing && !state.voteChangeEnabled) {
    return fail("ALREADY_VOTED", "Tu voto ya está bloqueado");
  }
  if (existing) existing.targetId = targetId;
  else state.votes.push({ voterId, targetId });
  appendEvent(state, "vote_cast", { voterId }, "GAME_MASTER");
  return ok(state);
}

function executeResults(state: GameState): EngineResult {
  if (state.phase !== "VOTING_RESULTS") {
    return fail("WRONG_PHASE", "No hay un resultado listo para ejecutar");
  }
  state.votingResultsRevealed = true;
  const tally = countVotes(state);
  const living = livingPlayers(state);
  const abstentions = tally.find((row) => row.targetId === null)?.votes ?? 0;
  const named = tally.filter((row) => row.targetId !== null);
  const leader = named[0];
  const tied = Boolean(leader && named[1] && named[1].votes === leader.votes);
  const majorityAbstain = abstentions > living.length / 2;
  if (!leader || tied || majorityAbstain) {
    appendEvent(state, "vote_no_elimination", {});
  } else {
    eliminate(state, leader.targetId!, "voto del pueblo");
  }
  appendEvent(state, "results_executed", { tally }, "GAME_MASTER");
  if (state.pendingHunterId) return ok(state);
  return finishCycle(state);
}

function hunterShoot(state: GameState, actorId: string, targetId: string | null): EngineResult {
  if (state.pendingHunterId !== actorId) {
    return fail("WRONG_ABILITY", "Ahora no te toca disparar");
  }
  if (targetId) {
    const target = findPlayer(state, targetId);
    if (!target || !target.alive) return fail("DEAD_TARGET", "No puedes elegir a un eliminado");
    eliminate(state, targetId, "disparo del cazador");
  }
  state.pendingHunterId = null;
  state.hunterTimerEndsAt = null;
  if (state.phase === "VOTING_RESULTS") return finishCycle(state);
  const winner = evaluateWinner(state);
  if (winner) {
    state.winner = winner;
    state.phase = "GAME_OVER";
    appendEvent(state, "game_over", { winner });
  }
  return ok(state);
}

function finishCycle(state: GameState): EngineResult {
  const winner = evaluateWinner(state);
  if (winner) {
    state.winner = winner;
    state.phase = "GAME_OVER";
    appendEvent(state, "game_over", { winner });
    return ok(state);
  }
  beginNight(state);
  state.phase = "NIGHT";
  appendEvent(state, "phase_changed", { phase: "NIGHT", round: state.round });
  return ok(state);
}

function resolveDawn(state: GameState): void {
  refreshProposedVictim(state);
  const protectedId = lastAction(state, "protector_guard")?.targetId ?? null;
  const heal = lastAction(state, "witch_heal");
  const poison = lastAction(state, "witch_poison");
  const girl = state.players.find((player) => player.roleId === "little_girl");

  if (heal) {
    const witch = findPlayer(state, heal.actorId);
    if (witch) witch.witchHealUsed = true;
  }
  if (poison) {
    const witch = findPlayer(state, poison.actorId);
    if (witch) witch.witchPoisonUsed = true;
  }

  const wolfVictim = state.proposedVictimId;
  const saved = Boolean(
    wolfVictim && (wolfVictim === protectedId || (heal && heal.targetId === wolfVictim)),
  );
  const deaths = new Set<string>();
  if (wolfVictim && !saved) deaths.add(wolfVictim);
  if (poison?.targetId) deaths.add(poison.targetId);

  if (girl?.littleGirlPeeked) {
    if (girl.littleGirlDiscovered === true) {
      deaths.add(girl.id);
    } else if (girl.littleGirlDiscovered === false) {
      girl.knownWerewolfIds = state.players
        .filter((player) => player.roleId === "werewolf")
        .map((player) => player.id);
      appendEvent(state, "girl_saw_wolves", { ids: girl.knownWerewolfIds }, { playerId: girl.id });
    } else {
      girl.knownWerewolfIds = [];
    }
  }

  const protector = state.players.find((player) => player.roleId === "protector");
  if (protector) {
    protector.lastProtectedTargetId = protectedId;
  }

  for (const playerId of deaths) {
    eliminate(state, playerId, playerId === wolfVictim && !saved ? "ataque de los lobos" : "noche");
  }
  appendEvent(state, "night_ended", { round: state.round });
}

function lastAction(state: GameState, abilityId: AbilityId): NightAction | undefined {
  return [...state.nightActions].reverse().find((action) => action.abilityId === abilityId);
}

function eliminate(state: GameState, playerId: string, cause: string): void {
  const player = findPlayer(state, playerId);
  if (!player || !player.alive || !player.roleId) return;
  player.alive = false;
  state.publicDeaths.push({ playerId, roleId: player.roleId, cause });
  appendEvent(state, "player_eliminated", { playerId, roleId: player.roleId, cause });
  if (player.loverId) {
    const lover = findPlayer(state, player.loverId);
    if (lover?.alive) {
      eliminate(state, lover.id, "enlace de Cupido");
    }
  }
  if (player.roleId === "hunter") {
    state.pendingHunterId = player.id;
    state.hunterTimerEndsAt = Date.now() + state.hunterSeconds * 1000;
  }
}

export function expireHunter(state: GameState): GameState {
  const next = cloneState(state);
  if (!next.pendingHunterId) return next;
  next.pendingHunterId = null;
  next.hunterTimerEndsAt = null;
  if (next.phase === "VOTING_RESULTS") {
    const result = finishCycle(next);
    return result.ok ? result.state : next;
  }
  return next;
}

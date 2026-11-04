import type { RoleId } from "@werewolf/shared";
import {
  apply,
  createEmptyState,
  type Command,
  type GameState,
  type PlayerState,
} from "../src/index";

export function seatedState(names: string[], roles?: RoleId[]): GameState {
  const state = createEmptyState({
    roomId: "room-1",
    code: "ABC234",
    gameMasterId: "gm",
  });
  state.players = names.map((name, index) => ({
    id: `p${index + 1}`,
    name,
    roleId: roles?.[index] ?? null,
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
  }));
  return state;
}

export function mustApply(state: GameState, command: Command): GameState {
  const result = apply(state, command);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.state;
}

export function living(state: GameState, roleId: RoleId): PlayerState {
  const player = state.players.find((item) => item.roleId === roleId && item.alive);
  if (!player) throw new Error(`missing living ${roleId}`);
  return player;
}

export const CLASSIC_EIGHT: RoleId[] = [
  "werewolf",
  "werewolf",
  "seer",
  "witch",
  "hunter",
  "cupid",
  "little_girl",
  "protector",
];

import {
  DEFAULT_DISCUSSION_SECONDS,
  DEFAULT_HUNTER_SECONDS,
  DEFAULT_VOTING_SECONDS,
} from "@werewolf/shared";
import type { GameState, PlayerState } from "./types";

export function createEmptyState(input: {
  roomId: string;
  code: string;
  gameMasterId: string;
}): GameState {
  return {
    roomId: input.roomId,
    code: input.code,
    phase: "LOBBY",
    round: 0,
    status: "OPEN",
    paceMode: "MANUAL",
    voteChangeEnabled: false,
    revealPolicy: "ON_PROCESS",
    discussionSeconds: DEFAULT_DISCUSSION_SECONDS,
    votingSeconds: DEFAULT_VOTING_SECONDS,
    hunterSeconds: DEFAULT_HUNTER_SECONDS,
    timerEndsAt: null,
    hunterTimerEndsAt: null,
    players: [],
    gameMasterId: input.gameMasterId,
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

export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

export function findPlayer(state: GameState, playerId: string): PlayerState | undefined {
  return state.players.find((player) => player.id === playerId);
}

export function livingPlayers(state: GameState): PlayerState[] {
  return state.players.filter((player) => player.alive);
}

export function appendEvent(
  state: GameState,
  type: string,
  payload: Record<string, unknown>,
  visibility: GameState["events"][number]["visibility"] = "ALL",
): void {
  state.events.push({
    seq: state.events.length + 1,
    type,
    at: new Date().toISOString(),
    payload,
    visibility,
  });
}

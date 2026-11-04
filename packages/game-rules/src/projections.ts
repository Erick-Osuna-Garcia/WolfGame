import type { GameMasterView, PlayerView } from "@werewolf/shared";
import { getRole } from "./catalog";
import { legalActionsFor } from "./legal";
import { pendingNightActions } from "./pending";
import { findPlayer } from "./state";
import type { GameState } from "./types";

function publicPlayers(state: GameState) {
  return state.players.map((player) => ({
    id: player.id,
    name: player.name,
    alive: player.alive,
    connected: player.connected,
    revealedRoleId: player.alive ? undefined : player.roleId ?? undefined,
  }));
}

function visibleEvents(state: GameState, playerId?: string) {
  return state.events.filter((event) => {
    if (event.visibility === "ALL") return true;
    if (event.visibility === "GAME_MASTER") return playerId === undefined;
    return playerId !== undefined && event.visibility.playerId === playerId;
  });
}

export function toPlayerView(state: GameState, playerId: string): PlayerView {
  const you = findPlayer(state, playerId);
  const alreadyVoted = state.votes.some((vote) => vote.voterId === playerId);
  return {
    kind: "PLAYER",
    roomCode: state.code,
    phase: state.phase,
    round: state.round,
    status: state.status,
    timerEndsAt: state.timerEndsAt,
    hunterTimerEndsAt: state.pendingHunterId === playerId ? state.hunterTimerEndsAt : null,
    you: {
      id: playerId,
      name: you?.name ?? "",
      role: you?.roleId ? getRole(you.roleId) : null,
      alive: you?.alive ?? false,
      loverId: you?.loverId ?? null,
      investigation: you?.investigation ?? null,
      knownWerewolfIds: you?.knownWerewolfIds ?? [],
      witchHealUsed: you?.witchHealUsed ?? false,
      witchPoisonUsed: you?.witchPoisonUsed ?? false,
      proposedVictimId: you?.roleId === "witch" ? state.proposedVictimId : null,
    },
    players: publicPlayers(state),
    legalActions: legalActionsFor(state, playerId),
    publicEvents: visibleEvents(state, playerId),
    publicDeaths: state.publicDeaths,
    winner: state.winner,
    voting:
      state.phase === "VOTING" || state.phase === "VOTING_RESULTS"
        ? {
            hasVoted: alreadyVoted,
            canChange: state.voteChangeEnabled && state.phase === "VOTING",
            confirmedCount: state.votes.length,
            livingCount: state.players.filter((player) => player.alive).length,
          }
        : null,
  };
}

export function toGameMasterView(state: GameState): GameMasterView {
  const livingCount = state.players.filter((player) => player.alive).length;
  const tally =
    state.votingResultsRevealed || state.revealPolicy === "IMMEDIATE" && state.phase === "VOTING_RESULTS"
      ? countVotes(state)
      : undefined;

  return {
    kind: "GAME_MASTER",
    roomCode: state.code,
    qrPath: `/join?code=${state.code}`,
    phase: state.phase,
    round: state.round,
    status: state.status,
    paceMode: state.paceMode,
    voteChangeEnabled: state.voteChangeEnabled,
    revealPolicy: state.revealPolicy,
    discussionSeconds: state.discussionSeconds,
    votingSeconds: state.votingSeconds,
    hunterSeconds: state.hunterSeconds,
    timerEndsAt: state.timerEndsAt,
    hunterTimerEndsAt: state.hunterTimerEndsAt,
    connectedCount: state.players.filter((player) => player.connected).length,
    playerCount: state.players.length,
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      roleId: player.roleId,
      alive: player.alive,
      connected: player.connected,
    })),
    roleDraft: state.roleDraft,
    pendingActions: state.phase === "NIGHT" ? pendingNightActions(state) : [],
    events: state.events,
    voting:
      state.phase === "VOTING" || state.phase === "VOTING_RESULTS"
        ? {
            confirmedCount: state.votes.length,
            livingCount,
            tally,
          }
        : null,
    publicDeaths: state.publicDeaths,
    winner: state.winner,
  };
}

export function countVotes(state: GameState): { targetId: string | null; votes: number }[] {
  const counts = new Map<string | null, number>();
  for (const vote of state.votes) {
    counts.set(vote.targetId, (counts.get(vote.targetId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([targetId, votes]) => ({ targetId, votes }))
    .sort((left, right) => right.votes - left.votes);
}

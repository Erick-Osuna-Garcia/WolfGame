import type {
  AbilityId,
  GameEvent,
  GamePhase,
  PaceMode,
  RevealPolicy,
  RoleId,
  RoomStatus,
  Winner,
} from "@werewolf/shared";

export type PlayerState = {
  id: string;
  name: string;
  roleId: RoleId | null;
  alive: boolean;
  connected: boolean;
  lastProtectedTargetId: string | null;
  witchHealUsed: boolean;
  witchPoisonUsed: boolean;
  cupidLinked: boolean;
  littleGirlPeeked: boolean;
  littleGirlDiscovered: boolean | null;
  knownWerewolfIds: string[];
  investigation: { targetId: string; isWerewolf: boolean; night: number } | null;
  loverId: string | null;
};

export type NightAction = {
  actorId: string;
  abilityId: AbilityId;
  targetId: string | null;
  secondTargetId?: string | null;
};

export type VoteRecord = {
  voterId: string;
  targetId: string | null;
};

export type GameState = {
  roomId: string;
  code: string;
  phase: GamePhase;
  round: number;
  status: RoomStatus;
  paceMode: PaceMode;
  voteChangeEnabled: boolean;
  revealPolicy: RevealPolicy;
  discussionSeconds: number;
  votingSeconds: number;
  hunterSeconds: number;
  timerEndsAt: number | null;
  hunterTimerEndsAt: number | null;
  players: PlayerState[];
  gameMasterId: string;
  roleDraft: RoleId[] | null;
  nightActions: NightAction[];
  votes: VoteRecord[];
  events: GameEvent[];
  winner: Winner | null;
  pendingHunterId: string | null;
  proposedVictimId: string | null;
  publicDeaths: { playerId: string; roleId: RoleId; cause: string }[];
  votingResultsRevealed: boolean;
};

export type Command =
  | { type: "ASSIGN_ROLES"; roles: RoleId[] }
  | { type: "CORRECT_ROLE"; playerId: string; roleId: RoleId }
  | { type: "START_GAME" }
  | { type: "ADVANCE_PHASE"; to: GamePhase }
  | {
      type: "NIGHT_ACTION";
      actorId: string;
      abilityId: AbilityId;
      targetId?: string | null;
      secondTargetId?: string | null;
    }
  | { type: "JUDGE_GIRL"; discovered: boolean }
  | { type: "CAST_VOTE"; voterId: string; targetId: string | null }
  | { type: "EXECUTE_RESULTS" }
  | { type: "HUNTER_SHOOT"; actorId: string; targetId: string | null }
  | { type: "CLOSE_ROOM" }
  | { type: "SET_PACE"; paceMode: PaceMode };

export type EngineError = {
  code: string;
  message: string;
};

export type EngineResult =
  | { ok: true; state: GameState }
  | { ok: false; error: EngineError };

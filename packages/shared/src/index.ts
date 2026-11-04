export const GAME_PHASES = [
  "LOBBY",
  "ROLE_REVEAL",
  "NIGHT",
  "DAY",
  "DISCUSSION",
  "VOTING",
  "VOTING_RESULTS",
  "GAME_OVER",
] as const;

export type GamePhase = (typeof GAME_PHASES)[number];

export const TEAMS = ["VILLAGE", "WEREWOLF", "NEUTRAL"] as const;
export type Team = (typeof TEAMS)[number];

export const ROLE_IDS = [
  "villager",
  "werewolf",
  "seer",
  "witch",
  "hunter",
  "cupid",
  "little_girl",
  "protector",
] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export const ABILITY_IDS = [
  "werewolf_kill",
  "seer_investigate",
  "witch_heal",
  "witch_poison",
  "witch_pass",
  "protector_guard",
  "cupid_link",
  "little_girl_peek",
  "hunter_shoot",
] as const;
export type AbilityId = (typeof ABILITY_IDS)[number];

export const PACE_MODES = ["MANUAL", "ASSISTED"] as const;
export type PaceMode = (typeof PACE_MODES)[number];

export const REVEAL_POLICIES = ["ON_PROCESS", "IMMEDIATE"] as const;
export type RevealPolicy = (typeof REVEAL_POLICIES)[number];

export const WINNERS = ["VILLAGE", "WEREWOLF", "LOVERS"] as const;
export type Winner = (typeof WINNERS)[number];

export const PARTICIPANT_KINDS = ["GAME_MASTER", "PLAYER"] as const;
export type ParticipantKind = (typeof PARTICIPANT_KINDS)[number];

export const ROOM_STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const MAX_PLAYERS = 30;
export const MIN_PLAYERS = 5;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 24;

export const DEFAULT_DISCUSSION_SECONDS = 180;
export const DEFAULT_VOTING_SECONDS = 60;
export const DEFAULT_HUNTER_SECONDS = 30;

export type AbilityDefinition = {
  id: AbilityId;
  name: string;
  description: string;
  phase: "DAY" | "NIGHT";
  requiresTarget: boolean;
  usesPerGame?: number;
};

export type RoleDefinition = {
  id: RoleId;
  name: string;
  team: Team;
  icon: string;
  description: string;
  objective: string;
  abilities: AbilityDefinition[];
  instructions: string;
  specialConditions: string;
  nightPriority?: number;
};

export type PublicPlayer = {
  id: string;
  name: string;
  alive: boolean;
  connected: boolean;
  revealedRoleId?: RoleId;
};

export type LegalAction = {
  abilityId: AbilityId | "vote" | "abstain";
  label: string;
  requiresTarget: boolean;
  allowSelf?: boolean;
  extra?: "secondTarget" | "witchChoice";
};

export type GameEventVisibility = "ALL" | "GAME_MASTER" | { playerId: string };

export type GameEvent = {
  seq: number;
  type: string;
  at: string;
  payload: Record<string, unknown>;
  visibility: GameEventVisibility;
};

export type PendingAction = {
  key: string;
  label: string;
  status: "pending" | "completed";
  actorIds: string[];
};

export type PlayerPrivateInfo = {
  id: string;
  name: string;
  role: RoleDefinition | null;
  alive: boolean;
  loverId: string | null;
  investigation: { targetId: string; isWerewolf: boolean; night: number } | null;
  knownWerewolfIds: string[];
  witchHealUsed: boolean;
  witchPoisonUsed: boolean;
  proposedVictimId: string | null;
};

export type PlayerView = {
  kind: "PLAYER";
  roomCode: string;
  phase: GamePhase;
  round: number;
  status: RoomStatus;
  timerEndsAt: number | null;
  hunterTimerEndsAt: number | null;
  you: PlayerPrivateInfo;
  players: PublicPlayer[];
  legalActions: LegalAction[];
  publicEvents: GameEvent[];
  publicDeaths: { playerId: string; roleId: RoleId; cause: string }[];
  winner: Winner | null;
  voting: {
    hasVoted: boolean;
    canChange: boolean;
    confirmedCount: number;
    livingCount: number;
  } | null;
  recoveryCode?: string;
};

export type GameMasterPlayerRow = {
  id: string;
  name: string;
  roleId: RoleId | null;
  alive: boolean;
  connected: boolean;
};

export type GameMasterView = {
  kind: "GAME_MASTER";
  roomCode: string;
  qrPath: string;
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
  connectedCount: number;
  playerCount: number;
  players: GameMasterPlayerRow[];
  roleDraft: RoleId[] | null;
  pendingActions: PendingAction[];
  events: GameEvent[];
  voting: {
    confirmedCount: number;
    livingCount: number;
    tally?: { targetId: string | null; votes: number }[];
  } | null;
  publicDeaths: { playerId: string; roleId: RoleId; cause: string }[];
  winner: Winner | null;
  recoveryCode?: string;
};

export type ClientView = PlayerView | GameMasterView;

export type RoomConfigSnapshot = {
  id: string;
  name: string;
  roles: RoleId[];
  discussionSeconds: number;
  votingSeconds: number;
  hunterSeconds: number;
  voteChangeEnabled: boolean;
  revealPolicy: RevealPolicy;
  paceMode: PaceMode;
};

export type SocketClientEvents = {
  "room:kick": { participantId: string };
  "room:close": Record<string, never>;
  "room:assignRoles": { roles?: RoleId[] };
  "room:correctRole": { participantId: string; roleId: RoleId };
  "room:start": Record<string, never>;
  "phase:advance": { to: GamePhase };
  "phase:setPace": { paceMode: PaceMode };
  "action:night": {
    abilityId: AbilityId;
    targetId?: string | null;
    secondTargetId?: string | null;
  };
  "action:vote": { targetId: string | null };
  "action:hunter": { targetId: string | null };
  "gm:judgeGirl": { discovered: boolean };
  "gm:executeResults": Record<string, never>;
  "config:save": { name: string };
  "config:apply": { configId: string };
  "history:get": Record<string, never>;
};

export type SocketServerEvents = {
  state: { view: ClientView };
  error: { code: string; message: string };
  recoveryCode: { code: string };
  history: { events: GameEvent[] };
  kicked: { message: string };
  closed: { message: string };
};

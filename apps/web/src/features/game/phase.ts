import type { GameMasterView, GamePhase, PendingAction } from "@werewolf/shared";

export const PHASE_LABELS: Record<GamePhase, string> = {
  LOBBY: "Sala de espera",
  ROLE_REVEAL: "Revelación de roles",
  NIGHT: "Noche",
  DAY: "Día",
  DISCUSSION: "Discusión",
  VOTING: "Votación",
  VOTING_RESULTS: "Resultado de la votación",
  GAME_OVER: "Partida terminada",
};

export type NextStep =
  | { kind: "start"; label: string }
  | { kind: "advance"; to: GamePhase; label: string }
  | { kind: "execute"; label: string }
  | { kind: "none"; label: string };

export function momentTitle(phase: GamePhase, round: number): string {
  if (phase === "NIGHT") return `Noche ${Math.max(round, 1)}`;
  if (phase === "DAY" || phase === "DISCUSSION" || phase === "VOTING" || phase === "VOTING_RESULTS") {
    return `Día ${Math.max(round, 1)}`;
  }
  return PHASE_LABELS[phase];
}

export function nextStep(phase: GamePhase): NextStep {
  switch (phase) {
    case "LOBBY":
      return { kind: "start", label: "Revelar roles e iniciar" };
    case "ROLE_REVEAL":
      return { kind: "advance", to: "NIGHT", label: "Comenzar la noche 1" };
    case "NIGHT":
      return { kind: "advance", to: "DAY", label: "Amanecer y abrir el día" };
    case "DAY":
      return { kind: "advance", to: "DISCUSSION", label: "Abrir la discusión" };
    case "DISCUSSION":
      return { kind: "advance", to: "VOTING", label: "Abrir la votación" };
    case "VOTING":
      return { kind: "advance", to: "VOTING_RESULTS", label: "Cerrar la votación" };
    case "VOTING_RESULTS":
      return { kind: "execute", label: "Ejecutar el resultado" };
    default:
      return { kind: "none", label: "La partida ya terminó" };
  }
}

export function pendingRoles(actions: PendingAction[]): PendingAction[] {
  return actions.filter((action) => action.status === "pending");
}

export function confirmCopy(view: GameMasterView): { title: string; body: string; warn: boolean } {
  const next = nextStep(view.phase);
  const pending = pendingRoles(view.pendingActions);
  const here = momentTitle(view.phase, view.round);
  const warn = pending.length > 0 && (view.phase === "NIGHT" || view.phase === "VOTING");
  const reminder =
    pending.length > 0
      ? `Antes de continuar, recuerda que aún deben actuar: ${pending.map((item) => item.label).join("; ")}.`
      : view.phase === "NIGHT"
        ? "Las acciones opcionales (vidente, bruja, protector, niña) no bloquean el amanecer, pero puedes esperarlas."
        : "Si la mesa ya está lista, puedes seguir.";

  return {
    title: `¿Continuar desde ${here}?`,
    body: `${next.label}. ${reminder}`,
    warn,
  };
}

export function phaseTrack(): { id: GamePhase; label: string }[] {
  return [
    { id: "LOBBY", label: "Sala" },
    { id: "ROLE_REVEAL", label: "Roles" },
    { id: "NIGHT", label: "Noche" },
    { id: "DAY", label: "Día" },
    { id: "DISCUSSION", label: "Discusión" },
    { id: "VOTING", label: "Voto" },
    { id: "VOTING_RESULTS", label: "Resultado" },
    { id: "GAME_OVER", label: "Final" },
  ];
}

export function trackIndex(phase: GamePhase): number {
  return Math.max(0, phaseTrack().findIndex((step) => step.id === phase));
}

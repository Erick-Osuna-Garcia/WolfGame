import type { GameEvent, GameMasterView } from "@werewolf/shared";

export function eventLabel(type: string): string {
  const labels: Record<string, string> = {
    game_started: "La partida comenzó",
    night_started: "Cayó la noche",
    night_ended: "El pueblo despertó",
    phase_changed: "Cambió la fase",
    voting_started: "Se abrió la votación",
    voting_closed: "Se cerró la votación",
    player_eliminated: "Alguien fue eliminado",
    game_over: "La partida terminó",
    room_closed: "La sala se cerró",
    wolves_chose: "Los hombres lobo eligieron víctima",
    seer_investigated: "La vidente investigó",
    results_executed: "Se ejecutó el resultado de la votación",
    vote_no_elimination: "Nadie fue eliminado por el pueblo",
    cupid_linked: "Cupido enlazó a dos personas",
    girl_judged: "El Game Master juzgó a la niña",
    roles_assigned: "Se asignaron los roles",
  };
  return labels[type] ?? type;
}

export type NightChapter = {
  night: number;
  lines: string[];
};

export function nightChapters(view: GameMasterView): NightChapter[] {
  const chapters = new Map<number, string[]>();
  let currentNight = 0;
  let inNight = false;

  for (const event of view.events) {
    if (event.type === "night_started") {
      currentNight = Number(event.payload.round ?? currentNight + 1);
      inNight = true;
      chapters.set(currentNight, chapters.get(currentNight) ?? []);
      chapters.get(currentNight)!.push(`Noche ${currentNight}. El pueblo se duerme.`);
      continue;
    }
    if (event.type === "night_ended" && currentNight > 0) {
      chapters.get(currentNight)?.push("El gallo cantó. Se abre el día.");
      inNight = false;
      continue;
    }
    if (!inNight || currentNight === 0) continue;
    const line = chapterLine(event, view);
    if (line) chapters.get(currentNight)?.push(line);
  }

  return [...chapters.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([night, lines]) => ({ night, lines }));
}

function chapterLine(event: GameEvent, view: GameMasterView): string | null {
  if (event.type === "player_eliminated") {
    const name = view.players.find((player) => player.id === event.payload.playerId)?.name ?? "Alguien";
    const cause = typeof event.payload.cause === "string" ? event.payload.cause : "la noche";
    return `${name} no amaneció. Causa: ${cause}.`;
  }
  if (event.type === "wolves_chose") return "La manada cerró su elección.";
  if (event.type === "seer_investigated") return "La vidente consultó a alguien.";
  if (event.type === "cupid_linked") return "Cupido disparó su flecha.";
  if (event.type === "girl_judged") {
    return event.payload.discovered ? "La niña fue descubierta." : "La niña miró y no fue vista.";
  }
  return null;
}

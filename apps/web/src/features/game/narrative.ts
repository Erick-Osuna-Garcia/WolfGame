import type { GameMasterView, PlayerView } from "@werewolf/shared";
import { momentTitle } from "./phase";

export function gmNarration(view: GameMasterView): { kicker: string; title: string; story: string } {
  const title = momentTitle(view.phase, view.round);
  const living = view.players.filter((player) => player.alive).length;
  const dead = view.publicDeaths;

  if (view.phase === "LOBBY") {
    return {
      kicker: "Antes de empezar",
      title: "El pueblo se reúne",
      story: `${view.playerCount} personas han llegado a la aldea. Cuando el grupo esté completo, reparte los roles y empieza. Todavía no ha pasado nada.`,
    };
  }
  if (view.phase === "ROLE_REVEAL") {
    return {
      kicker: "Prólogo",
      title: "Cada uno conoce su secreto",
      story: "Las cartas ya están en la mesa. Nadie debe mostrar la suya. Cuando todos hayan leído, puedes abrir la primera noche.",
    };
  }
  if (view.phase === "NIGHT") {
    const pending = view.pendingActions.filter((action) => action.status === "pending");
    const wait =
      pending.length > 0
        ? ` En la oscuridad aún deben cumplir su función: ${pending.map((item) => item.label.toLowerCase()).join(", ")}.`
        : " Los roles activos de esta noche ya actuaron. Puedes amanecer cuando quieras.";
    return {
      kicker: `Noche ${Math.max(view.round, 1)}`,
      title: "El pueblo duerme",
      story: `Es de noche. Cierren los ojos.${wait}`,
    };
  }
  if (view.phase === "DAY") {
    const dawn =
      dead.length === 0
        ? "El pueblo despierta. Nadie ha muerto. Todavía no ha pasado nada visible."
        : `El pueblo despierta. ${dead.map((item) => nameOf(view, item.playerId)).join(" y ")} no están.`;
    return { kicker: `Día ${Math.max(view.round, 1)}`, title: "Amanece", story: dawn };
  }
  if (view.phase === "DISCUSSION") {
    return {
      kicker: `Día ${Math.max(view.round, 1)}`,
      title: "La plaza discute",
      story: `Hay ${living} vivos. Hablen. El Game Master marcará cuándo abrir la votación.`,
    };
  }
  if (view.phase === "VOTING") {
    return {
      kicker: `Día ${Math.max(view.round, 1)}`,
      title: "El pueblo vota",
      story: `Votación secreta. ${view.voting?.confirmedCount ?? 0} de ${view.voting?.livingCount ?? living} ya confirmaron.`,
    };
  }
  if (view.phase === "VOTING_RESULTS") {
    return {
      kicker: `Día ${Math.max(view.round, 1)}`,
      title: "Se lee el veredicto",
      story: "Los votos están cerrados. Ejecuta el resultado cuando quieras anunciarlo en voz alta.",
    };
  }
  return {
    kicker: "Final",
    title: view.winner === "VILLAGE" ? "Gana el pueblo" : view.winner === "WEREWOLF" ? "Ganan los lobos" : "Ganan los enamorados",
    story: "La aldea ya tiene un ganador. Puedes releer las noches anteriores para contar cómo llegó hasta aquí.",
  };
}

export function playerNarration(view: PlayerView): { kicker: string; title: string; story: string } {
  const title = momentTitle(view.phase, view.round);
  if (!view.you.alive) {
    return {
      kicker: title,
      title: "Observas en silencio",
      story: "Has sido eliminado. Ya no votas ni usas habilidades. Escucha la mesa.",
    };
  }
  if (view.phase === "NIGHT") {
    return {
      kicker: `Noche ${Math.max(view.round, 1)}`,
      title: view.legalActions.length > 0 ? "Te toca actuar" : "Cierra los ojos",
      story:
        view.legalActions.length > 0
          ? "La noche te llama. Haz solo lo que tu rol permite, en silencio."
          : "No te toca esta noche. Espera a que el pueblo despierte.",
    };
  }
  if (view.phase === "DAY") {
    const quiet = view.publicDeaths.length === 0;
    return {
      kicker: `Día ${Math.max(view.round, 1)}`,
      title: quiet ? "Amanece en calma" : "Amanece con ausencia",
      story: quiet
        ? "Es de día. Todavía no ha pasado nada. Mira a los demás y espera la discusión."
        : "Alguien no amaneció. Lee el anuncio y prepárate para hablar.",
    };
  }
  if (view.phase === "DISCUSSION") {
    return { kicker: title, title: "Es hora de hablar", story: "Discute con la mesa. No muestres tu tarjeta." };
  }
  if (view.phase === "VOTING") {
    return { kicker: title, title: "Voto secreto", story: "Elige con cuidado. Tu voto no se muestra a los demás." };
  }
  if (view.phase === "ROLE_REVEAL") {
    return { kicker: "Tu secreto", title: "Lee tu rol", story: "Nadie más debe ver esta tarjeta. Guárdala para toda la partida." };
  }
  if (view.phase === "GAME_OVER") {
    return { kicker: "Final", title: "La partida terminó", story: "Mira el ganador y, si quieres, tu rol otra vez." };
  }
  return { kicker: title, title: title, story: "Sigue lo que ocurre en la mesa." };
}

function nameOf(view: GameMasterView, id: string) {
  return view.players.find((player) => player.id === id)?.name ?? "Alguien";
}

export function formatLongDate(date = new Date()): string {
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

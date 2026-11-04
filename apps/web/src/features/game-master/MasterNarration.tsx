import { useMemo, useState } from "react";
import type { GameMasterView } from "@werewolf/shared";
import type { Socket } from "socket.io-client";
import { nightChapters } from "../game/events";
import { formatLongDate, gmNarration } from "../game/narrative";
import { formatClock, useCountdown } from "../game/useCountdown";
import { PhaseControls } from "./PhaseControls";

export function MasterNarration({ view, socket }: { view: GameMasterView; socket: Socket | null }) {
  const story = gmNarration(view);
  const remaining = useCountdown(view.timerEndsAt);
  const [showNights, setShowNights] = useState(false);
  const chapters = useMemo(() => nightChapters(view), [view]);
  const date = formatLongDate();

  return (
    <div className="stack">
      <section className={`narration ${view.phase === "NIGHT" ? "is-night" : "is-day"}`}>
        <p className="kicker">{story.kicker}</p>
        <h2>{story.title}</h2>
        <p className="story">{story.story}</p>
        <div className="narration-meta">
          <div>
            <div className="muted">Fecha de mesa</div>
            <strong className="capitalize">{date}</strong>
          </div>
          <div className="timer-block">
            <div className="muted">{view.timerEndsAt ? "Tiempo para continuar" : "Sin reloj de servidor"}</div>
            <div className="code timer">{remaining !== null ? formatClock(remaining) : "—"}</div>
            {remaining === 0 && <p className="warning">El tiempo se acabó. ¿Quieres continuar a la siguiente fase?</p>}
          </div>
        </div>
      </section>

      <PhaseControls view={view} socket={socket} />

      <button onClick={() => setShowNights((value) => !value)}>
        {showNights ? "Cerrar crónica" : "Revisar qué pasó en noches anteriores"}
      </button>

      {showNights && (
        <section className="panel stack">
          <h2>Crónica de noches</h2>
          {chapters.length === 0 && <p className="muted">Todavía no ha caído ninguna noche.</p>}
          {chapters.map((chapter) => (
            <article key={chapter.night} className="night-chapter">
              <h3>Noche {chapter.night}</h3>
              {chapter.lines.map((line, index) => (
                <p key={`${chapter.night}-${index}`}>{line}</p>
              ))}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

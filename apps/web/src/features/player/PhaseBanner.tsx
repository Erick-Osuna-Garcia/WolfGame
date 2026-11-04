import type { GamePhase } from "@werewolf/shared";
import { momentTitle } from "../game/phase";
import { formatClock, useCountdown } from "../game/useCountdown";

export function PhaseBanner({
  phase,
  round,
  timerEndsAt,
}: {
  phase: GamePhase;
  round: number;
  timerEndsAt: number | null;
}) {
  const remaining = useCountdown(timerEndsAt);
  return (
    <div className={`phase-banner ${phase === "NIGHT" ? "is-night" : ""}`}>
      <div>
        <strong>{momentTitle(phase, round)}</strong>
        {round > 0 && <div className="muted">{phase === "NIGHT" ? "El pueblo duerme" : "El pueblo está despierto"}</div>}
      </div>
      {remaining !== null && <div className="code timer">{formatClock(remaining)}</div>}
    </div>
  );
}

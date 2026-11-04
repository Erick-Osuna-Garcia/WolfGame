import { useState } from "react";
import type { GameMasterView } from "@werewolf/shared";
import type { Socket } from "socket.io-client";
import { confirmCopy, momentTitle, nextStep, pendingRoles, phaseTrack, trackIndex } from "../game/phase";
import { ConfirmDialog } from "./ConfirmDialog";

export function PhaseControls({ view, socket }: { view: GameMasterView; socket: Socket | null }) {
  const [open, setOpen] = useState(false);
  const next = nextStep(view.phase);
  const pending = pendingRoles(view.pendingActions);
  const confirm = confirmCopy(view);
  const current = trackIndex(view.phase);

  function runNext() {
    if (next.kind === "start") socket?.emit("room:start");
    if (next.kind === "advance") socket?.emit("phase:advance", { to: next.to });
    if (next.kind === "execute") socket?.emit("gm:executeResults");
    setOpen(false);
  }

  return (
    <section className="panel stack">
      <p className="kicker">Dónde van</p>
      <h2>{momentTitle(view.phase, view.round)}</h2>
      <ol className="stepper" aria-label="Recorrido de la partida">
        {phaseTrack().map((step, index) => (
          <li key={step.id} className={index === current ? "is-current" : index < current ? "is-done" : ""}>
            <span>{index + 1}</span>
            {step.label}
          </li>
        ))}
      </ol>

      {pending.length > 0 && (
        <div className="callout">
          <strong>Roles que deben cumplir su función</strong>
          <ul>
            {pending.map((action) => (
              <li key={action.key}>{action.label}</li>
            ))}
          </ul>
        </div>
      )}
      {view.phase === "NIGHT" && pending.length === 0 && (
        <p className="muted">Las acciones obligatorias de esta noche ya están hechas. Puedes amanecer.</p>
      )}

      {next.kind !== "none" ? (
        <button className="primary" onClick={() => setOpen(true)}>{next.label}</button>
      ) : (
        <p>No hay más fases que conducir.</p>
      )}

      {open && (
        <ConfirmDialog
          title={confirm.title}
          body={confirm.body}
          warn={confirm.warn}
          confirmLabel="Sí, continuar"
          onCancel={() => setOpen(false)}
          onConfirm={runNext}
        />
      )}
    </section>
  );
}

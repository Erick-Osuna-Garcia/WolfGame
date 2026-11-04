import { useState } from "react";
import type { PlayerView } from "@werewolf/shared";
import type { Socket } from "socket.io-client";

export function VotePanel({ view, socket }: { view: PlayerView; socket: Socket | null }) {
  const [targetId, setTargetId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const living = view.players.filter((player) => player.alive && player.id !== view.you.id);
  const blocked = view.voting?.hasVoted && !view.voting.canChange;

  if (blocked) {
    return <p>Tu voto es privado y ya quedó registrado.</p>;
  }

  return (
    <section className="panel stack">
      <h2>¿A quién deseas votar?</h2>
      <div className="list">
        {living.map((player) => (
          <button
            key={player.id}
            className="choice"
            onClick={() => {
              setTargetId(player.id);
              setConfirming(true);
            }}
          >
            {player.name}
          </button>
        ))}
        <button className="choice" onClick={() => { setTargetId(null); setConfirming(true); }}>
          Abstenerse
        </button>
      </div>
      {confirming && (
        <div className="callout stack">
          <p>Tu voto es privado. ¿Confirmas?</p>
          <div className="row">
            <button
              className="primary"
              onClick={() => {
                socket?.emit("action:vote", { targetId });
                setConfirming(false);
              }}
            >
              Confirmar voto
            </button>
            <button onClick={() => setConfirming(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </section>
  );
}

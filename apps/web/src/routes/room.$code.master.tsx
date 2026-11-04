import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lobby } from "../features/lobby/Lobby";
import { MasterDashboard } from "../features/game-master/MasterDashboard";
import { MasterNarration } from "../features/game-master/MasterNarration";
import { useGame } from "../features/game/useGame";

export const Route = createFileRoute("/room/$code/master")({
  component: MasterPage,
});

function MasterPage() {
  const { view, error, socket } = useGame();
  const [tab, setTab] = useState<"mesa" | "narracion">("mesa");

  return (
    <main className="shell wide stack">
      <header className="master-header">
        <div>
          <p className="kicker">Game Master</p>
          <h1>{tab === "narracion" ? "Narración" : "Mesa"}</h1>
        </div>
        {view?.kind === "GAME_MASTER" && (
          <div className="view-switch" role="tablist" aria-label="Vistas del Game Master">
            <button role="tab" aria-selected={tab === "mesa"} className={tab === "mesa" ? "primary" : ""} onClick={() => setTab("mesa")}>
              Mesa
            </button>
            <button role="tab" aria-selected={tab === "narracion"} className={tab === "narracion" ? "primary" : ""} onClick={() => setTab("narracion")}>
              Narración
            </button>
          </div>
        )}
      </header>
      {error && <p className="error">{error}</p>}
      {!view && <p>Conectando con la sala…</p>}
      {view?.kind === "GAME_MASTER" && tab === "mesa" && (
        <>
          {view.phase === "LOBBY" && <Lobby view={view} />}
          <MasterDashboard view={view} socket={socket} />
        </>
      )}
      {view?.kind === "GAME_MASTER" && tab === "narracion" && (
        <MasterNarration view={view} socket={socket} />
      )}
    </main>
  );
}

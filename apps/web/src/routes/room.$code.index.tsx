import { createFileRoute } from "@tanstack/react-router";
import { Lobby } from "../features/lobby/Lobby";
import { PlayerHome } from "../features/player/PlayerHome";
import { useGame } from "../features/game/useGame";

export const Route = createFileRoute("/room/$code/")({
  component: PlayerRoomPage,
});

function PlayerRoomPage() {
  const { view, error, socket } = useGame();
  return (
    <main className="shell stack">
      <p className="kicker">Jugador</p>
      <h1>Tu lugar en la aldea</h1>
      {error && <p className="error">{error}</p>}
      {!view && <p>Conectando con la sala…</p>}
      {view?.kind === "PLAYER" && view.phase === "LOBBY" && <Lobby view={view} />}
      {view?.kind === "PLAYER" && view.phase !== "LOBBY" && <PlayerHome view={view} socket={socket} />}
      {view?.kind === "GAME_MASTER" && <p>Esta pantalla es de jugador. Abre el panel del Game Master.</p>}
    </main>
  );
}

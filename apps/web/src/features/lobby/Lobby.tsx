import type { ClientView } from "@werewolf/shared";

export function Lobby({ view }: { view: ClientView }) {
  const players = view.kind === "GAME_MASTER" ? view.players : view.players;
  return (
    <section className="panel stack">
      <p className="kicker">Antes de la noche</p>
      <h2>Sala de espera</h2>
      <p className="muted">
        {players.length} jugador{players.length === 1 ? "" : "es"} · el Game Master aún no abre la partida
      </p>
      <div className="list">
        {players.map((player) => (
          <div className="player-chip" key={player.id}>
            <span>{player.name}</span>
            <span className="badge">{player.connected ? "Conectado" : "Desconectado"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

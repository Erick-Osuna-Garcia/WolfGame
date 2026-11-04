import { useState } from "react";
import type { PlayerView } from "@werewolf/shared";
import type { Socket } from "socket.io-client";
import { playerNarration } from "../game/narrative";
import { formatClock, useCountdown } from "../game/useCountdown";
import { RoleCard } from "../roles/RoleCard";
import { VotePanel } from "../voting/VotePanel";
import { PhaseBanner } from "./PhaseBanner";

export function PlayerHome({ view, socket }: { view: PlayerView; socket: Socket | null }) {
  const [showRole, setShowRole] = useState(view.phase === "ROLE_REVEAL");
  const living = view.players.filter((player) => player.alive);
  const story = playerNarration(view);
  const mustAct = view.you.alive && view.legalActions.length > 0;
  const hunterTimer = useCountdown(view.hunterTimerEndsAt);

  return (
    <div className="stack">
      <PhaseBanner phase={view.phase} round={view.round} timerEndsAt={view.timerEndsAt} />

      <section className={`narration compact ${view.phase === "NIGHT" ? "is-night" : "is-day"}`}>
        <p className="kicker">{story.kicker}</p>
        <h2>{story.title}</h2>
        <p className="story">{story.story}</p>
        <div className={`act-flag ${mustAct ? "is-act" : "is-wait"}`}>
          {mustAct ? "Te toca" : view.you.alive ? "Espera" : "Eliminado"}
        </div>
      </section>

      {view.you.role && (
        <button onClick={() => setShowRole((value) => !value)}>
          {showRole ? "Guardar mi tarjeta" : `Ver mi rol · ${view.you.role.name}`}
        </button>
      )}
      {showRole && view.you.role && <RoleCard role={view.you.role} />}

      {view.you.loverId && (
        <p className="callout">Estás enlazado. Si {nameOf(view, view.you.loverId)} muere, tú también.</p>
      )}
      {view.you.investigation && (
        <p className="callout">
          Tu visión: {nameOf(view, view.you.investigation.targetId)}{" "}
          {view.you.investigation.isWerewolf ? "es hombre lobo." : "no es hombre lobo."}
        </p>
      )}
      {view.you.proposedVictimId && (
        <p className="callout">La víctima de los lobos esta noche es {nameOf(view, view.you.proposedVictimId)}.</p>
      )}

      {view.phase === "VOTING" && view.you.alive && <VotePanel view={view} socket={socket} />}
      {view.phase === "NIGHT" && <NightActions view={view} socket={socket} living={living} />}
      {view.legalActions.some((action) => action.abilityId === "hunter_shoot") && (
        <section className="panel stack">
          {hunterTimer !== null && <p>Tiempo para disparar: {formatClock(hunterTimer)}</p>}
          <TargetPicker
            title="Disparo del cazador"
            players={living.filter((player) => player.id !== view.you.id)}
            onPick={(targetId) => socket?.emit("action:hunter", { targetId })}
          />
        </section>
      )}

      <section className="panel stack">
        <h3>La aldea</h3>
        <div className="list">
          {view.players.map((player) => (
            <div className="player-chip" key={player.id}>
              <span>{player.name}{player.id === view.you.id ? " · tú" : ""}</span>
              <span className="badge">
                {player.alive ? "Vivo" : player.revealedRoleId ?? "Eliminado"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {view.publicDeaths.length > 0 && (
        <section className="panel">
          <h3>Lo que el pueblo sabe</h3>
          {view.publicDeaths.map((death) => (
            <p key={`${death.playerId}-${death.cause}`}>
              {nameOf(view, death.playerId)} fue eliminado ({death.cause}).
            </p>
          ))}
        </section>
      )}

      {view.winner && <h2>Ganador: {winnerLabel(view.winner)}</h2>}
      {view.recoveryCode && <p className="muted">Guarda tu código de recuperación: {view.recoveryCode}</p>}
    </div>
  );
}

function NightActions({
  view,
  socket,
  living,
}: {
  view: PlayerView;
  socket: Socket | null;
  living: PlayerView["players"];
}) {
  const actions = view.legalActions.filter((action) => action.abilityId !== "hunter_shoot");
  if (actions.length === 0) {
    return <p className="muted">Esta noche no tienes ninguna acción. Espera.</p>;
  }
  return (
    <section className="panel stack">
      <h3>Tu acción de esta noche</h3>
      {actions.map((action) => {
        if (!action.requiresTarget) {
          return (
            <button
              key={action.abilityId}
              className="primary"
              onClick={() => socket?.emit("action:night", { abilityId: action.abilityId })}
            >
              {action.label}
            </button>
          );
        }
        if (action.extra === "secondTarget") {
          return <CupidPicker key={action.abilityId} socket={socket} living={living} />;
        }
        return (
          <TargetPicker
            key={action.abilityId}
            title={action.label}
            players={living.filter((player) => player.id !== view.you.id || Boolean(action.allowSelf))}
            onPick={(targetId) => socket?.emit("action:night", { abilityId: action.abilityId, targetId })}
          />
        );
      })}
    </section>
  );
}

function TargetPicker({
  title,
  players,
  onPick,
}: {
  title: string;
  players: { id: string; name: string }[];
  onPick: (id: string) => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="stack">
      <h3>{title}</h3>
      {players.map((player) => (
        <button
          key={player.id}
          className={`choice ${chosen === player.id ? "is-selected" : ""}`}
          onClick={() => setChosen(player.id)}
        >
          {player.name}
        </button>
      ))}
      <button className="primary" disabled={!chosen} onClick={() => chosen && onPick(chosen)}>
        Confirmar
      </button>
    </div>
  );
}

function CupidPicker({
  socket,
  living,
}: {
  socket: Socket | null;
  living: PlayerView["players"];
}) {
  const [first, setFirst] = useState<string | null>(null);
  const [second, setSecond] = useState<string | null>(null);
  return (
    <div className="stack">
      <h3>{second ? "Confirma el enlace" : first ? "Segundo enamorado" : "Primer enamorado"}</h3>
      {living.map((player) => (
        <button
          key={player.id}
          className={`choice ${player.id === first || player.id === second ? "is-selected" : ""}`}
          onClick={() => {
            if (!first) setFirst(player.id);
            else if (player.id !== first) setSecond(player.id);
          }}
        >
          {player.name}
        </button>
      ))}
      <button
        className="primary"
        disabled={!first || !second}
        onClick={() => socket?.emit("action:night", { abilityId: "cupid_link", targetId: first, secondTargetId: second })}
      >
        Enlazar
      </button>
    </div>
  );
}

function nameOf(view: PlayerView, id: string) {
  if (id === view.you.id) return view.you.name;
  return view.players.find((player) => player.id === id)?.name ?? id;
}

function winnerLabel(winner: "VILLAGE" | "WEREWOLF" | "LOVERS") {
  if (winner === "VILLAGE") return "el pueblo";
  if (winner === "WEREWOLF") return "los hombres lobo";
  return "los enamorados";
}

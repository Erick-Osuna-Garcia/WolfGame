import { useEffect, useState } from "react";
import type { GameMasterView, RoleId } from "@werewolf/shared";
import type { Socket } from "socket.io-client";
import QRCode from "qrcode";
import { publicWebBase, saveConfig } from "../../lib/api";
import { eventLabel } from "../game/events";
import { PhaseControls } from "./PhaseControls";

export function MasterDashboard({ view, socket }: { view: GameMasterView; socket: Socket | null }) {
  const [qr, setQr] = useState("");
  const [configName, setConfigName] = useState("Mesa clásica");
  const joinUrl = `${publicWebBase()}/join?code=${view.roomCode}`;

  useEffect(() => {
    void QRCode.toDataURL(joinUrl, { margin: 1, width: 240 }).then(setQr);
  }, [joinUrl]);

  return (
    <div className="stack">
      <PhaseControls view={view} socket={socket} />

      <section className="panel stack">
        <h2>Compartir sala</h2>
        <div className="code">{view.roomCode}</div>
        {qr && <img className="qr" src={qr} alt={`QR de la sala ${view.roomCode}`} />}
        <p className="muted">{joinUrl}</p>
        {view.recoveryCode && <p>Tu código de recuperación: {view.recoveryCode}</p>}
      </section>

      <section className="panel stack">
        <h2>Mesa</h2>
        <p>{view.playerCount} jugadores · {view.connectedCount} conectados · ritmo {view.paceMode === "MANUAL" ? "manual" : "asistido"}</p>
        <div className="row">
          <button onClick={() => socket?.emit("phase:setPace", { paceMode: view.paceMode === "MANUAL" ? "ASSISTED" : "MANUAL" })}>
            Cambiar a {view.paceMode === "MANUAL" ? "asistido" : "manual"}
          </button>
          {view.phase === "LOBBY" && (
            <button className="primary" onClick={() => socket?.emit("room:assignRoles", {})}>
              Asignar roles clásicos
            </button>
          )}
          <button className="danger" onClick={() => socket?.emit("room:close")}>Cerrar sala</button>
        </div>
      </section>

      <section className="panel">
        <h2>Jugadores</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Jugador</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Conexión</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {view.players.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>
                    <select
                      value={player.roleId ?? ""}
                      disabled={view.phase !== "LOBBY"}
                      onChange={(event) =>
                        socket?.emit("room:correctRole", {
                          participantId: player.id,
                          roleId: event.target.value as RoleId,
                        })
                      }
                    >
                      <option value="">Sin rol</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>{player.alive ? "Vivo" : "Eliminado"}</td>
                  <td>{player.connected ? "Conectado" : "Desconectado"}</td>
                  <td>
                    {view.phase === "LOBBY" && (
                      <button className="danger" onClick={() => socket?.emit("room:kick", { participantId: player.id })}>
                        Expulsar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {view.phase === "NIGHT" && (
        <section className="panel stack">
          <h2>Juicio de la niña</h2>
          <p className="muted">Solo si pidió mirar esta noche.</p>
          <div className="row">
            <button onClick={() => socket?.emit("gm:judgeGirl", { discovered: true })}>Fue descubierta</button>
            <button onClick={() => socket?.emit("gm:judgeGirl", { discovered: false })}>Salió a salvo</button>
          </div>
        </section>
      )}

      {view.voting && (
        <section className="panel">
          <h2>Progreso de la votación</h2>
          <p>{view.voting.confirmedCount} de {view.voting.livingCount} votos confirmados. El sentido sigue oculto.</p>
          {view.voting.tally?.map((row) => (
            <p key={String(row.targetId)}>
              {row.targetId ? view.players.find((player) => player.id === row.targetId)?.name : "Abstención"}: {row.votes}
            </p>
          ))}
        </section>
      )}

      <section className="panel stack">
        <h2>Registro de la mesa</h2>
        <div className="list">
          {view.events.slice(-10).reverse().map((event) => (
            <div key={event.seq} className="muted">{eventLabel(event.type)}</div>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <h2>Configuración reutilizable</h2>
        <input value={configName} onChange={(event) => setConfigName(event.target.value)} />
        <button onClick={() => void saveConfig(configName)}>Guardar configuración de esta sala</button>
      </section>

      {view.winner && <h2>Ganador: {view.winner}</h2>}
    </div>
  );
}

const ROLE_OPTIONS: { id: RoleId; name: string }[] = [
  { id: "villager", name: "Aldeano" },
  { id: "werewolf", name: "Hombre lobo" },
  { id: "seer", name: "Vidente" },
  { id: "witch", name: "Bruja" },
  { id: "hunter", name: "Cazador" },
  { id: "cupid", name: "Cupido" },
  { id: "little_girl", name: "Niña" },
  { id: "protector", name: "Protector" },
];

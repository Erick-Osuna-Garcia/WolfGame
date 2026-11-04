import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createRoom, listConfigs, rejoin } from "../lib/api";
import { readSession, saveSession } from "../lib/session";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [error, setError] = useState("");
  const [configId, setConfigId] = useState("");
  const [configs, setConfigs] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    void listConfigs()
      .then(setConfigs)
      .catch(() => undefined);
  }, []);

  return (
    <main className="shell stack">
      <header>
        <p className="muted">Plataforma de partidas</p>
        <h1>Werewolf Online</h1>
        <p>Reúne la mesa, reparte roles en secreto y conduce la noche desde el navegador.</p>
      </header>

      <section className="panel stack">
        <h2>Game Master</h2>
        {configs.length > 0 && (
          <select value={configId} onChange={(event) => setConfigId(event.target.value)}>
            <option value="">Sala nueva sin configuración</option>
            {configs.map((config) => (
              <option key={config.id} value={config.id}>{config.name}</option>
            ))}
          </select>
        )}
        <button
          className="primary"
          onClick={async () => {
            try {
              const created = await createRoom(configId || undefined);
              saveSession(created.session);
              await navigate({ to: "/room/$code/master", params: { code: created.session.roomCode } });
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo crear la sala");
            }
          }}
        >
          Crear partida
        </button>
      </section>

      <section className="panel stack">
        <h2>Unirse</h2>
        <input
          placeholder="Código de sala"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          maxLength={6}
        />
        <button
          className="primary"
          onClick={() => navigate({ to: "/join", search: { code } })}
        >
          Entrar con código
        </button>
      </section>

      <section className="panel stack">
        <h2>Recuperar asiento</h2>
        <input
          placeholder="Código de recuperación"
          value={recovery}
          onChange={(event) => setRecovery(event.target.value.toUpperCase())}
        />
        <button
          onClick={async () => {
            try {
              const stored = readSession();
              const result = await rejoin(stored?.token, recovery || undefined);
              if (result.session.token) saveSession({ ...result.session, token: result.session.token || stored?.token || "" });
              const path = result.session.kind === "GAME_MASTER" ? "/room/$code/master" : "/room/$code";
              await navigate({ to: path, params: { code: result.session.roomCode } });
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo recuperar la sesión");
            }
          }}
        >
          Volver a mi asiento
        </button>
      </section>
      {error && <p className="error">{error}</p>}
    </main>
  );
}

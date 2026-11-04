import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { joinRoom } from "../lib/api";
import { saveSession } from "../lib/session";

type JoinSearch = { code?: string };

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>): JoinSearch => ({
    code: typeof search.code === "string" ? search.code : "",
  }),
  component: JoinPage,
});

function JoinPage() {
  const { code } = Route.useSearch();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [manualCode, setManualCode] = useState(code ?? "");
  const [error, setError] = useState("");

  return (
    <main className="shell stack">
      <h1>Unirse a la sala</h1>
      <section className="panel stack">
        <label>
          Código
          <input value={manualCode} onChange={(event) => setManualCode(event.target.value.toUpperCase())} maxLength={6} />
        </label>
        <label>
          Tu nombre
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} />
        </label>
        <button
          className="primary"
          onClick={async () => {
            try {
              const joined = await joinRoom(manualCode, name);
              saveSession(joined.session);
              await navigate({ to: "/room/$code", params: { code: joined.session.roomCode } });
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo entrar");
            }
          }}
        >
          Unirse
        </button>
        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

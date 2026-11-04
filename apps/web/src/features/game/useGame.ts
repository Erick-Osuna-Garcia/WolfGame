import { useEffect, useMemo, useState } from "react";
import type { ClientView } from "@werewolf/shared";
import type { Socket } from "socket.io-client";
import { connectGame } from "../../lib/socket";
import type { SessionPayload } from "../../lib/api";
import { readSession, saveSession } from "../../lib/session";

export function useGame(initial?: ClientView, session?: SessionPayload) {
  const [view, setView] = useState<ClientView | null>(initial ?? null);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const stored = useMemo(() => session ?? readSession(), [session]);

  useEffect(() => {
    if (!stored?.token) return;
    const next = connectGame(stored.token, setView, setError);
    setSocket(next);
    return () => {
      next.disconnect();
    };
  }, [stored?.token]);

  useEffect(() => {
    if (stored) saveSession(stored);
  }, [stored]);

  return { view, error, setError, socket, session: stored };
}

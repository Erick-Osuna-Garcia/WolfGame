import type { SessionPayload } from "./api";

const KEY = "wo.session";

export function saveSession(session: SessionPayload) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function readSession(): SessionPayload | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
}

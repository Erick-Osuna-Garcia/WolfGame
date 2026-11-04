import type { ClientView, RoomConfigSnapshot } from "@werewolf/shared";

export function apiBase(): string {
  if (typeof window === "undefined") {
    return process.env.VITE_API_URL ?? "http://localhost:3001";
  }
  return import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:3001`;
}

export function publicWebBase(): string {
  if (typeof window === "undefined") return "http://localhost:3000";
  return `${window.location.protocol}//${window.location.host}`;
}

export type SessionPayload = {
  token: string;
  recoveryCode?: string;
  participantId: string;
  roomCode: string;
  kind: "GAME_MASTER" | "PLAYER";
};

export type CreateOrJoinResponse = {
  view: ClientView;
  session: SessionPayload;
  qrPath?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message ?? "Error de red");
  }
  return data as T;
}

export function createRoom(configId?: string) {
  return request<CreateOrJoinResponse>("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ configId }),
  });
}

export function joinRoom(code: string, name: string) {
  return request<CreateOrJoinResponse>("/api/rooms/join", {
    method: "POST",
    body: JSON.stringify({ code, name }),
  });
}

export function rejoin(token?: string, recoveryCode?: string) {
  return request<CreateOrJoinResponse>("/api/rejoin", {
    method: "POST",
    body: JSON.stringify({ token, recoveryCode }),
  });
}

export function listConfigs() {
  return request<RoomConfigSnapshot[]>("/api/configs");
}

export function saveConfig(name: string) {
  return request<RoomConfigSnapshot>("/api/configs", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function loadHistory(token: string) {
  return request<{ events: ClientView extends never ? never : unknown[] }>(`/api/history?token=${token}`);
}

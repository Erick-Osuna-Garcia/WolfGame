import { io, type Socket } from "socket.io-client";
import type { ClientView } from "@werewolf/shared";
import { apiBase } from "./api";

export function connectGame(token: string, onState: (view: ClientView) => void, onError: (message: string) => void) {
  const socket: Socket = io(apiBase(), {
    transports: ["websocket"],
    auth: { token },
    withCredentials: true,
  });
  socket.on("state", (payload: { view: ClientView }) => onState(payload.view));
  socket.on("error", (payload: { message: string }) => onError(payload.message));
  socket.on("kicked", (payload: { message: string }) => onError(payload.message));
  socket.on("closed", (payload: { message: string }) => onError(payload.message));
  return socket;
}

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../config/env";

export function connectVideoSocket(token: string): Socket {
  return io(API_BASE_URL, {
    transports: ["websocket", "polling"],
    auth: {
      token,
    },
  });
}

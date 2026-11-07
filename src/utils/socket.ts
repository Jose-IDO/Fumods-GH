import { io } from "socket.io-client";
import { API_URL } from "../config/api";

// Vercel Functions serve HTTP only. A standalone backend can still use sockets.
export const socket = io(API_URL.startsWith('/') ? window.location.origin : API_URL, {
  autoConnect: !API_URL.startsWith('/'),
});

import { io } from "socket.io-client";

const socket = io("http://localhost:8000", {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

socket.on("connect", () => {
  console.log("🔗 Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("🚫 Connection error:", error);
});

export default socket;

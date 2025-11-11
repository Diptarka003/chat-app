import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { createSchema } from "./models/schema.js";
import userRouter from "./routes/userRoutes.js";
import cors from "cors";
import chatRouter from "./routes/chatRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import http from "http";
import { Server } from "socket.io";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/user", userRouter);
app.use("/api/chats", chatRouter);
app.use("/api/messages", messageRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

connectDB();
createSchema();

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // Join conversation room
  socket.on("join_conversation", (conversationId) => {
    const roomName = `conversation_${conversationId}`;
    socket.join(roomName);
    console.log(`✅ Socket ${socket.id} JOINED room: ${roomName}`);
    
    // Verify the socket is in the room
    console.log(`👥 Sockets in room ${roomName}:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
  });

  // Broadcast message to OTHER users in the room
  socket.on("send_message", (data) => {
    const { conversationId, message } = data;
    const roomName = `conversation_${conversationId}`;
    
    console.log(`💬 Message from ${socket.id} to room ${roomName}`);
    console.log(`👥 Room size: ${io.sockets.adapter.rooms.get(roomName)?.size || 0}`);
    
    // IMPORTANT: socket.to() excludes sender, io.to() includes everyone
    socket.to(roomName).emit("receive_message", {
      conversationId,
      message,
    });
    
    console.log(`📤 Broadcasted to ${roomName} (excluding sender)`);
  });

  // Leave conversation room
  socket.on("leave_conversation", (conversationId) => {
    const roomName = `conversation_${conversationId}`;
    socket.leave(roomName);
    console.log(`👋 Socket ${socket.id} LEFT room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on PORT ${process.env.PORT}`);
});
import { Server as HTTPServer } from "http";
import { Server as IOServer, Socket } from "socket.io";

let ioInstance: IOServer | null = null;

export function initSocket(server: HTTPServer) {
  if (ioInstance) return ioInstance;
  ioInstance = new IOServer(server, {
    cors: { origin: true, credentials: true },
    transports: ["websocket", "polling"],
  });

  ioInstance.on("connection", (socket: Socket) => {
    // Join per-user rooms for notifications
    socket.on("join", (userId: string) => {
      if (userId) socket.join(userId);
    });

    // Join a conversation room
    socket.on("join_conversation", (conversationId: string) => {
      if (conversationId) socket.join(`convo:${conversationId}`);
    });

    // Relay messages sent by clients (optional; API also emits after DB write)
    socket.on(
      "send_message",
      ({ conversationId, message }: { conversationId: string; message: unknown }) => {
        if (!conversationId) return;
        ioInstance?.to(`convo:${conversationId}`).emit("receive_message", message);
      }
    );
  });

  return ioInstance;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
  }
  return ioInstance;
}



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
    console.log("User connected:", socket.id);
    
    // Join per-user rooms for notifications
    socket.on("join", (userId: string) => {
      if (userId) {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
      }
    });

    // Join a conversation room
    socket.on("join_conversation", (conversationId: string) => {
      if (conversationId) {
        socket.join(`convo:${conversationId}`);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
      }
    });

    // Handle typing events
    socket.on("typing", ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.to(`convo:${conversationId}`).emit("user_typing");
      }
    });

    socket.on("stop_typing", ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.to(`convo:${conversationId}`).emit("user_stop_typing");
      }
    });

    // Relay messages sent by clients (optional; API also emits after DB write)
    socket.on(
      "send_message",
      ({ conversationId, message }: { conversationId: string; message: unknown }) => {
        if (!conversationId) return;
        ioInstance?.to(`convo:${conversationId}`).emit("receive_message", message);
      }
    );

    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", socket.id, "Reason:", reason);
    });
  });

  return ioInstance;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
  }
  return ioInstance;
}



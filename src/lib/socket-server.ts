import { Server as HTTPServer } from "http";
import { Server as IOServer, Socket } from "socket.io";

let ioInstance: IOServer | null = null;

export function initSocket(server: HTTPServer) {
  if (ioInstance) return ioInstance;
  ioInstance = new IOServer(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? ([process.env.NEXT_PUBLIC_SOCKET_URL, process.env.APP_URL].filter(
              Boolean
            ) as string[])
          : "http://localhost:3000",
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  // Make ioInstance globally available
  (global as { ioInstance?: IOServer }).ioInstance = ioInstance;

  ioInstance.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);


    try {
      const userId = socket.handshake.auth.userId;
      if (userId) {
        // Now socket.user.id will work in your other events
        (socket as any).user = { id: userId }; 
        console.log(`Authenticated user ${userId} for socket ${socket.id}`);
      } else {
        throw new Error("No userId in handshake auth");
      }
    } catch (error) {
      console.error("Socket authentication error:", error?.message);
      socket.disconnect(true); // Disconnect unauthenticated users
      return;
    }

    // Join per-user rooms for notifications
    socket.on("join", (userId: string) => {
      if (userId) {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
      } else {
        console.log("No userId provided for join event");
      }
    });

    // Join a conversation room
    socket.on("join_conversation", (conversationId: string) => {
      if (conversationId) {
        socket.join(`convo:${conversationId}`);
        console.log(
          `Socket ${socket.id} joined conversation ${conversationId}`
        );
        console.log(
          `Room convo:${conversationId} now has ${
            ioInstance?.sockets.adapter.rooms.get(`convo:${conversationId}`)
              ?.size || 0
          } members`
        );
      } else {
        console.log("No conversationId provided for join_conversation event");
      }
    });

    // Handle typing events
    socket.on("typing", ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.to(`convo:${conversationId}`).emit("user_typing");
      }
    });

    socket.on(
      "stop_typing",
      ({ conversationId }: { conversationId: string }) => {
        if (conversationId) {
          socket.to(`convo:${conversationId}`).emit("user_stop_typing");
        }
      }
    );

    // Relay messages sent by clients (optional; API also emits after DB write)
    socket.on(
      "send_message",
      ({
        conversationId,
        message,
      }: {
        conversationId: string;
        message: unknown;
      }) => {
        if (!conversationId) return;
        ioInstance
          ?.to(`convo:${conversationId}`)
          .emit("receive_message", message);
      }
    );

    // Handle message updates
    socket.on(
      "message_updated",
      ({
        conversationId,
        message,
      }: {
        conversationId: string;
        message: Record<string, unknown>;
      }) => {
        if (!conversationId) return;
        ioInstance
          ?.to(`convo:${conversationId}`)
          .emit("message_updated", message);
      }
    );

    // Handle message deletions
    socket.on(
      "message_deleted",
      ({
        conversationId,
        messageId,
      }: {
        conversationId: string;
        messageId: string;
      }) => {
        if (!conversationId) return;
        ioInstance
          ?.to(`convo:${conversationId}`)
          .emit("message_deleted", { messageId });
      }
    );

    // Handle reaction additions
    socket.on(
      "reaction_added",
      ({
        conversationId,
        reaction,
      }: {
        conversationId: string;
        reaction: Record<string, unknown>;
      }) => {
        if (!conversationId) return;
        ioInstance
          ?.to(`convo:${conversationId}`)
          .emit("reaction_added", reaction);
      }
    );

    // Handle reaction removals
    socket.on(
      "reaction_removed",
      ({
        conversationId,
        messageId,
        emoji,
      }: {
        conversationId: string;
        messageId: string;
        emoji: string;
      }) => {
        if (!conversationId) return;
        ioInstance
          ?.to(`convo:${conversationId}`)
          .emit("reaction_removed", { messageId, emoji });
      }
    );

    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", socket.id, "Reason:", reason);
    });

    //Calls
    socket.on('webrtc-offer', ({ recipientId, offer }) => {
    // ✅ This is the new, efficient way
    ioInstance?.to(recipientId).emit('webrtc-offer', {
      senderId: socket?.user?.id,
      offer,
    });
  });
    socket.on('webrtc-answer', ({ recipientId, answer }) => {
    ioInstance?.to(recipientId).emit('webrtc-answer', {
      senderId: socket.user.id,
      answer,
    });
  });

  // Relays network candidates
  socket.on('webrtc-ice-candidate', ({ recipientId, candidate }) => {
    ioInstance?.to(recipientId).emit('webrtc-ice-candidate', {
      senderId: socket.user.id,
      candidate,
    });
  });
  });

  return ioInstance;
}

export function getIO() {
  // Try to get from global first (for API routes)
  const globalIO = (global as { ioInstance?: IOServer }).ioInstance;
  if (globalIO) {
    return globalIO;
  }

  // Fallback to local instance
  if (!ioInstance) {
    throw new Error(
      "Socket.IO not initialized. Call initSocket(server) first."
    );
  }
  return ioInstance;
}

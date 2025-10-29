import { Server as HTTPServer } from "http";
import { Server as IOServer, Socket } from "socket.io";

let ioInstance: IOServer | null = null;

export function initSocket(server: HTTPServer) {
  if (ioInstance) return ioInstance;
  ioInstance = new IOServer(server, {
    cors: { 
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.NEXT_PUBLIC_SOCKET_URL, process.env.APP_URL].filter(Boolean) as string[]
        : true, 
      credentials: true 
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  // Make ioInstance globally available
  (global as { ioInstance?: IOServer }).ioInstance = ioInstance;

  ioInstance.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);
    
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
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
        console.log(`Room convo:${conversationId} now has ${ioInstance?.sockets.adapter.rooms.get(`convo:${conversationId}`)?.size || 0} members`);
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

    // Handle message updates
    socket.on("message_updated", ({ conversationId, message }: { conversationId: string; message: Record<string, unknown> }) => {
      if (!conversationId) return;
      ioInstance?.to(`convo:${conversationId}`).emit("message_updated", message);
    });

    // Handle message deletions
    socket.on("message_deleted", ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      if (!conversationId) return;
      ioInstance?.to(`convo:${conversationId}`).emit("message_deleted", { messageId });
    });

    // Handle reaction additions
    socket.on("reaction_added", ({ conversationId, reaction }: { conversationId: string; reaction: Record<string, unknown> }) => {
      if (!conversationId) return;
      ioInstance?.to(`convo:${conversationId}`).emit("reaction_added", reaction);
    });

    // Handle reaction removals
    socket.on("reaction_removed", ({ conversationId, messageId, emoji }: { conversationId: string; messageId: string; emoji: string }) => {
      if (!conversationId) return;
      ioInstance?.to(`convo:${conversationId}`).emit("reaction_removed", { messageId, emoji });
    });

    // --- Call / WebRTC signalling forwarding ---
    // These handlers accept a payload with a `to` field (target user id)
    // and forward the payload to that user's room. This enables
    // different clients to use slightly different event names while
    // ensuring the recipient receives the signalling data.

    socket.on('webrtc:offer', (payload: { to?: string; from?: string; offer?: any; callType?: string }) => {
      const target = payload?.to;
      if (!target) return;
      ioInstance?.to(target).emit('webrtc:offer', { from: payload.from, offer: payload.offer, callType: payload.callType });
    });

    socket.on('webrtc:answer', (payload: { to?: string; from?: string; answer?: any }) => {
      const target = payload?.to;
      if (!target) return;
      ioInstance?.to(target).emit('webrtc:answer', { from: payload.from, answer: payload.answer });
    });

    socket.on('webrtc:ice-candidate', (payload: { to?: string; from?: string; candidate?: any }) => {
      const target = payload?.to;
      if (!target) return;
      ioInstance?.to(target).emit('webrtc:ice-candidate', { from: payload.from, candidate: payload.candidate });
    });

    // Normalized call lifecycle events
    socket.on('call_rejected', (payload: { to?: string; from?: string }) => {
      const target = payload?.to;
      if (!target) return;
      ioInstance?.to(target).emit('call_rejected', { from: payload.from });
    });

    socket.on('call:rejected', (payload: { to?: string; from?: string }) => {
      const target = payload?.to;
      if (!target) return;
      ioInstance?.to(target).emit('call:rejected', { from: payload.from });
    });

    socket.on('reject_call', (payload: { to?: string; from?: string }) => {
      const target = payload?.to;
      if (!target) return;
      ioInstance?.to(target).emit('call_rejected', { from: payload.from });
    });

    socket.on('end_call', (payload: { to?: string; from?: string; reason?: string }) => {
      const target = payload?.to;
      if (!target) return;
      ioInstance?.to(target).emit('call_ended', { from: payload.from, reason: payload.reason });
    });

    socket.on('call_ended', (payload: { to?: string; from?: string; reason?: string }) => {
      const target = payload?.to;
      if (!target) return;
      ioInstance?.to(target).emit('call_ended', { from: payload.from, reason: payload.reason });
    });

    socket.on('call:hangup', (payload: { to?: string; from?: string; reason?: string }) => {
      const target = payload?.to;
      if (!target) return;
      ioInstance?.to(target).emit('call:hangup', { from: payload.from, reason: payload.reason });
    });

    // Higher-level incoming call event used by clients to show ringing UI
    socket.on('start_call', (payload: { to?: string; from?: any; offer?: any; callType?: string }) => {
      const target = payload?.to;
      if (!target) return;
      // forward under two names to support clients listening to either
      ioInstance?.to(target).emit('call:incoming', { offer: payload.offer, from: payload.from, callType: payload.callType });
      ioInstance?.to(target).emit('incoming_call', { offer: payload.offer, from: payload.from, callType: payload.callType });
    });

    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", socket.id, "Reason:", reason);
    });

    // WebRTC signaling events
    socket.on(
      "start_call",
      (data: {
        to: string;
        from: { id: string; name: string };
        signal: any;
      }) => {
        const { to, from, signal } = data;
        const toSocket = findSocketByUserId(to);
        if (toSocket) {
          ioInstance?.to(toSocket.id).emit("call:incoming", {
            signal,
            from,
          });
        } else {
          socket.emit("call:user:unavailable");
        }
      },
    );

    socket.on(
      "end_call",
      (data: { to: string; from: { id: string; name: string } }) => {
        const { to } = data;
        const toSocket = findSocketByUserId(to);
        if (toSocket) {
          ioInstance?.to(toSocket.id).emit("call:ended");
        }
      },
    );

    socket.on(
      "reject_call",
      (data: { to: string; from: { id: string; name: string } }) => {
        const { to } = data;
        const toSocket = findSocketByUserId(to);
        if (toSocket) {
          ioInstance?.to(toSocket.id).emit("call:rejected");
        }
      },
    );
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
    throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
  }
  return ioInstance;
}

function findSocketByUserId(userId: string): Socket | undefined {
  if (!ioInstance) return undefined;
  const sockets = Array.from(ioInstance.sockets.sockets.values());
  return sockets.find((socket) => socket.data.userId === userId);
}


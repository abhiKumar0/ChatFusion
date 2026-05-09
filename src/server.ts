import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Attach io to global so API routes can access it
  (global as any).io = io;

  // Register socket handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Auth middleware - verify user from socket handshake
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Join personal room for direct notifications
    socket.join(`user:${userId}`);

    // ── Presence ──
    socket.on('presence:online', () => {
      socket.broadcast.emit('presence:update', { userId, isOnline: true });
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit('presence:update', { userId, isOnline: false });
    });

    // ── Typing ──
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', { userId });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { userId });
    });

    // ── Conversation rooms ──
    socket.on('conversation:join', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ── Messaging ──
    socket.on('message:new', ({ conversationId, message }) => {
      socket.to(`conversation:${conversationId}`).emit('message:new', message);
    });

    socket.on('message:reaction', ({ conversationId, reaction }) => {
      socket.to(`conversation:${conversationId}`).emit('message:reaction', reaction);
    });

    socket.on('message:seen', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('message:seen', { userId, conversationId });
    });

    // ── WebRTC Call Signaling ──
    socket.on('call:initiate', ({ receiverId, callData }) => {
      io.to(`user:${receiverId}`).emit('call:incoming', callData);
    });

    socket.on('call:answer', ({ callerId, answerSdp }) => {
      io.to(`user:${callerId}`).emit('call:answered', { answerSdp });
    });

    socket.on('call:reject', ({ callerId }) => {
      io.to(`user:${callerId}`).emit('call:rejected');
    });

    socket.on('call:end', ({ otherUserId }) => {
      io.to(`user:${otherUserId}`).emit('call:ended');
    });

    socket.on('call:ice-candidate', ({ otherUserId, candidate }) => {
      io.to(`user:${otherUserId}`).emit('call:ice-candidate', { candidate });
    });
  });

  httpServer.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});
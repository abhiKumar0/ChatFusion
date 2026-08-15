import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(userId: string): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_APP_URL!, {
      auth: { userId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
import { io, Socket } from "socket.io-client";
import { useSocketStore } from "@/store/useSocketStore";
import { useCallStore } from "@/store/useCallStore";

let socket: Socket | null = null;

export const initSocketClient = (userId: string) => {
  if (socket) {
    console.log("Socket client already initialized.");
      return socket;
  }

  console.log(`Initializing socket client for user: ${userId}`);

  const { actions: { setSocket, setIsConnected } } = useSocketStore.getState();
  setIsConnected(false);

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
  console.log(`Attempting to connect to socket server at: ${socketUrl}`);

  socket = io(socketUrl, {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    timeout: 10000,
    auth: { userId }, // Pass userId for authentication
  });

  socket.on("connect", () => {
    if (!socket) {
     console.error('Socket is null on connect event');
      return; 
    }
    console.log("✅ Socket connected successfully:", socket.id);
    socket.emit("join", userId);
    setIsConnected(true);
    setSocket(socket);
  });

  socket.on("disconnect", (reason) => {
    console.warn("Socket disconnected:", reason);
    setIsConnected(false);
    setSocket(null);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error.message, error.cause);
    setIsConnected(false);
    setSocket(null);
  });

  // Call-related event listeners
    // Support multiple possible server event naming conventions by mapping
    // them to the store methods expected by `useCallStore`.
    socket.on("call:incoming", (payload: any) => {
      console.log('📞 Received incoming call (call:incoming):', payload);
      const { actions: { setCaller, setSignal, setIsReceivingCall } } = useCallStore.getState();
      // payload may contain { from, offer, callType }
      if (payload && payload.from && payload.signal) {
        setCaller(payload.from);
        setSignal(payload.signal);
        setIsReceivingCall(true);
      }
    });

    socket.on("incoming_call", (payload: any) => {
      console.log('📞 Received incoming call (incoming_call):', payload);
      const { actions: { setCaller, setSignal, setIsReceivingCall } } = useCallStore.getState();
      if (payload && payload.from && payload.signal) {
        setCaller(payload.from);
        setSignal(payload.signal);
        setIsReceivingCall(true);
      }
    });

    socket.on("call:finalized", (payload: any) => {
      console.log('Call finalized (call:finalized):', payload);
      // Some servers may send the final answer under a different event; the store listens
      // for "call_answer" and will handle applying the answer to the peer.
    });

    socket.on("call_answer", (payload: any) => {
      console.log('Received call_answer:', payload);
      // store listens to "call_answer" directly
    });

    socket.on("webrtc:ice-candidate", (payload: any) => {
      if (!socket) {
        console.error('Socket is null in webrtc:ice-candidate handler');
        return;
      }
      console.log('Received ICE candidate (webrtc:ice-candidate)');
      // Normalize to "webrtc_signal" which the store listens to. Emit it locally
      socket.emit('webrtc_signal', payload);
    });

    socket.on("webrtc_signal", (signal: any) => {
      console.log('Received webrtc_signal');
      // The store registers a listener for "webrtc_signal" on the socket itself
    });

    socket.on("call:rejected", (payload: any) => {
      if (!socket) {
        console.error('Socket is null in call:rejected handler');
        return;
      }
      console.log('Call was rejected by remote user.');
      // Emit normalized event name the store expects
      socket.emit('call_rejected', payload);
    });

    socket.on("call_rejected", (payload: any) => {
      console.log('call_rejected received');
      // Store listens to "call_rejected"
    });

    socket.on("call:hangup", (payload: any) => {
      if (!socket) {
        console.error('Socket is null in call:hangup handler');
        return;
      }
      console.log('Remote user hung up (call:hangup).');
      socket.emit('call_ended', payload);
    });

    socket.on("call_ended", (payload: any) => {
      console.log('call_ended received');
      // Store listens to "call_ended"
    });

  return socket;
};

export const getSocket = () => {
  return useSocketStore.getState().socket;
};

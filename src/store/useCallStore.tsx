import { create } from 'zustand';
import { Socket } from 'socket.io-client';

type CallStatus = 'idle' | 'receiving' | 'connecting' | 'in-progress';

interface CallState {
  callStatus: CallStatus;
  // legacy/alternate key used in some components — keep both for compatibility
  status?: CallStatus;
  connection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callId: string | null; // User ID of the person you are in a call with
  incomingOffer: RTCSessionDescriptionInit | null;
  incomingSenderId: string | null;
  socket: Socket | null;

  setSocket: (socket: Socket) => void;
  startCall: (recipientId: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  // ... initial state ...
  callStatus: 'idle',
  status: 'idle',
  connection: null,
  localStream: null,
  remoteStream: null,
  callId: null,
  incomingOffer: null,
  incomingSenderId: null,
  socket: null,

  setSocket: (socket) => {
    set({ socket });

    // 1. Listen for an incoming call offer
    socket.on('webrtc-offer', ({ senderId, offer }) => {
      set({ 
        callStatus: 'receiving', 
        status: 'receiving',
        incomingOffer: offer,
        incomingSenderId: senderId 
      });
    });

    // 2. Listen for the 'answer' to your call
    socket.on('webrtc-answer', ({ senderId, answer }) => {
      const { connection } = get();
      if (connection) {
        connection.setRemoteDescription(answer);
        set({ callStatus: 'in-progress', status: 'in-progress', callId: senderId });
      }
    });

    // 3. Listen for network candidates
    socket.on('webrtc-ice-candidate', ({ candidate }) => {
      const { connection } = get();
      if (connection) {
        connection.addIceCandidate(candidate);
      }
    });

    // 4. Listen for the other user hanging up
    socket.on('call-ended', () => {
      get().endCall(true); // 'true' to skip emitting 'call-ended' back
    });
  },

  startCall: async (recipientId) => {
    const { socket } = get();
    if (!socket) return;

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const pc = new RTCPeerConnection(); // Add STUN/TURN servers here

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    pc.ontrack = (event) => set({ remoteStream: event.streams[0] });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', { recipientId, candidate: event.candidate });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('webrtc-offer', { recipientId, offer });
    
    set({ 
      connection: pc, 
      localStream, 
      callStatus: 'connecting', 
      status: 'connecting',
      callId: recipientId 
    });
  },

  acceptCall: async () => {
    const { socket, incomingOffer, incomingSenderId } = get();
    if (!socket || !incomingOffer || !incomingSenderId) return;

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const pc = new RTCPeerConnection(); // Add STUN/TURN servers here

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    pc.ontrack = (event) => set({ remoteStream: event.streams[0] });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', { recipientId: incomingSenderId, candidate: event.candidate });
      }
    };

    await pc.setRemoteDescription(incomingOffer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('webrtc-answer', { recipientId: incomingSenderId, answer });
    
    set({ 
      connection: pc, 
      localStream, 
      callStatus: 'in-progress', 
      status: 'in-progress',
      callId: incomingSenderId,
      incomingOffer: null,
      incomingSenderId: null,
    });
  },

  rejectCall: () => {
    const { socket, incomingSenderId } = get();
    if (socket && incomingSenderId) {
      socket.emit('call-ended', { recipientId: incomingSenderId });
    }
    set({ 
      callStatus: 'idle',
      status: 'idle',
      incomingOffer: null,
      incomingSenderId: null
    });
  },

  endCall: (skipEmit = false) => {
    const { socket, callId, connection, localStream } = get();
    
    if (!skipEmit && socket && callId) {
      socket.emit('call-ended', { recipientId: callId });
    }

    localStream?.getTracks().forEach(track => track.stop());
    connection?.close();
    
    set({
      callStatus: 'idle',
      status: 'idle',
      connection: null,
      localStream: null,
      remoteStream: null,
      callId: null,
      incomingOffer: null,
      incomingSenderId: null,
    });
  },
}));
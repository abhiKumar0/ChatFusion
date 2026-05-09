import { create } from 'zustand';
import { getSocket } from '@/lib/socket';

type CallStatus = 'idle' | 'calling' | 'receiving' | 'connecting' | 'in-progress' | 'ended';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface CallState {
  callStatus: CallStatus;
  callId: string | null;
  connection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  otherUserId: string | null;
  incomingCallData: any | null;
  isVideo: boolean;
  isMicOn: boolean;
  isCameraOn: boolean;
  isCallMinimized: boolean;
  isScreenSharing: boolean;
  pendingIceCandidates: RTCIceCandidateInit[];

  startCall: (recipientId: string, isVideo: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  resetCall: () => void;
  toggleMic: () => void;
  toggleVideo: () => void;
  minimizeCall: () => void;
  restoreCall: () => void;
  handleRemoteAnswer: (answerSdp: RTCSessionDescriptionInit) => Promise<void>;
  handleRemoteIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  toggleScreenShare: () => Promise<void>;
}

// ── Helper: create a peer connection with ICE wired to socket ──
function createPeerConnection(otherUserId: string, onTrack: (stream: MediaStream) => void) {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
      useCallStore.setState({ callStatus: 'in-progress' });
    }
    if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
      useCallStore.getState().resetCall();
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      getSocket('').emit('call:ice-candidate', {
        otherUserId,
        candidate: event.candidate.toJSON(),
      });
    }
  };

  pc.ontrack = (event) => {
    onTrack(event.streams[0]);
  };

  return pc;
}

export const useCallStore = create<CallState>((set, get) => ({
  callStatus: 'idle',
  connection: null,
  localStream: null,
  remoteStream: null,
  callId: null,
  otherUserId: null,
  incomingCallData: null,
  isVideo: true,
  isMicOn: true,
  isCameraOn: true,
  isCallMinimized: false,
  isScreenSharing: false,
  pendingIceCandidates: [],

  // ── UI Controls ──
  toggleMic: () => {
    const { localStream, isMicOn } = get();
    localStream?.getAudioTracks().forEach(t => { t.enabled = !isMicOn; });
    set({ isMicOn: !isMicOn });
  },

  toggleVideo: () => {
    const { localStream, isCameraOn } = get();
    localStream?.getVideoTracks().forEach(t => { t.enabled = !isCameraOn; });
    set({ isCameraOn: !isCameraOn });
  },

  minimizeCall: () => set({ isCallMinimized: true }),
  restoreCall: () => set({ isCallMinimized: false }),

  // ── Start Call (Caller side) ──
  startCall: async (recipientId, isVideo) => {
    set({
      callStatus: 'calling',
      otherUserId: recipientId,
      isVideo,
      isCameraOn: isVideo,
      pendingIceCandidates: [],
    });

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!isVideo) localStream.getVideoTracks().forEach(t => { t.enabled = false; });

      const pc = createPeerConnection(recipientId, (remoteStream) => set({ remoteStream }));
      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Persist call to DB and notify receiver via Socket.IO
      const res = await fetch('/api/call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: recipientId, offerSdp: JSON.stringify(offer), isVideo }),
      });
      const callData = await res.json();

      set({ connection: pc, localStream, callId: callData.id, incomingCallData: callData });
    } catch (e) {
      console.error('startCall failed:', e);
      get().resetCall();
    }
  },

  // ── Accept Call (Receiver side) ──
  acceptCall: async () => {
    const { incomingCallData } = get();
    if (!incomingCallData) return;

    set({ callStatus: 'connecting', pendingIceCandidates: [] });

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const shouldEnableCamera = incomingCallData.isVideo ?? true;
      if (!shouldEnableCamera) localStream.getVideoTracks().forEach(t => { t.enabled = false; });

      const callerId = incomingCallData.callerId ?? incomingCallData.caller_id;
      const pc = createPeerConnection(callerId, (remoteStream) => set({ remoteStream }));
      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

      const offerSdp = typeof incomingCallData.offerSdp === 'string'
        ? JSON.parse(incomingCallData.offerSdp)
        : incomingCallData.offerSdp ?? incomingCallData.offer_sdp;

      await pc.setRemoteDescription(offerSdp);

      // Flush any ICE candidates that arrived before remote description was set
      const { pendingIceCandidates } = get();
      for (const c of pendingIceCandidates) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer via socket
      getSocket('').emit('call:answer', {
        callerId,
        answerSdp: JSON.stringify(answer),
      });

      // Persist answer to DB
      await fetch(`/api/call/${incomingCallData.id}/answer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerSdp: JSON.stringify(answer) }),
      });

      set({ connection: pc, localStream, callId: incomingCallData.id, otherUserId: callerId, pendingIceCandidates: [] });
    } catch (e) {
      console.error('acceptCall failed:', e);
      get().resetCall();
    }
  },

  // ── Remote SDP / ICE Handlers (called from RealtimeProvider socket events) ──
  handleRemoteAnswer: async (answerSdp) => {
    const { connection } = get();
    if (!connection || connection.signalingState !== 'have-local-offer') return;
    try {
      await connection.setRemoteDescription(answerSdp);
      const { pendingIceCandidates } = get();
      for (const c of pendingIceCandidates) {
        await connection.addIceCandidate(new RTCIceCandidate(c));
      }
      set({ pendingIceCandidates: [], callStatus: 'in-progress' });
    } catch (e) {
      console.error('handleRemoteAnswer failed:', e);
    }
  },

  handleRemoteIceCandidate: async (candidate) => {
    const { connection } = get();
    if (!connection || !connection.remoteDescription) {
      set(s => ({ pendingIceCandidates: [...s.pendingIceCandidates, candidate] }));
      return;
    }
    try {
      await connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('addIceCandidate error:', e);
    }
  },

  // ── Call Control ──
  rejectCall: () => {
    const { incomingCallData } = get();
    if (incomingCallData) {
      getSocket('').emit('call:reject', { callerId: incomingCallData.callerId ?? incomingCallData.caller_id });
      fetch(`/api/call/${incomingCallData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
    }
    get().resetCall();
  },

  endCall: () => {
    const { callId, otherUserId } = get();
    if (otherUserId) getSocket('').emit('call:end', { otherUserId });
    if (callId) {
      fetch(`/api/call/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' }),
      });
    }
    get().resetCall();
  },

  resetCall: () => {
    const { localStream, connection } = get();
    localStream?.getTracks().forEach(t => t.stop());
    connection?.close();
    set({
      callStatus: 'idle',
      connection: null,
      localStream: null,
      remoteStream: null,
      callId: null,
      otherUserId: null,
      incomingCallData: null,
      isVideo: false,
      isCallMinimized: false,
      isScreenSharing: false,
      pendingIceCandidates: [],
    });
  },

  // ── Screen Share ──
  toggleScreenShare: async () => {
    const { isScreenSharing, connection, localStream } = get();
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = connection?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(screenTrack);
        if (localStream) {
          const old = localStream.getVideoTracks()[0];
          if (old) { localStream.removeTrack(old); old.stop(); }
          localStream.addTrack(screenTrack);
        }
        screenTrack.onended = () => get().toggleScreenShare();
        set({ isScreenSharing: true, isCameraOn: false });
      } else {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        const sender = connection?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(cameraTrack);
        if (localStream) {
          const old = localStream.getVideoTracks()[0];
          if (old) { localStream.removeTrack(old); old.stop(); }
          localStream.addTrack(cameraTrack);
        }
        set({ isScreenSharing: false, isCameraOn: true });
      }
    } catch (e: any) {
      if (e.name !== 'NotAllowedError') console.error('toggleScreenShare error:', e);
      set({ isScreenSharing: false });
    }
  },
}));

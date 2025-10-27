import { create } from "zustand";
import type { User } from "@/types/types";
import { getUserMedia, createPeer } from "@/lib/webrtc";
import { getSocket } from "@/lib/socket-client";

export type CallStatus = "idle" | "calling" | "ringing" | "connecting" | "active" | "ended" | "rejected";
export type CallType = "audio" | "video";
export type SocketStatus = "idle" | "connecting" | "connected" | "disconnected";

export interface CallState {
  status: CallStatus;
  socketStatus: SocketStatus;
  callType: CallType;
  isInitiator: boolean;
  offer: any | null;

  localUser: User | null;
  remoteUser: User | null;

  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;

  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;

  peer: any | null;

  // actions
  setSocketStatus: (status: SocketStatus) => void;
  initSocketListeners: () => void;

  startCall: (targetUser: User, callType?: CallType) => Promise<void>;
  receiveCall: (offer: any, fromUser: User, callType?: CallType) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: (reason?: string) => Promise<void>;

  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setPeer: (peer: any | null) => void;

  hangup: () => Promise<void>;
  toggleTrack: (kind: 'audio' | 'video', enabled: boolean) => void;

  cleanup: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  status: "idle",
  socketStatus: "idle",
  callType: "video",
  isInitiator: false,
  offer: null,
  localUser: null,
  remoteUser: null,
  localStream: null,
  remoteStream: null,
  screenStream: null,
  peer: null,
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,

  setSocketStatus: (status) => set({ socketStatus: status }),

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("connect", () => set({ socketStatus: "connected" }));
    socket.on("disconnect", () => set({ socketStatus: "disconnected" }));

    // Listen for both normalized and namespaced server events to be robust
    socket.off("incoming_call");
    socket.on("incoming_call", (payload: { offer: any; from: User; callType?: CallType }) => {
      // store incoming offer and caller
      set({
        offer: payload.offer,
        remoteUser: payload.from,
        isInitiator: false,
        callType: payload.callType || "video",
        status: "ringing",
      });
    });

    socket.off("call:incoming");
    socket.on("call:incoming", (payload: { offer: any; from: User; callType?: CallType }) => {
      set({
        offer: payload.offer,
        remoteUser: payload.from,
        isInitiator: false,
        callType: payload.callType || "video",
        status: "ringing",
      });
    });

    socket.off("call_ended");
    socket.on("call_ended", async () => {
      await get().cleanup();
      set({ status: "ended", offer: null, remoteUser: null });
    });

    socket.off("call:hangup");
    socket.on("call:hangup", async (payload?: any) => {
      await get().cleanup();
      set({ status: "ended", offer: null, remoteUser: null });
    });

    socket.off("call_rejected");
    socket.on("call_rejected", () => {
      set({ status: "rejected" });
      // cleanup after short delay
      setTimeout(() => get().cleanup(), 500);
    });

    socket.off("call:rejected");
    socket.on("call:rejected", () => {
      set({ status: "rejected" });
      setTimeout(() => get().cleanup(), 500);
    });

    socket.off("call_answer");
    socket.on("call_answer", (answer: any) => {
      // send answer to peer
      const peer = get().peer;
      if (peer && typeof peer.signal === "function") {
        peer.signal(answer);
      }
      set({ status: "connecting" });
    });

    socket.off("call:finalized");
    socket.on("call:finalized", (payload: { answer: any }) => {
      const answer = payload?.answer;
      const peer = get().peer;
      if (peer && typeof peer.signal === "function" && answer) {
        peer.signal(answer);
      }
      set({ status: "connecting" });
    });

    socket.off("webrtc_signal");
    socket.on("webrtc_signal", (signal: any) => {
      const peer = get().peer;
      if (peer && typeof peer.signal === "function") {
        peer.signal(signal);
      }
    });

    socket.off("webrtc:ice-candidate");
    socket.on("webrtc:ice-candidate", (payload: any) => {
      // payload may include { candidate }
      const peer = get().peer;
      const signal = payload?.candidate || payload;
      if (peer && typeof peer.signal === "function" && signal) {
        peer.signal(signal);
      }
    });

    socket.off("webrtc:answer");
    socket.on("webrtc:answer", (payload: any) => {
      const answer = payload?.answer || payload;
      const peer = get().peer;
      if (peer && typeof peer.signal === "function" && answer) {
        peer.signal(answer);
      }
      set({ status: "connecting" });
    });

    socket.off("webrtc:offer");
    socket.on("webrtc:offer", (payload: any) => {
      const offer = payload?.offer || payload;
      // If we are not yet the non-initiator, store the offer and set ringing state
      const remoteUser = payload?.from ? { id: payload.from } as any : null;
      if (offer) {
        set({ offer, remoteUser, isInitiator: false, status: 'ringing' });
      }
    });
  },

  startCall: async (targetUser, callType = "video") => {
    const socket = getSocket();
    if (!socket || socket.connected === false) {
      set({ socketStatus: "disconnected" });
      throw new Error("Socket not connected");
    }

    try {
      const stream = await getUserMedia(callType === "video", true);
      set({ localStream: stream, isInitiator: true, remoteUser: targetUser, callType, status: "calling" });

      // create peer as initiator
      const peer = createPeer(true, stream, socket, targetUser.id);
      set({ peer });

      // when peer emits signal, emit to socket (createPeer should wire this)
    } catch (err) {
      console.error("startCall error", err);
      set({ status: "idle", localStream: null });
      throw err;
    }
  },

  receiveCall: (offer, fromUser, callType = "video") => {
    // store incoming call info (handled by socket listener too)
    set({ offer, remoteUser: fromUser, isInitiator: false, callType, status: "ringing" });
  },

  acceptCall: async () => {
    const socket = getSocket();
    const { offer, remoteUser, callType } = get();
    if (!socket) {
      console.warn('acceptCall: socket is not initialized');
      set({ status: 'idle' });
      return;
    }
    if (!offer || !remoteUser) {
      set({ status: "idle" });
      return;
    }

    try {
      const stream = await getUserMedia(callType === "video", true);
      set({ localStream: stream, status: "connecting", isInitiator: false });

      // create peer as non-initiator
      const peer = createPeer(false, stream, socket, remoteUser.id);
      set({ peer });

      // let createPeer handle signaling (it should emit answer to server)
    } catch (err) {
      console.error("acceptCall error", err);
      set({ status: "idle" });
    }
  },

  rejectCall: async () => {
    const socket = getSocket();
    const remoteUser = get().remoteUser;
    if (socket && remoteUser) {
      // Emit a few common event names so server implementations with different naming
      // conventions will receive the message.
      socket.emit("reject_call", { to: remoteUser.id });
      socket.emit("call_rejected", { to: remoteUser.id });
      socket.emit("call:rejected", { to: remoteUser.id });
    }
    set({ status: "rejected" });
    setTimeout(() => get().cleanup(), 300);
  },

  endCall: async (reason?: string) => {
    const socket = getSocket();
    const remoteUser = get().remoteUser;
    if (socket && remoteUser) {
      // Emit several variants for server compatibility
      socket.emit("end_call", { to: remoteUser.id, reason });
      socket.emit("call_ended", { to: remoteUser.id, reason });
      socket.emit("call:hangup", { to: remoteUser.id, reason });
    }
    await get().cleanup();
    set({ status: "ended", offer: null, remoteUser: null });
  },

  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setPeer: (peer) => set({ peer }),

  hangup: async () => {
    // simply call endCall which handles emitting to the server and cleanup
    await get().endCall();
  },

  toggleTrack: (kind, enabled) => {
    const s = get().localStream;
    if (!s) return;
    try {
      if (kind === 'audio') {
        s.getAudioTracks().forEach(t => { t.enabled = enabled; });
        set({ isAudioEnabled: enabled });
      } else {
        s.getVideoTracks().forEach(t => { t.enabled = enabled; });
        set({ isVideoEnabled: enabled });
      }
    } catch (e) {
      console.warn('toggleTrack error', e);
    }
  },

  cleanup: () => {
    const { peer, localStream, remoteStream, screenStream } = get();

    try {
      if (peer && typeof peer.destroy === "function") {
        peer.destroy();
      }
    } catch (e) {
      // ignore
    }

    const stopTracks = (s?: MediaStream | null) => {
      if (!s) return;
      try {
        s.getTracks().forEach((t) => t.stop());
      } catch (e) {
        // ignore
      }
    };

    stopTracks(localStream);
    stopTracks(remoteStream);
    stopTracks(screenStream);

    set({
      peer: null,
      localStream: null,
      remoteStream: null,
      screenStream: null,
      offer: null,
      isInitiator: false,
      status: "idle",
      remoteUser: null,
    });
  },
}));
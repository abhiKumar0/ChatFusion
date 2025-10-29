import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { User } from "@/types/types";
import { Socket } from "socket.io-client";
import { createPeer, getUserMedia } from "@/lib/webrtc";

export type CallState = {
  call: {
    isReceivingCall?: boolean;
    isCalling?: boolean;
    isCallInProgress?: boolean;
    isCallConnected?: boolean;
    callType?: "video" | "audio";
    caller?: {
      id: string;
      name: string;
    };
    callingTo?: {
      id: string;
      name: string;
    };
    signal?: any;
    remoteUser?: User;
  };
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isChatOpen: boolean;
  isWhiteboardOpen: boolean;
  callStats: any;
  networkQuality: number;
  status: 'idle' | 'calling' | 'receiving' | 'connecting' | 'active' | 'rejected' | 'ended';
  localUser?: User;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  actions: {
    setIsReceivingCall: (isReceivingCall: boolean) => void;
    setIsCalling: (isCalling: boolean) => void;
    setIsCallInProgress: (isCallInProgress: boolean) => void;
    setIsCallConnected: (isCallConnected: boolean) => void;
    setCallType: (callType: "video" | "audio") => void;
    setCaller: (caller: { id: string; name: string }) => void;
    setCallingTo: (callingTo: { id: string; name: string }) => void;
    setSignal: (signal: any) => void;
    setLocalStream: (stream?: MediaStream) => void;
    setRemoteStream: (stream?: MediaStream) => void;
    setIsChatOpen: (isChatOpen: boolean) => void;
    setIsWhiteboardOpen: (isWhiteboardOpen: boolean) => void;
    setCallStats: (callStats: any) => void;
    setNetworkQuality: (networkQuality: number) => void;
    setStatus: (status: 'idle' | 'calling' | 'receiving' | 'connecting' | 'active' | 'rejected' | 'ended') => void;
    setLocalUser: (user?: User) => void;
    setIsAudioEnabled: (enabled: boolean) => void;
    setIsVideoEnabled: (enabled: boolean) => void;
    setIsScreenSharing: (sharing: boolean) => void;
    startCall: (targetUser: User, callType: "video" | "audio", socket: Socket) => void;
    reset: () => void;
  };
};

const initialState = {
  call: {
    isReceivingCall: false,
    isCalling: false,
    isCallInProgress: false,
    isCallConnected: false,
    callType: undefined,
    caller: undefined,
    callingTo: undefined,
    signal: undefined,
    remoteUser: undefined,
  },
  localStream: undefined,
  remoteStream: undefined,
  isChatOpen: false,
  isWhiteboardOpen: false,
  callStats: null,
  networkQuality: 0,
  status: 'idle',
  localUser: undefined,
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
};

export const useCallStore = create<CallState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,
      actions: {
        setIsReceivingCall: (isReceivingCall) =>
          set((state) => {
            state.call.isReceivingCall = isReceivingCall;
          }),
        setIsCalling: (isCalling) =>
          set((state) => {
            state.call.isCalling = isCalling;
          }),
        setIsCallInProgress: (isCallInProgress) =>
          set((state) => {
            state.call.isCallInProgress = isCallInProgress;
          }),
        setIsCallConnected: (isCallConnected) =>
          set((state) => {
            state.call.isCallConnected = isCallConnected;
          }),
        setCallType: (callType) =>
          set((state) => {
            state.call.callType = callType;
          }),
        setCaller: (caller) =>
          set((state) => {
            state.call.caller = caller;
          }),
        setCallingTo: (callingTo) =>
          set((state) => {
            state.call.callingTo = callingTo;
          }),
        setSignal: (signal) =>
          set((state) => {
            state.call.signal = signal;
          }),
        setLocalStream: (stream) =>
          set((state) => {
            state.localStream = stream;
          }),
        setRemoteStream: (stream) =>
          set((state) => {
            state.remoteStream = stream;
          }),
        setIsChatOpen: (isChatOpen) =>
          set((state) => {
            state.isChatOpen = isChatOpen;
          }),
        setIsWhiteboardOpen: (isWhiteboardOpen) =>
          set((state) => {
            state.isWhiteboardOpen = isWhiteboardOpen;
          }),
        setCallStats: (callStats) =>
          set((state) => {
            state.callStats = callStats;
          }),
        setNetworkQuality: (networkQuality) =>
          set((state) => {
            state.networkQuality = networkQuality;
          }),
        setStatus: (status) =>
          set((state) => {
            state.status = status;
          }),
        setLocalUser: (user) =>
          set((state) => {
            state.localUser = user;
          }),
        setIsAudioEnabled: (enabled) =>
          set((state) => {
            state.isAudioEnabled = enabled;
          }),
        setIsVideoEnabled: (enabled) =>
          set((state) => {
            state.isVideoEnabled = enabled;
          }),
        setIsScreenSharing: (sharing) =>
          set((state) => {
            state.isScreenSharing = sharing;
          }),
        startCall: async (targetUser, callType, socket) => {
          const stream = await getUserMedia(callType === "video", true);
          set((state) => {
            state.localStream = stream;
            state.call.isCalling = true;
            state.call.callType = callType;
            state.call.callingTo = {
              id: targetUser.id,
              name: targetUser.fullName,
            };
            state.call.remoteUser = targetUser;
          });

          const peer = createPeer(true, stream, socket, targetUser.id);

          peer.on("signal", (signal: any) => {
            socket.emit("start_call", {
              to: targetUser.id,
              from: {
                id: get().call.caller?.id,
                name: get().call.caller?.name,
              },
              signal,
            });
          });

          peer.on("stream", (remoteStream: MediaStream) => {
            set((state) => {
              state.remoteStream = remoteStream;
            });
          });
        },
        reset: () => set(initialState),
      },
    })),
  ),
);

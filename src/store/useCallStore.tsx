import { create } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';

type CallStatus = 'idle' | 'receiving' | 'connecting' | 'in-progress';

interface CallState {
  callStatus: CallStatus;
  status?: CallStatus; // legacy compatibility
  connection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callId: string | null; // User ID of the person you are in a call with
  incomingOffer: RTCSessionDescriptionInit | null;
  incomingSenderId: string | null;
  supabase: SupabaseClient | null;

  setSupabase: (client: SupabaseClient) => void;

  // Actions triggered by Realtime events
  onIncomingOffer: (senderId: string, offer: RTCSessionDescriptionInit) => void;
  onIncomingAnswer: (senderId: string, answer: RTCSessionDescriptionInit) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onCallEnded: () => void;

  // User actions
  startCall: (recipientId: string, myId: string) => Promise<void>;
  acceptCall: (myId: string) => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  callStatus: 'idle',
  status: 'idle',
  connection: null,
  localStream: null,
  remoteStream: null,
  callId: null,
  incomingOffer: null,
  incomingSenderId: null,
  supabase: null,

  setSupabase: (supabase) => set({ supabase }),

  onIncomingOffer: (senderId, offer) => {
    set({
      callStatus: 'receiving',
      status: 'receiving',
      incomingOffer: offer,
      incomingSenderId: senderId
    });
  },

  onIncomingAnswer: (senderId, answer) => {
    const { connection } = get();
    if (connection) {
      connection.setRemoteDescription(answer);
      set({ callStatus: 'in-progress', status: 'in-progress', callId: senderId });
    }
  },

  onIceCandidate: (candidate) => {
    const { connection } = get();
    if (connection) {
      connection.addIceCandidate(candidate);
    }
  },

  onCallEnded: () => {
    get().endCall();
  },

  startCall: async (recipientId, myId) => {
    const { supabase } = get();
    if (!supabase) return;

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    pc.ontrack = (event) => set({ remoteStream: event.streams[0] });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const channel = supabase.channel(`user:${recipientId}`);
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'webrtc-ice-candidate',
              payload: { candidate: event.candidate, senderId: myId }
            });
            // Don't unsubscribe immediately as multiple candidates may be generated
            // But we should manage channel cleanup ideally. 
            // For simplicity in this refactor, we rely on Supabase handling ephemeral channels or we could reuse a single channel.
            // A better pattern is to send to the user's channel without resubscribing every time if possible, 
            // but Supabase client requires subscription to send broadcast.
            // We'll leave it as is for now, but in production, we should cache the channel.
            supabase.removeChannel(channel);
          }
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send offer
    const channel = supabase.channel(`user:${recipientId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'webrtc-offer',
          payload: { senderId: myId, offer }
        });
        supabase.removeChannel(channel);
      }
    });

    set({
      connection: pc,
      localStream,
      callStatus: 'connecting',
      status: 'connecting',
      callId: recipientId
    });
  },

  acceptCall: async (myId) => {
    const { supabase, incomingOffer, incomingSenderId } = get();
    if (!supabase || !incomingOffer || !incomingSenderId) return;

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    pc.ontrack = (event) => set({ remoteStream: event.streams[0] });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const channel = supabase.channel(`user:${incomingSenderId}`);
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'webrtc-ice-candidate',
              payload: { candidate: event.candidate, senderId: myId }
            });
            supabase.removeChannel(channel);
          }
        });
      }
    };

    await pc.setRemoteDescription(incomingOffer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer
    const channel = supabase.channel(`user:${incomingSenderId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'webrtc-answer',
          payload: { senderId: myId, answer }
        });
        supabase.removeChannel(channel);
      }
    });

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
    const { supabase, incomingSenderId } = get();
    if (supabase && incomingSenderId) {
      const channel = supabase.channel(`user:${incomingSenderId}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'call-ended',
            payload: { recipientId: incomingSenderId }
          });
          supabase.removeChannel(channel);
        }
      });
    }
    set({
      callStatus: 'idle',
      status: 'idle',
      incomingOffer: null,
      incomingSenderId: null
    });
  },

  endCall: () => {
    const { supabase, callId, connection, localStream } = get();

    if (supabase && callId) {
      const channel = supabase.channel(`user:${callId}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'call-ended',
            payload: { recipientId: callId }
          });
          supabase.removeChannel(channel);
        }
      });
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
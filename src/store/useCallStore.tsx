import { create } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';
import { initiateCall, updateCallStatus, answerCall } from '@/lib/react-query/api';

type CallStatus = 'idle' | 'calling' | 'receiving' | 'connecting' | 'in-progress' | 'ended';

interface CallState {
  callStatus: CallStatus;
  callId: string | null;
  connection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  otherUserId: string | null;
  incomingCallData: any | null;
  supabase: SupabaseClient | null;
  isVideo: boolean;
  isMicOn: boolean;
  isCameraOn: boolean;
  callSubscription: any | null;
  pendingIceCandidates: RTCIceCandidateInit[]; // Buffer for incoming candidates
  bufferedIceCandidates: RTCIceCandidateInit[]; // Buffer for outgoing candidates
  isPeerOnline: boolean;

  setSupabase: (client: SupabaseClient) => void;
  startCall: (recipientId: string, isVideo: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => void;
  resetCall: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  subscribeToCall: (callId: string) => void;
  handleRemoteAnswer: (answerSdp: RTCSessionDescriptionInit) => Promise<void>;
  handleRemoteIceCandidate: (candidate: RTCIceCandidate) => Promise<void>;
  onIncomingOffer: (senderId: string, offer: RTCSessionDescriptionInit) => void;
  onIncomingAnswer: (senderId: string, answer: RTCSessionDescriptionInit) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onCallEnded: () => void;
}



export const useCallStore = create<CallState>((set, get) => ({
  callStatus: 'idle',
  connection: null,
  localStream: null,
  remoteStream: null,
  callId: null,
  otherUserId: null,
  incomingCallData: null,
  supabase: null,
  isVideo: true,
  isMicOn: true,
  isCameraOn: true,
  callSubscription: null,
  pendingIceCandidates: [], // Incoming candidates buffer
  bufferedIceCandidates: [], // Outgoing candidates buffer
  isPeerOnline: false,

  setSupabase: (supabase) => set({ supabase }),

  toggleMic: () => {
    const { localStream, isMicOn } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      set({ isMicOn: !isMicOn });
    }
  },

  toggleCamera: () => {
    const { localStream, isCameraOn } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOn;
      });
      set({ isCameraOn: !isCameraOn });
    }
  },

  // --- Realtime Subscription Listener ---
  subscribeToCall: (callId) => {
    const { supabase, handleRemoteAnswer, handleRemoteIceCandidate } = get();
    if (!supabase) return;

    // Unsubscribe from existing if any
    const existingSub = get().callSubscription;
    if (existingSub) {
      existingSub.unsubscribe();
    }

    const callChannel = supabase.channel(`call-signaling-${callId}`);

    callChannel
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls', filter: `id=eq.${callId}` },
        async (payload) => {
          const newCallData = payload.new;
          const currentStatus = get().callStatus;
          const connection = get().connection;

          // Only process answer if we're the caller and haven't connected yet
          // We check 'calling' status. Even if connection is null momentarily, we'll handle it in handleRemoteAnswer
          if (newCallData.answer_sdp && currentStatus === 'calling') {
            console.log('subscribeToCall: Processing remote answer');
            await handleRemoteAnswer(JSON.parse(newCallData.answer_sdp));
          }

          if (newCallData.status === 'ENDED' || newCallData.status === 'REJECTED' || newCallData.status === 'MISSED') {
            get().resetCall();
          }
        }
      )
      .on('broadcast', { event: 'ice_candidate' }, (payload) => {
        // console.log('🔔 Broadcast ICE candidate received:', payload);
        handleRemoteIceCandidate(payload.payload);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = callChannel.presenceState();
        const userIds = Object.keys(state);
        // console.log('👥 Presence sync:', userIds);

        // Simple logic: if more than 1 user is here, or if we see a user that isn't us (logic depending on auth)
        // For now, if we have > 1 presence entry (us + them), we assume peer is online.
        if (userIds.length > 1) {
          if (!get().isPeerOnline) {
            console.log('👥 Peer is online! Flushing outgoing candidates...');
            set({ isPeerOnline: true });
            // Flush outgoing buffer
            const { bufferedIceCandidates } = get();
            bufferedIceCandidates.forEach(c => {
              callChannel.send({
                type: 'broadcast',
                event: 'ice_candidate',
                payload: c
              });
            });
            set({ bufferedIceCandidates: [] });
          }
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👥 User joined:', key);
      })
      .subscribe(async (status, err) => {
        console.log(`📢 Call signaling channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          set({ callSubscription: callChannel });
          // console.log(`✅ Subscribed to call-signaling-${callId}`);

          // Track our presence
          const user = await supabase.auth.getUser();
          await callChannel.track({
            online: true,
            userId: user.data.user?.id,
            updatedAt: new Date().toISOString()
          });
        }
        if (err) {
          console.error("Realtime subscription failed:", err);
        }
      });
  },

  // --- Start Call Action (Caller) ---
  startCall: async (recipientId, isVideo) => {
    set({
      callStatus: 'calling',
      isVideo,
      otherUserId: recipientId,
      isPeerOnline: false,
      bufferedIceCandidates: [],
      pendingIceCandidates: []
    });

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      set({ localStream }); // Set immediately for UI feedback

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });

      pc.oniceconnectionstatechange = () => {
        console.log('🔵 ICE Connection State:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          set({ callStatus: 'in-progress' });
        }
      };

      // 1. Setup Trickle ICE Listener with Buffering
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const { isPeerOnline, callSubscription, bufferedIceCandidates } = get();
          const candidateJson = event.candidate.toJSON();

          if (isPeerOnline && callSubscription) {
            // console.log('🔵 Sending ICE candidate immediately');
            callSubscription.send({
              type: 'broadcast',
              event: 'ice_candidate',
              payload: candidateJson
            });
          } else {
            // console.log('🔵 Buffering ICE candidate (Peer not online yet)');
            set({ bufferedIceCandidates: [...bufferedIceCandidates, candidateJson] });
          }
        }
      };

      pc.ontrack = (event) => {
        // console.log('🔵 Received remote track:', event.track.kind);
        set({ remoteStream: event.streams[0] });
      };

      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Initialize call in DB
      const callData = await initiateCall({
        receiverId: recipientId,
        offerSdp: JSON.stringify(offer),
        isVideo
      });

      // Subscribe and Track Presence
      get().subscribeToCall(callData.id);

      set({
        connection: pc,
        localStream,
        callId: callData.id
      });

    } catch (e) {
      console.error("Failed to start call", e);
      get().resetCall();
    }
  },

  // --- Accept Call Action (Receiver) ---
  acceptCall: async () => {
    const { incomingCallData, supabase } = get();
    if (!incomingCallData || !supabase) return;

    try {
      set({
        callStatus: 'connecting',
        isPeerOnline: false, // Will verify via presence
        bufferedIceCandidates: [],
        pendingIceCandidates: []
      });

      const isVideo = incomingCallData.is_video ?? incomingCallData.isVideo ?? true;
      const localStream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      set({ localStream }); // Set immediately


      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });

      pc.oniceconnectionstatechange = () => {
        console.log('🟢 ICE Connection State:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          set({ callStatus: 'in-progress' });
        }
      };

      // Outgoing ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const { isPeerOnline, callSubscription, bufferedIceCandidates } = get();
          const candidateJson = event.candidate.toJSON();

          if (isPeerOnline && callSubscription) {
            callSubscription.send({
              type: 'broadcast',
              event: 'ice_candidate',
              payload: candidateJson
            });
          } else {
            set({ bufferedIceCandidates: [...bufferedIceCandidates, candidateJson] });
          }
        }
      };

      pc.ontrack = (event) => {
        set({ remoteStream: event.streams[0] });
      };

      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      // Subscribe to signaling channel
      get().subscribeToCall(incomingCallData.id);

      set({
        connection: pc,
        localStream,
        callId: incomingCallData.id,
        otherUserId: incomingCallData.caller_id,
        isVideo
      });

      // Handle Remote Offer
      const offerSdp = typeof incomingCallData.offer_sdp === 'string'
        ? JSON.parse(incomingCallData.offer_sdp)
        : incomingCallData.offer_sdp;

      await pc.setRemoteDescription(offerSdp);

      // Important: Process any buffered *incoming* ICE candidates now that remote description is set
      const { pendingIceCandidates } = get();
      if (pendingIceCandidates.length > 0) {
        // console.log(`🟢 Flushing ${pendingIceCandidates.length} buffered incoming candidates`);
        for (const candidate of pendingIceCandidates) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        set({ pendingIceCandidates: [] });
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send Answer
      await answerCall(incomingCallData.id, JSON.stringify(answer));

    } catch (e) {
      console.error('acceptCall: Failed', e);
      get().resetCall();
    }
  },

  // --- Realtime Handlers ---

  handleRemoteAnswer: async (answerSdp) => {
    const { connection, callStatus } = get();

    // FAILSAFE: If we got an answer, peer MUST be online.
    if (!get().isPeerOnline) {
      console.log('🛡️ Failsafe: Answer received, marking peer online & flushing candidates');
      set({ isPeerOnline: true });
      const { bufferedIceCandidates, callSubscription } = get();
      // Flush outgoing buffer
      if (callSubscription) {
        bufferedIceCandidates.forEach(c => {
          callSubscription.send({
            type: 'broadcast',
            event: 'ice_candidate',
            payload: c
          });
        });
        set({ bufferedIceCandidates: [] });
      }
    }

    // Retry loop to safely get connection
    let retryCount = 0;
    // ... rest of the function remains similar, but omitting for brevity in this replace call (Wait, I need to match exactly or replace the whole function)

    // I will replace the WHOLE function to be safe.
    let conn = connection;
    while (!conn && retryCount < 10) {
      await new Promise(r => setTimeout(r, 200));
      conn = get().connection;
      retryCount++;
    }

    if (!conn) {
      console.error('handleRemoteAnswer: Connection not found after retries');
      return;
    }

    if (conn.signalingState === 'stable') {
      console.log('handleRemoteAnswer: Connection already stable, ignoring');
      return;
    }

    if (conn.signalingState !== 'have-local-offer') {
      console.warn(`handleRemoteAnswer: Wrong state '${conn.signalingState}'.`);
      return;
    }

    try {
      await conn.setRemoteDescription(answerSdp);
      // console.log('handleRemoteAnswer: Remote Description Set');

      const { pendingIceCandidates } = get();
      if (pendingIceCandidates.length > 0) {
        for (const candidate of pendingIceCandidates) {
          await conn.addIceCandidate(new RTCIceCandidate(candidate));
        }
        set({ pendingIceCandidates: [] });
      }

      set({ callStatus: 'in-progress' });
    } catch (error) {
      console.error('handleRemoteAnswer: Error', error);
    }
  },


  handleRemoteIceCandidate: async (candidate) => {
    const { connection, pendingIceCandidates } = get();

    // FAILSAFE: If we get candidates, they are online.
    if (!get().isPeerOnline) {
      console.log('🛡️ Failsafe: Candidate received, marking peer online');
      set({ isPeerOnline: true });
      // We should flush here too
      const { bufferedIceCandidates, callSubscription } = get();
      if (callSubscription) {
        bufferedIceCandidates.forEach(c => {
          callSubscription.send({
            type: 'broadcast',
            event: 'ice_candidate',
            payload: c
          });
        });
        set({ bufferedIceCandidates: [] });
      }
    }

    // If no connection or no remote description, buffer it
    if (!connection || !connection.remoteDescription) {
      // console.log('📡 Buffering incoming ICE candidate (conn/remoteDesc missing)');
      set({ pendingIceCandidates: [...pendingIceCandidates, candidate] });
      return;
    }

    try {
      await connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e: any) {
      console.warn("📡 Error adding ICE candidate:", e.message);
    }
  },

  rejectCall: async () => {
    const { incomingCallData } = get();
    if (incomingCallData?.id) {
      await updateCallStatus(incomingCallData.id, 'REJECTED');
    }
    get().resetCall();
  },

  endCall: () => {
    const { callId } = get();
    if (callId) {
      updateCallStatus(callId, 'ENDED');
    }
    get().resetCall();
  },

  resetCall: () => {
    const { localStream, connection, callSubscription } = get();

    localStream?.getTracks().forEach(t => t.stop());
    connection?.close();
    callSubscription?.unsubscribe();

    set({
      callStatus: 'idle',
      connection: null,
      localStream: null,
      remoteStream: null,
      callId: null,
      otherUserId: null,
      incomingCallData: null,
      callSubscription: null,
      isVideo: false,
      pendingIceCandidates: [],
      bufferedIceCandidates: [],
      isPeerOnline: false
    });
  },

  onIncomingOffer: () => { },
  onIncomingAnswer: () => { },
  onIceCandidate: () => { },
  onCallEnded: () => { },
}));

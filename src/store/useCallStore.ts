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
  isCallMinimized: boolean;
  callSubscription: any | null;
  pendingIceCandidates: RTCIceCandidateInit[]; // Buffer for incoming candidates
  bufferedIceCandidates: RTCIceCandidateInit[]; // Buffer for outgoing candidates
  isPeerOnline: boolean;
  isScreenSharing: boolean;

  setSupabase: (client: SupabaseClient) => void;
  startCall: (recipientId: string, isVideo: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => void;
  resetCall: () => void;
  toggleMic: () => void;
  toggleVideo: () => Promise<void>;
  minimizeCall: () => void;
  restoreCall: () => void;
  subscribeToCall: (callId: string) => void;
  handleRemoteAnswer: (answerSdp: RTCSessionDescriptionInit) => Promise<void>;
  handleRemoteIceCandidate: (candidate: RTCIceCandidate) => Promise<void>;
  toggleScreenShare: () => Promise<void>;
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
  isCallMinimized: false,
  callSubscription: null,
  pendingIceCandidates: [], // Incoming candidates buffer
  bufferedIceCandidates: [], // Outgoing candidates buffer
  isPeerOnline: false,
  isScreenSharing: false,

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


  toggleVideo: async () => {
    const { localStream, isCameraOn } = get();

    if (!localStream) {
      console.error('toggleVideo: No local stream');
      return;
    }

    // Since we always have video tracks now, just toggle them on/off
    const videoTracks = localStream.getVideoTracks();

    if (videoTracks.length === 0) {
      console.error('toggleVideo: No video tracks available');
      return;
    }

    const newCameraState = !isCameraOn;
    videoTracks.forEach(track => {
      track.enabled = newCameraState;
    });

    set({ isCameraOn: newCameraState });
  },

  minimizeCall: () => {
    set({ isCallMinimized: true });
  },

  restoreCall: () => {
    set({ isCallMinimized: false });
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

          // Handle incoming answer (for initial call setup)
          if (newCallData.answer_sdp && currentStatus === 'calling') {
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

        if (userIds.length > 1) {
          if (!get().isPeerOnline) {
            set({ isPeerOnline: true });
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
      .on('presence', { event: 'join' }, () => {
        // peer joined the signaling channel
      })
      .subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          set({ callSubscription: callChannel });

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
      isVideo: true, // Always true - we always get video capability
      isCameraOn: isVideo, // Camera on only if video call
      otherUserId: recipientId,
      isPeerOnline: false,
      bufferedIceCandidates: [],
      pendingIceCandidates: []
    });

    try {
      // ALWAYS request video permission (even for audio calls)
      // This way we can toggle video on/off without renegotiation
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // For "audio calls", disable video track immediately
      if (!isVideo) {
        localStream.getVideoTracks().forEach(track => { track.enabled = false; });
      }

      set({ localStream }); // Set immediately for UI feedback

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });

      pc.oniceconnectionstatechange = () => {
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
            callSubscription.send({ type: 'broadcast', event: 'ice_candidate', payload: candidateJson });
          } else {
            set({ bufferedIceCandidates: [...bufferedIceCandidates, candidateJson] });
          }
        }
      };

      pc.ontrack = (event) => {
        set({ remoteStream: event.streams[0] });
      };

      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Initialize call in DB - store initial camera state preference
      const callData = await initiateCall({
        receiverId: recipientId,
        offerSdp: JSON.stringify(offer),
        isVideo: isVideo // Store the original preference (camera on/off initially)
      });

      // Subscribe and Track Presence
      get().subscribeToCall(callData.id);

      set({
        connection: pc,
        localStream,
        callId: callData.id,
        incomingCallData: callData, // Store call data with receiver info
        otherUserId: callData.receiver_id
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

      // Check if caller started with camera on or off
      // Since we now always send isVideo: true in DB, we need another way to know
      // For now, always get video but check the incomingCallData
      const callerHasVideo = incomingCallData.is_video ?? incomingCallData.isVideo ?? true;

      // ALWAYS request video permission (even for audio calls)
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // Match the caller's video state - if they started with camera off, we start with camera off too
      // But we'll default to camera on since the UI will show the toggle
      // Actually, let's always start with camera matching the call type
      const shouldEnableCamera = callerHasVideo;

      if (!shouldEnableCamera) {
        localStream.getVideoTracks().forEach(track => { track.enabled = false; });
      }

      set({ localStream, isCameraOn: shouldEnableCamera, isVideo: true });


      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });

      pc.oniceconnectionstatechange = () => {
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
        otherUserId: incomingCallData.caller_id
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
      await fetch('/api/call/pending', { method: 'DELETE' });

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
      return;
    }

    if (conn.signalingState !== 'have-local-offer') {
      console.warn(`handleRemoteAnswer: Unexpected signaling state '${conn.signalingState}'.`);
      return;
    }

    try {
      await conn.setRemoteDescription(answerSdp);

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
      set({ isPeerOnline: true });
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
      await updateCallStatus(incomingCallData.id, 'ENDED');
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
      isCallMinimized: false,
      pendingIceCandidates: [],
      bufferedIceCandidates: [],
      isPeerOnline: false
    });
  },

  toggleScreenShare: async () => {
    const {isScreenSharing, connection, localStream } = get();

    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: false});

        const screenTrack = screenStream.getVideoTracks()[0];

        //Replace video track with screen track
        const sender = connection?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        // Replace in local stream for previes
        if (localStream) {
          const oldVideoTrack = localStream.getVideoTracks()[0];
          if (oldVideoTrack) {
            localStream.removeTrack(oldVideoTrack);
            oldVideoTrack.stop();
          }
          localStream.addTrack(screenTrack);
        }

        // When user stops sharing from browser UI
        screenTrack.onended = () => {
          get().toggleScreenShare();
        };

        set({ isScreenSharing: true, isCameraOn: false });

      } else {
        // Switch back to camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];

        const sender = connection?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(cameraTrack);
        }

        if (localStream) {
          const oldVideoTrack = localStream.getVideoTracks()[0];
          if (oldVideoTrack) {
            localStream.removeTrack(oldVideoTrack);
            oldVideoTrack.stop();
          }
          localStream.addTrack(cameraTrack);
        }

        set({ isScreenSharing: false, isCameraOn: true });
      }

    } catch (e: any) {
      if (e.name != 'NotAllowedError') {
        console.error('Error toggling screen sharing', e);
      }

      set({ isScreenSharing: false });
    }
  }

}));

'use client'

import { useEffect, useRef } from "react";
import { useCallStore, CallState } from "@/store/useCallStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocketStore } from "@/store/useSocketStore";
import { createPeer, stopMediaStream } from "@/lib/webrtc";

export const CallManager = () => {
  const { socket, isConnected } = useSocketStore();
  const { user } = useAuthStore();
  const {
    call,
    localStream,
    remoteStream,
    actions: {
      setLocalStream,
      setRemoteStream,
      setIsCallConnected,
      setIsCallInProgress,
      setIsCalling,
      setIsReceivingCall,
      reset,
    },
  } = useCallStore() as CallState;

  const peerRef = useRef<any>(null);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleIncomingCall = (data: {
      from: { id: string; name: string };
      signal: any;
    }) => {
      setIsReceivingCall(true);
      useCallStore.setState((state) => {
        state.call.caller = data.from;
        state.call.signal = data.signal;
      });
    };

    const handleCallAccepted = (signal: any) => {
      setIsCallConnected(true);
      peerRef.current?.signal(signal);
    };

    const handleCallEnded = () => {
      if (localStream) {
        stopMediaStream(localStream);
      }
      if (remoteStream) {
        stopMediaStream(remoteStream);
      }
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      reset();
    };

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:ended", handleCallEnded);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:ended", handleCallEnded);
    };
  }, [socket, isConnected, user, localStream, remoteStream, reset, setIsCallConnected, setIsReceivingCall]);

  useEffect(() => {
    if (!call || !user) {
      console.log("No call data available.", call);
      return;
    }
    if (call.isCallInProgress && !call.isReceivingCall && !peerRef.current) {
      // This is the caller
      const start = async () => {
        if (!socket) return;
        if (!call.callingTo) {
          console.log("No callee information available.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        const peer = createPeer(true, stream, socket, call.callingTo.id);
        peerRef.current = peer;

        peer.on("signal", (signal: any) => {
          socket?.emit("start_call", { to: call.callingTo?.id, from: {id: user.id, name: user.fullName}, signal });
        });

        peer.on("stream", (remoteStream: MediaStream) => {
          setRemoteStream(remoteStream);
        });
      };
      start();
    }
  }, [call.isCallInProgress, call.isReceivingCall, call.callingTo, setLocalStream, setRemoteStream, socket, user]);


  useEffect(() => {
    if (!call) {
      console.log("No call data available.", call);
      return;
    }
    if (call.isCallInProgress && call.isReceivingCall && !peerRef.current) {
      // This is the receiver
      const answer = async () => {
        if (!call.caller) {
          console.log("No caller information available.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        const peer = createPeer(false, stream, socket, call.caller.id);
        peerRef.current = peer;

        peer.on("signal", (signal: any) => {
          socket?.emit("call:accept", { to: call.caller?.id, signal });
        });

        peer.on("stream", (remoteStream: MediaStream) => {
          setRemoteStream(remoteStream);
        });

        peer.signal(call.signal);
      };
      answer();
    }
  }, [call.isCallInProgress, call.isReceivingCall, call.caller, call.signal, setLocalStream, setRemoteStream, socket]);


  useEffect(() => {
    if (!call.isCallInProgress && peerRef.current) {
      endCall();
    }
  }, [call.isCallInProgress]);

  const endCall = () => {
    const to = call.caller?.id || call.callingTo?.id;
    if (to) {
      socket?.emit("call:end", { to });
    }

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (localStream) {
      stopMediaStream(localStream);
    }
    if (remoteStream) {
      stopMediaStream(remoteStream);
    }
    reset();
  };

  return null;
};

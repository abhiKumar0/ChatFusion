'use client';

import { useCallStore } from '@/store/useCallStore';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CallPage() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // Get live streams from the global store
  const { localStream, callStatus, remoteStream, endCall } = useCallStore();

  useEffect(() => {
    // Attach local stream
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  useEffect(() => {
    // Attach remote stream
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle hanging up
  const handleHangUp = () => {
    endCall();
    console.log('Call ended.');
    router.push('/'); // Go back to homepage after call ends
  };

  // If the user lands on this page but there's no call streams, redirect
  useEffect(() => {
    if (!localStream && !remoteStream) {
      console.log('No active call streams, redirecting to home.');
      router.push('/');
    }
  }, [localStream, remoteStream, router]);

// Show a connecting UI
  if (callStatus === 'connecting') {
    return <div>Connecting...</div>;
  }
  
  // Only show the call UI if the call is actually in progress
  if (callStatus === 'in-progress') {
    return (
      <div>
        <video ref={localVideoRef} autoPlay muted playsInline />
        <video ref={remoteVideoRef} autoPlay playsInline />
        <button onClick={handleHangUp}>End Call</button>
      </div>
    );
  }

  // Fallback for idle (which will be redirected)
  return <div>Loading...</div>;
}
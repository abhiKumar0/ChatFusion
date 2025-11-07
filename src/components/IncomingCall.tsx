'use client';

import { useCallStore } from '@/store/useCallStore';
import { useRouter } from 'next/navigation';

export default function IncomingCall() {
  const { callStatus, incomingSenderId, acceptCall, rejectCall } = useCallStore();
  const router = useRouter();

  if (callStatus !== 'receiving') {
    return null; // Not receiving a call
  }

  const handleAccept = async () => {
    await acceptCall();
    router.push(`/call/${incomingSenderId}`); // Go to the call page
  };

  const handleReject = () => {
    rejectCall();
  };

  return (
    <div style={{ /* Fixed-position modal styles */ }}>
      <h3>Incoming Call from {incomingSenderId}</h3>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleReject}>Decline</button>
    </div>
  );
}
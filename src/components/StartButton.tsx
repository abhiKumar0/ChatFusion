'use client';

import { useCallStore } from '@/store/useCallStore';
import { useRouter } from 'next/navigation';

export default function StartCallButton({ recipientId }: { recipientId: string }) {
  const { startCall, callStatus } = useCallStore();
  const router = useRouter();

  const handleCall = async () => {
    if (callStatus !== 'idle') return; // Don't allow starting a new call
    
    await startCall(recipientId);
    router.push(`/call/${recipientId}`); // Navigate to the call page
  };

  return (
    <button onClick={handleCall} disabled={callStatus !== 'idle'}>
      Start Call
    </button>
  );
}
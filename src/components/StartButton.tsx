'use client';

import { useCallStore } from '@/store/useCallStore';


import { Button } from '@/components/ui/button';
import { Phone, Video } from 'lucide-react';

export default function StartCallButton({ recipientId }: { recipientId: string }) {
  const { startCall, callStatus } = useCallStore();
  
  const handleCall = (video: boolean) => {
    console.log("recipientId", recipientId)
    if (callStatus !== 'idle') return;
    startCall(recipientId, video);
    // No need to navigate. The CallOverlay (in Layout) will appear when state changes to 'calling'.
  };

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full hover:bg-accent active:scale-95 transition-all duration-150"
        onClick={() => handleCall(false)}
        disabled={callStatus !== 'idle'}
        title="Voice Call"
      >
        <Phone className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full hover:bg-accent active:scale-95 transition-all duration-150"
        onClick={() => handleCall(true)}
        disabled={callStatus !== 'idle'}
        title="Video Call"
      >
        <Video className="h-4 w-4" />
      </Button>
    </div>
  );
}
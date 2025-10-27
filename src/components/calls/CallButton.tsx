"use client";

import { Phone, Video } from 'lucide-react';
import { useCallStore } from '@/store/useCallStore';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User } from '@/types/types';
import { checkWebRTCSupport } from '@/lib/webrtc';

interface CallButtonProps {
  targetUser: User;
  callType: 'audio' | 'video';
  variant?: 'icon' | 'full';
}

export function CallButton({ targetUser, callType, variant = 'icon' }: CallButtonProps) {
  const { startCall, socketStatus } = useCallStore();

  const handleCall = () => {
    const support = checkWebRTCSupport();
    if (!support.supported) {
      alert(support.error);
      return;
    }
    startCall(targetUser, callType);
  };

  const isDisabled = socketStatus !== 'connected';

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCall}
              disabled={isDisabled}
              className="w-10 h-10 rounded-full hover:bg-gray-700 disabled:opacity-50"
            >
              {callType === 'video' ? (
                <Video className="w-5 h-5" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isDisabled ? 'Connecting...' : (callType === 'video' ? 'Video call' : 'Voice call')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      onClick={handleCall}
      disabled={isDisabled}
      className="gap-2 disabled:opacity-50"
    >
      {callType === 'video' ? (
        <>
          <Video className="w-4 h-4" />
          Video Call
        </>
      ) : (
        <>
          <Phone className="w-4 h-4" />
          Voice Call
        </>
      )}
    </Button>
  );
}

'use client';

import { useCallStore } from '@/store/useCallStore';
import { Phone, Video, Maximize2 } from 'lucide-react';

export default function GlobalCallIndicator() {
  const {
    callStatus,
    isCallMinimized,
    isVideo,
    otherUserId,
    incomingCallData,
    restoreCall
  } = useCallStore();

  // Show indicator when call is in progress and minimized
  const shouldShow = (callStatus === 'in-progress' || callStatus === 'calling' || callStatus === 'connecting') && isCallMinimized;

  if (!shouldShow) {
    return null;
  }

  const otherUser = incomingCallData?.receiver || incomingCallData?.caller;
  const userName = otherUser?.fullName || otherUser?.username || 'User';

  return (
    <div
      onClick={restoreCall}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] cursor-pointer group"
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 border-2 border-white/20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {isVideo ? (
            <Video className="w-5 h-5 animate-pulse" />
          ) : (
            <Phone className="w-5 h-5 animate-pulse" />
          )}
          <span className="font-medium">
            {callStatus === 'calling' ? 'Calling' : callStatus === 'connecting' ? 'Connecting' : 'In call with'} {userName}
          </span>
        </div>
        <Maximize2 className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Animated ring */}
      <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping pointer-events-none"></div>
    </div>
  );
}
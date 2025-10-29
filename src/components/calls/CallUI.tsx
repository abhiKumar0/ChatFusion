'use client'

import { useCallStore } from "@/store/useCallStore";
import { VideoPlayer } from "./VideoPlayer";
import { CallControls } from "./CallControls";
import { IncomingCall } from "./IncomingCall";

export const CallUI = () => {
  const { call, localStream, remoteStream } = useCallStore();

  if (call.isReceivingCall) {
    return <IncomingCall />;
  }

  if (call.isCallInProgress) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
        <div className="relative w-full h-full flex items-center justify-center">
          {remoteStream && (
            <VideoPlayer stream={remoteStream} className="w-full h-full object-cover" />
          )}
          {localStream && (
            <div className="absolute bottom-4 right-4 w-48 h-36">
              <VideoPlayer stream={localStream} muted className="w-full h-full object-cover rounded-lg" />
            </div>
          )}
        </div>
        <CallControls />
      </div>
    );
  }

  return null;
};

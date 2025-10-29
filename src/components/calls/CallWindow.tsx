"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallStore } from '@/store/useCallStore';
import { VideoPlayer } from './VideoPlayer';
import { CallControls } from './CallControls';
import { NetworkIndicator } from './NetworkIndicator';

export default function CallWindow() {
  const {
    status,
    localStream,
    remoteStream,
    localUser,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    call: { remoteUser },
    actions: { setIsAudioEnabled, setIsVideoEnabled, setIsScreenSharing, reset, setStatus },
  } = useCallStore();

  const hangup = () => {
    reset();
    setStatus("ended");
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'active') {
        e.preventDefault();
        e.returnValue = '';
        hangup();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status, hangup, setStatus]);

  if (status === 'idle' || status === 'rejected' || status === 'ended') {
    return null;
  }

  const toggleTrack = (kind: 'audio' | 'video') => {
    if (!localStream) return;

    const tracks =
      kind === 'audio' ? localStream.getAudioTracks() : localStream.getVideoTracks();

    if (!tracks || tracks.length === 0) return;

    const newEnabled = !tracks[0].enabled;
    tracks.forEach((t) => {
      try {
        t.enabled = newEnabled;
      } catch {
        // ignore if setting fails for any reason
      }
    });

    if (kind === 'audio') {
      setIsAudioEnabled(newEnabled);
    } else {
      setIsVideoEnabled(newEnabled);
    }
  };

  const toggleScreenShare = () => {
    // Implement screen share toggle logic here
    console.log("toggleScreenShare");
    setIsScreenSharing(!isScreenSharing);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gray-950 z-50 flex flex-col"
    >
      <div className="flex-1 relative">
        {remoteStream && (
          <VideoPlayer
            stream={remoteStream}
            name={remoteUser?.fullName}
            className="w-full h-full"
          />
        )}

        {localStream && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-4 right-4 w-64 h-48 rounded-lg overflow-hidden shadow-2xl"
            drag
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <VideoPlayer
              stream={localStream}
              muted
              mirrored
              isLocal
              name={localUser?.fullName}
            />
          </motion.div>
        )}

        {/* <div className="absolute top-4 left-4">
          <NetworkIndicator />
        </div> */}

        {status !== 'active' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-white text-2xl font-medium mb-2"
              >
                {status === 'calling' && 'Calling...'}
                {status === 'connecting' && 'Connecting...'}
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {(localStream || remoteStream) && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <CallControls
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            onToggleAudio={() => toggleTrack('audio')}
            onToggleVideo={() => toggleTrack('video')}
            onToggleScreenShare={toggleScreenShare}
            onEndCall={hangup}
          />
        </div>
      )}
    </motion.div>
  );
}
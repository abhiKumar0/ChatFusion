"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCallStore } from '@/store/useCallStore';

interface CallControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export function CallControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
}: CallControlsProps) {
  return (
    <TooltipProvider>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="flex items-center justify-center gap-3 p-4 bg-black/60 backdrop-blur-xl rounded-2xl"
      >
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                onClick={onToggleAudio}
                className={cn(
                  "w-14 h-14 rounded-full transition-all",
                  isAudioEnabled
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-500 hover:bg-red-600"
                )}
              >
                {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isAudioEnabled ? 'Mute' : 'Unmute'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                onClick={onToggleVideo}
                className={cn(
                  "w-14 h-14 rounded-full transition-all",
                  isVideoEnabled
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-500 hover:bg-red-600"
                )}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isVideoEnabled ? 'Stop video' : 'Start video'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                onClick={() => { /* Screen share logic to be implemented */ }}
                className={cn(
                  "w-14 h-14 rounded-full transition-all",
                  isScreenSharing
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-700 hover:bg-gray-600"
                )}
              >
                <MonitorUp className="w-6 h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isScreenSharing ? 'Stop sharing' : 'Share screen'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                onClick={onEndCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-all"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>End call</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
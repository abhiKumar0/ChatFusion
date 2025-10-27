"use client";

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  mirrored?: boolean;
  name?: string;
  isLocal?: boolean;
  showAudioIndicator?: boolean;
  className?: string;
}

export function VideoPlayer({
  stream,
  muted = false,
  mirrored = false,
  name,
  isLocal = false,
  showAudioIndicator = true,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // Check if stream has video/audio tracks
      setHasVideo(stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled);
      setHasAudio(stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled);

      // Setup audio level monitoring if not muted
      if (!muted && stream.getAudioTracks().length > 0) {
        try {
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
          analyserRef.current.fftSize = 256;

          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          
          const updateAudioLevel = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
              setAudioLevel(average / 255);
            }
            requestAnimationFrame(updateAudioLevel);
          };
          
          updateAudioLevel();
        } catch (error) {
          console.error('Error setting up audio analyzer:', error);
        }
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, muted]);

  // Monitor track enabled status changes
  useEffect(() => {
    if (!stream) return;

    const handleTrackChange = () => {
      setHasVideo(stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled);
      setHasAudio(stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].enabled);
    };

    stream.getVideoTracks().forEach(track => {
      track.addEventListener('ended', handleTrackChange);
    });

    stream.getAudioTracks().forEach(track => {
      track.addEventListener('ended', handleTrackChange);
    });

    return () => {
      stream.getVideoTracks().forEach(track => {
        track.removeEventListener('ended', handleTrackChange);
      });
      stream.getAudioTracks().forEach(track => {
        track.removeEventListener('ended', handleTrackChange);
      });
    };
  }, [stream]);

  const isSpeaking = audioLevel > 0.1;

  return (
    <div className={cn("relative w-full h-full bg-gray-900 rounded-lg overflow-hidden", className)}>
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={cn(
          "w-full h-full object-cover",
          mirrored && "scale-x-[-1]",
          !hasVideo && "hidden"
        )}
      />

      {/* Placeholder when video is off */}
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            {name && (
              <p className="text-white font-medium text-lg">{name}</p>
            )}
          </div>
        </div>
      )}

      {/* Audio indicator ring */}
      {showAudioIndicator && isSpeaking && (
        <motion.div
          className="absolute inset-0 border-4 border-green-500 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Name and audio status overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium text-sm">{name || (isLocal ? 'You' : 'Participant')}</span>
          {showAudioIndicator && (
            <div className={cn(
              "p-1.5 rounded-full transition-colors",
              hasAudio ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              {hasAudio ? (
                <Mic className="w-4 h-4 text-green-500" />
              ) : (
                <MicOff className="w-4 h-4 text-red-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Local indicator */}
      {isLocal && (
        <div className="absolute top-4 left-4 px-2 py-1 bg-blue-500/80 backdrop-blur-sm rounded text-white text-xs font-medium">
          You
        </div>
      )}
    </div>
  );
}

'use client'
import React, { useEffect, useRef } from "react";

interface VideoPlayerProps {
  stream?: MediaStream;
  muted?: boolean;
  className?: string;
  name?: string;
  mirrored?: boolean;
  isLocal?: boolean;
}

export const VideoPlayer = ({ stream, muted = false, className, name, mirrored, isLocal }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
      />
      {name && (
        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md text-white text-sm">
          {name} {isLocal && '(You)'}
        </div>
      )}
    </div>
  );
};
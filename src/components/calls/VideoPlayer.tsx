import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
    stream: MediaStream | null;
    className?: string;
    muted?: boolean;
    autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    stream,
    className,
    muted = false,
    autoPlay = true
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            if (autoPlay) {
                videoRef.current.play().catch(e => console.error("Video play failed:", e));
            }
        } else if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [stream, autoPlay]);

    return (
        <video
            ref={videoRef}
            className={className}
            muted={muted}
            playsInline
            autoPlay={autoPlay}
        />
    );
};

export default VideoPlayer;

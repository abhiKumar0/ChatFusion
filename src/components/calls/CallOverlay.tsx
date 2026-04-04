'use client';

import React, { useEffect, useRef } from 'react';
import { useCallStore } from '@/store/useCallStore';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Minimize2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VideoPlayer from './VideoPlayer';


const CallOverlay = () => {
    const {
        callStatus,
        incomingCallData,
        acceptCall,
        rejectCall,
        endCall,
        localStream,
        remoteStream,
        isVideo,
        isMicOn,
        isCameraOn,
        isCallMinimized,
        otherUserId,
        toggleMic,
        toggleVideo,
        minimizeCall
    } = useCallStore();


    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(console.error);
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(console.error);
        }
    }, [remoteStream]);

    if (callStatus === 'idle' || isCallMinimized) return null;

    if (callStatus === 'receiving') {
        const caller = incomingCallData?.caller;
        // console.log("Caller data:", caller);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-background border border-border p-6 rounded-2xl shadow-xl w-full max-w-sm flex flex-col items-center gap-6 animate-in zoom-in-50 duration-300">
                    <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                            <AvatarImage src={caller?.avatar || ''} />
                            <AvatarFallback>{caller?.fullName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none"></div>
                    </div>

                    <div className="text-center">
                        <h3 className="text-xl font-semibold">
                            {incomingCallData?.is_video || incomingCallData?.isVideo ? 'Incoming Video Call...' : 'Incoming Voice Call...'}
                        </h3>
                        <p className="text-muted-foreground">{caller?.fullName || caller?.username || 'Unknown User'}</p>
                    </div>

                    <div className="flex w-full gap-4 mt-2">
                        <Button
                            variant="destructive"
                            className="flex-1 h-12 rounded-full gap-2"
                            onClick={() => rejectCall()}
                        >
                            <PhoneOff className="w-5 h-5" />
                            Decline
                        </Button>
                        <Button
                            variant="default"
                            className="flex-1 h-12 rounded-full gap-2 bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => acceptCall()}
                        >
                            <Phone className="w-5 h-5" />
                            Accept
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (callStatus === 'calling' || callStatus === 'connecting') {
        // Get the OTHER user (the person we're calling or connecting to)
        const otherUser = otherUserId === incomingCallData?.caller?.id
            ? incomingCallData?.caller
            : incomingCallData?.receiver;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden">
                {/* Local Video Preview (Background) */}
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm scale-x-[-1]"
                />

                <div className="relative z-10 flex flex-col items-center gap-8 text-white">
                    <div className="relative">
                        <Avatar className="h-32 w-32 border-4 border-white/10 shadow-2xl">
                            <AvatarImage src={otherUser?.avatar || ''} />
                            <AvatarFallback className="bg-primary/20 text-4xl">{otherUser?.fullName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 rounded-full animate-pulse ring-4 ring-primary/40 pointer-events-none"></div>
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-light">{otherUser?.fullName || otherUser?.username || 'Unknown User'}</h2>
                        <h2 className="text-2xl font-light">
                            {callStatus === 'calling' ? 'Calling...' : 'Connecting...'}
                        </h2>
                        <p className="text-white/60">
                            {callStatus === 'calling' ? 'Waiting for response' : 'Establishing connection'}
                        </p>
                    </div>

                    <Button
                        variant="destructive"
                        size="lg"
                        className="rounded-full h-16 w-16 p-0 mt-8 shadow-xl bg-red-500 hover:bg-red-600 border-none"
                        onClick={() => endCall()}
                    >
                        <PhoneOff className="w-7 h-7" />
                    </Button>
                </div>
            </div>
        );
    }

    if (callStatus === 'in-progress') {
        // Get the OTHER user (the remote person we're talking to)
        // otherUserId is set correctly in the store based on who initiated the call
        const otherUser = otherUserId === incomingCallData?.caller?.id
            ? incomingCallData?.caller
            : incomingCallData?.receiver;

        const hasRemoteVideo = remoteStream && isVideo;
        const hasLocalVideo = isCameraOn && localStream;

        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
                <div className="flex-1 relative overflow-hidden">
                    {/* Remote Video or Avatar */}
                    {hasRemoteVideo && remoteStream ? (
                        <VideoPlayer
                            stream={remoteStream}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        // Audio-only view - show avatar
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="relative">
                                <Avatar className="h-40 w-40 border-4 border-white/10 shadow-2xl">
                                    <AvatarImage src={otherUser?.avatar || ''} />
                                    <AvatarFallback className="bg-primary/20 text-6xl">
                                        {otherUser?.fullName?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 rounded-full animate-pulse ring-4 ring-primary/20 pointer-events-none"></div>
                            </div>
                            <div className="absolute bottom-1/3 text-center text-white">
                                <h2 className="text-3xl font-light mb-2">{otherUser?.fullName || otherUser?.username || 'User'}</h2>
                                <p className="text-white/60">{isVideo ? 'Video paused' : 'Voice call'}</p>
                            </div>
                        </div>
                    )}

                    {/* Local Video (PiP) - Only show if we have video */}
                    {hasLocalVideo && (
                        <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-72 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-white/10 z-20">
                            <VideoPlayer
                                stream={localStream}
                                muted
                                className="w-full h-full object-cover scale-x-[-1]"
                            />
                            <div className="absolute bottom-2 left-2 text-[10px] text-white/70 bg-black/40 px-2 py-1 rounded">You</div>
                        </div>
                    )}

                    {/* Local Avatar (PiP) - Show when video is off */}
                    {!hasLocalVideo && (
                        <div className="absolute top-4 right-4 w-24 h-24 bg-gray-900/80 rounded-full overflow-hidden shadow-2xl border-2 border-white/10 z-20 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-white/70 text-center">
                                <VideoOff className="w-8 h-8 mx-auto mb-1" />
                                <div className="text-[10px]">You</div>
                            </div>
                        </div>
                    )}

                    {/* Top left minimize button */}
                    <div className="absolute top-4 left-4 z-30">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 border-none text-white"
                            onClick={minimizeCall}
                            title="Minimize call"
                        >
                            <Minimize2 className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center items-center gap-6">
                        <Button
                            variant={isMicOn ? "secondary" : "destructive"}
                            size="icon"
                            className={`h-14 w-14 rounded-full backdrop-blur-md border-none text-white ${isMicOn ? "bg-white/10 hover:bg-white/20" : ""}`}
                            onClick={toggleMic}
                            title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                        >
                            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                        </Button>

                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-xl border-none"
                            onClick={() => endCall()}
                            title="End call"
                        >
                            <PhoneOff className="w-8 h-8" />
                        </Button>

                        <Button
                            variant={isVideo && isCameraOn ? "secondary" : "destructive"}
                            size="icon"
                            className={`h-14 w-14 rounded-full backdrop-blur-md border-none text-white ${isVideo && isCameraOn ? "bg-white/10 hover:bg-white/20" : ""}`}
                            onClick={toggleVideo}
                            title={isVideo ? (isCameraOn ? "Turn off camera" : "Turn on camera") : "Switch to video"}
                        >
                            {isVideo && isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default CallOverlay;

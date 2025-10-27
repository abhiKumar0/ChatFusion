import { Socket } from "socket.io-client";


export interface MediaDevices {
  audioInput: MediaDeviceInfo[];
  audioOutput: MediaDeviceInfo[];
  videoInput: MediaDeviceInfo[];
}

export interface CallStats {
  bitrate: number;
  packetLoss: number;
  latency: number;
  resolution: string;
  codec: string;
}

// Get available media devices
export async function getMediaDevices(): Promise<MediaDevices> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new Error('Media devices API is only available in browser environments');
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      audioInput: devices.filter(d => d.kind === 'audioinput'),
      audioOutput: devices.filter(d => d.kind === 'audiooutput'),
      videoInput: devices.filter(d => d.kind === 'videoinput'),
    };
  } catch (error) {
    console.error('Error getting media devices:', error);
    throw new Error('Failed to access media devices');
  }
}

// Request user media with constraints
export async function getUserMedia(
  video: boolean | MediaTrackConstraints = true,
  audio: boolean | MediaTrackConstraints = true,
  deviceId?: { video?: string; audio?: string }
): Promise<MediaStream> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new Error('getUserMedia is only available in browser environments');
  }

  try {
    const constraints: MediaStreamConstraints = {
      video: video ? (deviceId?.video ? { deviceId: { exact: deviceId.video } } : {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }) : false,
      audio: audio ? (deviceId?.audio ? { deviceId: { exact: deviceId.audio } } : {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }) : false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Error getting user media:', error);
    if ((error as Error).name === 'NotAllowedError') {
      throw new Error('Camera/Microphone access denied');
    } else if ((error as Error).name === 'NotFoundError') {
      throw new Error('No camera/microphone found');
    }
    throw error;
  }
}

// Get display media for screen sharing
export async function getDisplayMedia(): Promise<MediaStream> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new Error('getDisplayMedia is only available in browser environments');
  }

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
      } as MediaTrackConstraints,
      audio: false,
    });
    return stream;
  } catch (error) {
    console.error('Error getting display media:', error);
    throw new Error('Screen sharing cancelled or failed');
  }
}

// Toggle track enabled state
export function toggleTrack(stream: MediaStream, kind: 'audio' | 'video', enabled: boolean): void {
  const tracks = kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();
  tracks.forEach(track => {
    track.enabled = enabled;
  });
}

// Replace video track (for camera switching)
export async function replaceVideoTrack(
  peer: any,
  stream: MediaStream,
  newDeviceId: string
): Promise<void> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new Error('replaceVideoTrack is only available in browser environments');
  }

  try {
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: newDeviceId } }
    });
    
    const newVideoTrack = newStream.getVideoTracks()[0];
    const sender = (peer as any)._pc?.getSenders().find((s: RTCRtpSender) => 
      s.track?.kind === 'video'
    );
    
    if (sender) {
      await sender.replaceTrack(newVideoTrack);
      
      // Stop old video track
      stream.getVideoTracks().forEach(track => track.stop());
      
      // Remove old video tracks and add new one
      stream.getVideoTracks().forEach(track => stream.removeTrack(track));
      stream.addTrack(newVideoTrack);
    }
  } catch (error) {
    console.error('Error replacing video track:', error);
    throw error;
  }
}

// Apply noise suppression
export async function applyNoiseSuppression(
  stream: MediaStream,
  enabled: boolean
): Promise<void> {
  const audioTracks = stream.getAudioTracks();
  
  for (const track of audioTracks) {
    try {
      const constraints = track.getConstraints();
      await track.applyConstraints({
        ...constraints,
        noiseSuppression: enabled,
        echoCancellation: true,
      });
    } catch (error) {
      console.error('Error applying noise suppression:', error);
    }
  }
}

// Stop all tracks in a stream
export function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach(track => {
    track.stop();
    stream.removeTrack(track);
  });
}

// Create a simple peer connection
export function createPeer(
  initiator: boolean,
  stream: MediaStream,
  socket: Socket,
  targetUserId: string
): any {
  console.log('🔄 Creating peer connection as', initiator ? 'initiator' : 'answerer');
  
  if (typeof window === 'undefined') {
    throw new Error('WebRTC is only available in browser environments');
  }

  const Peer = require('simple-peer');
  
  // Basic configuration
  const config = {
    initiator,
    stream,
    trickle: true,
    config: {
      iceServers: [
        // Use a single reliable STUN server to start
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    }
  };

  console.log('⚙️ Peer config:', JSON.stringify(config, null, 2));
  
  const peer = new Peer(config);
  
  // Basic event handlers
  peer.on('error', (err: Error) => {
    console.error('❌ Peer error:', err);
  });
  
  peer.on('signal', (data: any) => {
    console.log('📡 Signal:', data.type || 'candidate');
    if (!socket || !targetUserId) return;

    const signalType = data.type;
    if (signalType === 'offer') {
      socket.emit('webrtc:offer', {
        to: targetUserId,
        from: socket.id,
        offer: data,
      });
    } else if (signalType === 'answer') {
      socket.emit('webrtc:answer', {
        to: targetUserId,
        from: socket.id,
        answer: data,
      });
    } else if (data.candidate) {
      // This is an ICE candidate
      socket.emit('webrtc:ice-candidate', {
        to: targetUserId,
        from: socket.id,
        candidate: data,
      });
    }
  });
  
  peer.on('connect', () => {
    console.log('✅ Peer connected');
  });
  
  peer.on('stream', (stream: MediaStream) => {
    console.log('🎥 Received remote stream');
  });
  
  peer.on('iceConnectionStateChange', () => {
    console.log('❄️ ICE state:', peer.iceConnectionState);
  });
  
  console.log('✅ Peer created successfully');
  return peer;
}

// Get call statistics
export async function getCallStats(peer: any): Promise<CallStats | null> {
  try {
    const pc = (peer as any)._pc as RTCPeerConnection;
    if (!pc) return null;

    const stats = await pc.getStats();
    let bitrate = 0;
    let packetLoss = 0;
    let latency = 0;
    let resolution = 'Unknown';
    let codec = 'Unknown';

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        bitrate = Math.round((report.bytesReceived * 8) / 1000);
        packetLoss = report.packetsLost || 0;
        
        if (report.frameWidth && report.frameHeight) {
          resolution = `${report.frameWidth}x${report.frameHeight}`;
        }
      }
      
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        latency = report.currentRoundTripTime ? Math.round(report.currentRoundTripTime * 1000) : 0;
      }
      
      if (report.type === 'codec' && report.mimeType) {
        codec = report.mimeType.split('/')[1] || 'Unknown';
      }
    });

    return {
      bitrate,
      packetLoss,
      latency,
      resolution,
      codec,
    };
  } catch (error) {
    console.error('Error getting call stats:', error);
    return null;
  }
}

// Check browser compatibility
export function checkWebRTCSupport(): { supported: boolean; error?: string } {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { 
      supported: false, 
      error: 'WebRTC is only available in browser environments' 
    };
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { 
      supported: false, 
      error: 'Your browser does not support WebRTC. Please use a modern browser.' 
    };
  }
  
  if (!window.RTCPeerConnection) {
    return { 
      supported: false, 
      error: 'WebRTC is not fully supported in your browser.' 
    };
  }
  
  return { supported: true };
}

// Calculate audio level from stream
export function getAudioLevel(stream: MediaStream): number {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
    return 0;
  }

  try {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 256;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    return average / 255; // Normalize to 0-1
  } catch (error) {
    console.error('Error calculating audio level:', error);
    return 0;
  }
}

// Debug Audio Issue - Paste this in browser console during a call

console.log('=== CALL DEBUG INFO ===');

const state = useCallStore.getState();

console.log('📊 Call Status:', state.callStatus);
console.log('🎥 Is Video:', state.isVideo);
console.log('🎤 Mic On:', state.isMicOn);
console.log('📹 Camera On:', state.isCameraOn);

console.log('\n🔊 LOCAL STREAM:');
if (state.localStream) {
  console.log('  Total tracks:', state.localStream.getTracks().length);
  console.log('  Audio tracks:', state.localStream.getAudioTracks().length);
  state.localStream.getAudioTracks().forEach((track, i) => {
    console.log(`    Audio ${i}:`, {
      id: track.id,
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState
    });
  });
  console.log('  Video tracks:', state.localStream.getVideoTracks().length);
  state.localStream.getVideoTracks().forEach((track, i) => {
    console.log(`    Video ${i}:`, {
      id: track.id,
      label: track.label,
      enabled: track.enabled,
      readyState: track.readyState
    });
  });
} else {
  console.log('  ❌ No local stream');
}

console.log('\n🔊 REMOTE STREAM:');
if (state.remoteStream) {
  console.log('  Total tracks:', state.remoteStream.getTracks().length);
  console.log('  Audio tracks:', state.remoteStream.getAudioTracks().length);
  state.remoteStream.getAudioTracks().forEach((track, i) => {
    console.log(`    Audio ${i}:`, {
      id: track.id,
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState
    });
  });
  console.log('  Video tracks:', state.remoteStream.getVideoTracks().length);
  state.remoteStream.getVideoTracks().forEach((track, i) => {
    console.log(`    Video ${i}:`, {
      id: track.id,
      label: track.label,
      enabled: track.enabled,
      readyState: track.readyState
    });
  });
} else {
  console.log('  ❌ No remote stream');
}

console.log('\n🔌 PEER CONNECTION:');
if (state.connection) {
  console.log('  Signaling State:', state.connection.signalingState);
  console.log('  ICE Connection State:', state.connection.iceConnectionState);
  console.log('  ICE Gathering State:', state.connection.iceGatheringState);
  console.log('  Connection State:', state.connection.connectionState);
} else {
  console.log('  ❌ No peer connection');
}

console.log('\n📺 VIDEO ELEMENTS:');
const videos = document.querySelectorAll('video');
videos.forEach((video, i) => {
  console.log(`Video ${i}:`, {
    muted: video.muted,
    autoplay: video.autoplay,
    srcObject: video.srcObject ? 'present' : 'missing',
    paused: video.paused,
    volume: video.volume
  });
  
  if (video.srcObject) {
    const stream = video.srcObject;
    console.log(`  Stream tracks:`, stream.getTracks().length);
    console.log(`    Audio:`, stream.getAudioTracks().length);
    console.log(`    Video:`, stream.getVideoTracks().length);
  }
});

console.log('\n✅ Debug complete!');
console.log('💡 If you see 0 audio tracks in remote stream, the issue is with WebRTC connection');
console.log('💡 If you see audio tracks but can\'t hear, check:');
console.log('   - Video element is not muted');
console.log('   - Video element volume is > 0');
console.log('   - Audio track enabled is true');
console.log('   - System/browser volume');

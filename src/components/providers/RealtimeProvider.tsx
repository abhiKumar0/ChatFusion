'use client';

import { useEffect } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useGetMe } from '@/lib/react-query/queries';
import { usePresenceStore } from '@/store/usePresenceStore';
import { useCallStore } from '@/store/useCallStore';
import { Call } from '@/types/types';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetMe();

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket(user.id);

    // ── Presence ──
    socket.emit('presence:online');

    socket.on('presence:update', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      const store = usePresenceStore.getState();
      const current = new Set(store.onlineUsers);
      if (isOnline) {
        current.add(userId);
      } else {
        current.delete(userId);
      }
      store.setOnlineUsers(Array.from(current));
    });

    // ── Incoming Call ──
    socket.on('call:incoming', (call: Call) => {
      useCallStore.setState({
        callStatus: 'receiving',
        incomingCallData: call,
      });
    });

    socket.on('call:ended', () => {
      useCallStore.getState().resetCall();
    });

    socket.on('call:rejected', () => {
      useCallStore.getState().resetCall();
    });

    // ── WebRTC Signaling ──
    socket.on('call:answered', ({ answerSdp }: { answerSdp: string }) => {
      useCallStore.getState().handleRemoteAnswer(JSON.parse(answerSdp));
    });

    socket.on('call:ice-candidate', ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      useCallStore.getState().handleRemoteIceCandidate(candidate as RTCIceCandidate);
    });

    return () => {
      disconnectSocket();
    };
  }, [user?.id]);

  return <>{children}</>;
}
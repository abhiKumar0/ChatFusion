'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { useCallStore } from '@/store/useCallStore';
import { Call } from '@/types/types';
import { useGetMe } from '@/lib/react-query/queries';
import { usePresenceStore } from '@/store/usePresenceStore';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetMe();
  const { setSupabase, handleRemoteAnswer } = useCallStore();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const callPollRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Supabase
  useEffect(() => {
    const supabase = createClient();
    setSupabase(supabase as any);
  }, [setSupabase]);

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();

    // ✅ Fetch presence from Redis every 30s
    const fetchPresence = async () => {
      try {
        const res = await fetch('/api/users/friends');
        const { friends } = await res.json();

        if (!friends?.length) return;

        const ids = friends.map((f: any) => f.id).join(',');
        const presenceRes = await fetch(`/api/presence?ids=${ids}`);
        const presence = await presenceRes.json();

        const onlineIds = Object.entries(presence)
          .filter(([_, isOnline]) => isOnline)
          .map(([id]) => id);

        usePresenceStore.getState().setOnlineUsers(onlineIds);
      } catch (err) {
        console.error('Presence fetch error:', err);
      }
    };

    fetchPresence();
    const presenceInterval = setInterval(fetchPresence, 30000);

    // ✅ 1. Presence heartbeat — every 30s
    const sendHeartbeat = () => {
      fetch('/api/presence/heartbeat', { method: 'POST' });
    };
    sendHeartbeat(); // immediately on mount
    heartbeatRef.current = setInterval(sendHeartbeat, 30000);

    // ✅ 2. Poll Redis for pending calls — every 2s
    // Much cheaper than hitting Supabase DB
    const checkForPendingCalls = async () => {
      try {
        const res = await fetch('/api/call/pending');
        const { call } = await res.json();

        if (call) {
          const store = useCallStore.getState();
          
          // Don't override if already connecting/in-progress
          if (store.callStatus === 'connecting' || 
              store.callStatus === 'in-progress' ||
              store.callStatus === 'calling') {
            return;
          }

          if (store.callStatus !== 'receiving' || store.incomingCallData?.id !== call.id) {
            useCallStore.setState({
              callStatus: 'receiving',
              incomingCallData: call,
            });
          }
        }
      } catch (err) {
        console.error('Call poll error:', err);
      }
    };

    checkForPendingCalls();
    callPollRef.current = setInterval(checkForPendingCalls, 2000);

    // ✅ 3. Keep Supabase realtime only for call status updates (ENDED/REJECTED)
    // Presence channel is completely removed
    const channel = supabase
      .channel(`calls-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls',
      }, (payload: any) => {
        const updated = payload.new as Call;
        const store = useCallStore.getState();

        if (updated.status === 'ENDED' || updated.status === 'REJECTED') {
          if (store.callId === updated.id || store.incomingCallData?.id === updated.id) {
            // Clear Redis key when call ends
            fetch('/api/call/pending', { method: 'DELETE' });
            store.resetCall();
          }
        }
      })
      .subscribe();

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (callPollRef.current) clearInterval(callPollRef.current);
      clearInterval(presenceInterval);
      supabase.removeChannel(channel);
    };
  }, [user, handleRemoteAnswer]);

  return <>{children}</>;
}
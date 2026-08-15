'use client';

import { useEffect, useMemo } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useGetConversations, useGetMe } from '@/lib/react-query/queries';
import { usePresenceStore } from '@/store/usePresenceStore';
import { useCallStore } from '@/store/useCallStore';
import { Call } from '@/types/types';
import { useGetFriends } from '@/lib/react-query/queries';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetMe();
  const {data: friends} = useGetFriends()
  const {data: conversations} = useGetConversations();


  // Collect unique user IDs of all friends and active chat contacts
  const contactIds = useMemo(() => {
    if (!user?.id) return []

    const ids = new Set<string>();

    friends?.forEach(f => ids.add(f.id))

    conversations?.forEach((convo: any) => {
      convo.allParticipants?.forEach((p: any) => {
        if (p.user.id !== user.id) {
          ids.add(p.user.id);
        }
      })
    })

    return Array.from(ids);
    
  }, [friends, conversations, user?.id])


  useEffect(() => {
      if (contactIds.length === 0) return;

      const updatePresenceList = async() => {
        try {
          const ids = contactIds.join(',');  
          const res = await fetch(`/api/presence/?ids=${ids}`);
        
          if (res.ok) {
            const presenceMap = await res.json();

            // Extract only the user IDs that are online
            const onlineIds = Object.keys(presenceMap).filter((id) => presenceMap[id]);

            //Hydrate the Store
            usePresenceStore.getState().setOnlineUsers(onlineIds);

          }
        } catch (error) {
          console.log("Error in updatePresenceList:", error);
        }
      }

      updatePresenceList();

    }, [contactIds])


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
'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useGetMe } from '@/lib/react-query/queries';
import { useCallStore } from '@/store/useCallStore';

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
    const [supabase] = useState(() => createClient());
    const { data: user } = useGetMe();
    const { setSupabase, onIncomingOffer, onIncomingAnswer, onIceCandidate, onCallEnded } = useCallStore();

    useEffect(() => {
        setSupabase(supabase);
    }, [supabase, setSupabase]);

    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase.channel(`user:${user.id}`);

        channel
            .on('broadcast', { event: 'webrtc-offer' }, ({ payload }) => {
                console.log('Received offer:', payload);
                onIncomingOffer(payload.senderId, payload.offer);
            })
            .on('broadcast', { event: 'webrtc-answer' }, ({ payload }) => {
                console.log('Received answer:', payload);
                onIncomingAnswer(payload.senderId, payload.answer);
            })
            .on('broadcast', { event: 'webrtc-ice-candidate' }, ({ payload }) => {
                console.log('Received candidate:', payload);
                onIceCandidate(payload.candidate);
            })
            .on('broadcast', { event: 'call-ended' }, ({ payload }) => {
                console.log('Received call-ended:', payload);
                onCallEnded();
            })
            .subscribe((status) => {
                console.log(`Subscribed to user channel ${user.id}:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, supabase, onIncomingOffer, onIncomingAnswer, onIceCandidate, onCallEnded]);

    return <>{children}</>;
};

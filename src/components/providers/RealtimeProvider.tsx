'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useCallStore } from '@/store/useCallStore';
import { Call } from '@/types/types';
import { useGetMe } from '@/lib/react-query/queries';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const { data: user } = useGetMe();
    const { setSupabase, handleRemoteAnswer } = useCallStore();

    // Initialize Supabase
    useEffect(() => {
        const supabase = createClient();
        setSupabase(supabase as any);
        console.log('🔌 RealtimeProvider: Initialized');
    }, [setSupabase]);

    // Call Listening Logic
    useEffect(() => {
        if (!user?.id) {
            console.log('📞 No user logged in');
            return;
        }

        console.log('📞 Starting call listener for:', user.id);
        const supabase = createClient();

        const checkForPendingCalls = async () => {
            try {
                // console.log('📞 Polling for pending calls for:', user);
                const { data, error } = await supabase
                    .from('calls')
                    .select('*')
                    .eq('receiver_id', user.id)
                    .eq('status', 'PENDING')
                    .order('created_at', { ascending: false })
                    .limit(1);

                // console.log('📞 Poll result:', { data, error });

                if (data && data.length > 0) {
                    const pendingCall = data[0] as Call;
                    const store = useCallStore.getState();

                    // console.log('📞 🔥 PENDING CALL FOUND!', pendingCall);

                    if (store.callStatus !== 'receiving' || store.incomingCallData?.id !== pendingCall.id) {
                        console.log('📞 ⚡ UPDATING STORE TO RECEIVING');
                        useCallStore.setState({
                            callStatus: 'receiving',
                            incomingCallData: pendingCall,
                        });
                        console.log('📞 ✅ Store updated:', useCallStore.getState());
                    }
                }
            } catch (err) {
                console.error('📞 Poll error:', err);
            }
        };

        // Check immediately
        checkForPendingCalls();

        // Realtime subscription
        const channel = supabase
            .channel(`calls-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'calls',
                    filter: `receiver_id=eq.${user.id}`,
                },
                (payload: any) => {
                    console.log('📞 🔴 REALTIME INSERT!', payload);
                    const newCall = payload.new as Call;

                    if (newCall.status === 'PENDING') {
                        useCallStore.setState({
                            callStatus: 'receiving',
                            incomingCallData: newCall,
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'calls',
                },
                (payload: any) => {
                    console.log('📞 🟡 REALTIME UPDATE!', payload);
                    const updated = payload.new as Call;
                    const store = useCallStore.getState();

                    // NOTE: Answer handling is done in useCallStore.subscribeToCall
                    // Only handle call end/reject here for incoming calls that were never accepted

                    if (updated.status === 'ENDED' || updated.status === 'REJECTED') {
                        // Only reset if this is for our current call or an incoming call
                        if (store.callId === updated.id || store.incomingCallData?.id === updated.id) {
                            store.resetCall();
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('📞 Subscription:', status);
            });

        // Poll every 2 seconds
        const interval = setInterval(checkForPendingCalls, 2000);

        // Debug tools
        (window as any).callDebug = {
            check: checkForPendingCalls,
            state: () => useCallStore.getState(),
            userId: user.id,
        };

        console.log('📞 ✅ Listener active. Try: window.callDebug.check()');

        return () => {
            console.log('📞 Cleaning up');
            supabase.removeChannel(channel);
            clearInterval(interval);
            delete (window as any).callDebug;
        };
    }, [user, handleRemoteAnswer]);

    return <>{children}</>;
}

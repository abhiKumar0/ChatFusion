'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCallStore } from '@/store/useCallStore';
import { createClient } from '@/lib/supabase';
import { Call } from '@/types/types';

const CallListener = () => {
    const { user } = useAuthStore();
    const { setSupabase, handleRemoteAnswer } = useCallStore();

    useEffect(() => {
        const supabase = createClient();
        setSupabase(supabase as any);
        console.log('CallListener: Supabase client initialized');
    }, [setSupabase]);

    useEffect(() => {
        if (!user) {
            console.log('CallListener: No user, skipping subscription');
            return;
        }

        console.log('CallListener: Setting up call listener for user:', user.id);
        console.log('CallListener: User object:', user);
        const supabase = createClient();

        // Immediate check on mount
        const checkForPendingCalls = async () => {
            try {
                console.log('CallListener: Checking for pending calls...');
                const { data, error } = await supabase
                    .from('calls')
                    .select(`
                        *,
                        caller:User!caller_id(*),
                        receiver:User!receiver_id(*)
                    `)
                    .eq('receiver_id', user.id)
                    .eq('status', 'PENDING')
                    .order('created_at', { ascending: false })
                    .limit(1);

                console.log('CallListener: Query result:', { data, error });

                if (error) {
                    console.error('CallListener: Query error:', error);
                    return;
                }

                if (data && data.length > 0) {
                    const pendingCall = data[0] as Call;
                    const { callStatus, incomingCallData } = useCallStore.getState();

                    console.log('CallListener: Found pending call!', pendingCall);
                    console.log('CallListener: Current store state:', { callStatus, incomingCallData });

                    if (
                        callStatus !== 'receiving' ||
                        incomingCallData?.id !== pendingCall.id
                    ) {
                        console.log('CallListener: Setting store to receiving state');
                        useCallStore.setState({
                            callStatus: 'receiving',
                            incomingCallData: pendingCall,
                        });
                        console.log('CallListener: Store updated, new state:', useCallStore.getState());
                    }
                } else {
                    console.log('CallListener: No pending calls found');
                }
            } catch (error) {
                console.error('CallListener: Exception in checkForPendingCalls:', error);
            }
        };
        

        // Check immediately on mount
        checkForPendingCalls();

        // Subscribe to Realtime changes
        const channel = supabase
            .channel('calls-listener', {
                config: {
                    broadcast: { self: true },
                    presence: { key: user.id }
                }
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'calls',
                    filter: `receiver_id=eq.${user.id}`,
                },
                async (payload: any) => {
                    console.log('🔔 CallListener: INSERT event received:', payload);
                    const newCall = payload.new as Call;

                    if (newCall.status === 'PENDING') {
                        console.log('🔔 CallListener: Incoming PENDING call detected, refetching with user data');

                        // Refetch the call with joined user data
                        try {
                            const { data, error } = await supabase
                                .from('calls')
                                .select(`
                                    *,
                                    caller:User!caller_id(*),
                                    receiver:User!receiver_id(*)
                                `)
                                .eq('id', newCall.id)
                                .single();

                            if (error) {
                                console.error('❌ CallListener: Error refetching call:', error);
                                return;
                            }

                            if (data) {
                                console.log('✅ CallListener: Setting incoming call state');
                                useCallStore.setState({
                                    callStatus: 'receiving',
                                    incomingCallData: data,
                                });

                                // Play notification sound or show browser notification here if needed
                            }
                        } catch (err) {
                            console.error('❌ CallListener: Exception in INSERT handler:', err);
                        }
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
                    console.log('📝 CallListener: UPDATE event received:', payload);
                    const updatedCall = payload.new as Call;
                    const store = useCallStore.getState();
                    const currentCallId = store.callId;

                    if (
                        currentCallId &&
                        updatedCall.id === currentCallId &&
                        updatedCall.status === 'CONNECTED' &&
                        updatedCall.answer_sdp &&
                        updatedCall.caller_id === user.id
                    ) {
                        console.log('📞 CallListener: Answer received, connecting...');
                        handleRemoteAnswer(JSON.parse(updatedCall.answer_sdp));
                    }

                    if (
                        updatedCall.status === 'ENDED' ||
                        updatedCall.status === 'REJECTED'
                    ) {
                        console.log('📞 CallListener: Call ended/rejected');
                        if (
                            currentCallId === updatedCall.id ||
                            updatedCall.receiver_id === user.id
                        ) {
                            store.resetCall();
                        }
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('📡 CallListener: Subscription status:', status);
                if (err) {
                    console.error('❌ CallListener: Subscription error:', err);
                }
                if (status === 'SUBSCRIBED') {
                    console.log('✅ CallListener: Successfully subscribed to realtime updates');
                }
            });

        // Faster polling - check every 500ms (reduced from 2000ms)
        // This is a fallback in case realtime fails
        const pollInterval = setInterval(checkForPendingCalls, 500);

        // Expose debug function to window
        (window as any).debugCallListener = {
            checkNow: checkForPendingCalls,
            getStoreState: () => useCallStore.getState(),
            getUserId: () => user.id,
        };

        return () => {
            console.log('🧹 CallListener: Cleaning up subscriptions');
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
            delete (window as any).debugCallListener;
        };
    }, [user, handleRemoteAnswer]);

    return null;
};

export default CallListener;

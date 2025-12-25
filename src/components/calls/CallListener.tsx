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
                        caller:User!calls_caller_id_fkey(*),
                        receiver:User!calls_receiver_id_fkey(*)
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
            .channel('calls-listener')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'calls',
                    filter: `receiver_id=eq.${user.id}`,
                },
                (payload: any) => {
                    console.log('CallListener: INSERT event received:', payload);
                    const newCall = payload.new as Call;

                    if (newCall.status === 'PENDING') {
                        console.log('CallListener: Incoming PENDING call detected, refetching with user data');

                        // Refetch the call with joined user data
                        supabase
                            .from('calls')
                            .select(`
                                *,
                                caller:User!calls_caller_id_fkey(*),
                                receiver:User!calls_receiver_id_fkey(*)
                            `)
                            .eq('id', newCall.id)
                            .single()
                            .then(({ data, error }) => {
                                if (error) {
                                    console.error('CallListener: Error refetching call:', error);
                                    return;
                                }

                                if (data) {
                                    // console.log('CallListener: Refetched call with user data:', data);
                                    useCallStore.setState({
                                        callStatus: 'receiving',
                                        incomingCallData: data,
                                    });
                                }
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
                    console.log('CallListener: UPDATE event received:', payload);
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
                        console.log('CallListener: Answer received, connecting...');
                        handleRemoteAnswer(JSON.parse(updatedCall.answer_sdp));
                    }

                    if (
                        updatedCall.status === 'ENDED' ||
                        updatedCall.status === 'REJECTED'
                    ) {
                        console.log('CallListener: Call ended/rejected');
                        if (
                            currentCallId === updatedCall.id ||
                            updatedCall.receiver_id === user.id
                        ) {
                            store.resetCall();
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('CallListener: Subscription status:', status);
            });

        // Polling - check every 2 seconds
        const pollInterval = setInterval(checkForPendingCalls, 2000);

        // Expose debug function to window
        (window as any).debugCallListener = {
            checkNow: checkForPendingCalls,
            getStoreState: () => useCallStore.getState(),
            getUserId: () => user.id,
        };

        return () => {
            console.log('CallListener: Cleaning up subscriptions');
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
            delete (window as any).debugCallListener;
        };
    }, [user, handleRemoteAnswer]);

    return null;
};

export default CallListener;

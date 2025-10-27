"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/useAuthStore';
import { initSocketClient } from '@/lib/socket-client';

// Dynamically import all calling components to prevent SSR issues
const IncomingCall = dynamic(() => import('./IncomingCall'), { ssr: false });
const CallWindow = dynamic(() => import('./CallWindow'), { ssr: false });

export function ClientOnlyCallComponents() {
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
    if (user?.id) {
      initSocketClient(user.id);
    }
  }, [user]);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <IncomingCall />
      <CallWindow />
    </>
  );
}

// Dynamically import CallButton to prevent SSR issues
export const ClientOnlyCallButton = dynamic(() => import('./ClientOnlyCallButton'), { 
  ssr: false,
  loading: () => null
});
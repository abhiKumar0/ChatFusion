"use client";

import { useEffect, useState } from 'react';
import { CallButton } from './CallButton';
import { User } from '@/types/types';

interface ClientOnlyCallButtonProps {
  targetUser: User;
  callType: 'audio' | 'video';
  variant?: 'icon' | 'full';
}

export function ClientOnlyCallButton({ targetUser, callType, variant = 'icon' }: ClientOnlyCallButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <CallButton targetUser={targetUser} callType={callType} variant={variant} />;
}

export default ClientOnlyCallButton;

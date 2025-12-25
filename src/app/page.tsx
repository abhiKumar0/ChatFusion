'use client';

import React, { useEffect } from 'react';
import Welcome from '@/pages/Welcome';
import { useGetMe } from '@/lib/react-query/queries';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { data: user, isLoading } = useGetMe();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/chat');
    }
  }, [user, router]);

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (!user) {
    return <Welcome />;
  }

  return null; // Redirecting
}

/*
    1. Parent message thing
    2. Producting Signing in bug 
*/

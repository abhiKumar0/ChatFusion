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

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-black text-gray-200 flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div className="absolute left-[5%] top-[-15%] h-[600px] w-[600px] animate-[blob_8s_infinite] rounded-full bg-blue-500/60 blur-3xl filter"></div>
          <div className="absolute right-[-5%] top-[5%] h-[700px] w-[700px] animate-[blob_10s_infinite_2s] rounded-full bg-purple-600/70 blur-3xl filter"></div>
          <div className="absolute bottom-[-10%] left-[15%] h-[550px] w-[550px] animate-[blob_12s_infinite_4s] rounded-full bg-violet-500/65 blur-3xl filter"></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Welcome />;
  }

  return null; // Redirecting
}

/*
    1. Parent message thing
    2. Producting Signing in bug 
*/

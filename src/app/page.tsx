'use client';

import React, { useEffect } from 'react';
import Welcome from '@/pages/Welcome';
import { useGetMe } from '@/lib/react-query/queries';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

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
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-violet-600 mb-4">
            <MessageSquare className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div className="h-1 w-24 mx-auto bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-violet-500 rounded-full animate-[loading_1s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Welcome />;
  }

  return null;
}

'use client';

import React, { useEffect } from 'react';
import Welcome from '@/pages/Welcome';
import { useGetMe } from '@/lib/react-query/queries';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { Loading } from '@/components';

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
      <Loading />
    );
  }

  if (!user) {
    return <Welcome />;
  }

  return null;
}

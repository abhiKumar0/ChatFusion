'use client';

import Home from '@/pages/Home';
import Welcome from '@/pages/Welcome';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';

export default function HomePage() {

  const {user, getCurrentUser} = useAuthStore();

  useEffect(() => {
    getCurrentUser();
  },[])

  if (!user) {
    return <Welcome />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Home />
    </div>
  );
}
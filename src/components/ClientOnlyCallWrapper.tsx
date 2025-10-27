"use client";

import dynamic from 'next/dynamic';

// Dynamically import calling components to prevent SSR issues
const ClientOnlyCallComponents = dynamic(() => 
  import('@/components/calls/ClientOnlyCallComponents').then(mod => mod.ClientOnlyCallComponents), 
  { 
    ssr: false 
  }
);

export function ClientOnlyCallWrapper() {
  return <ClientOnlyCallComponents />;
}

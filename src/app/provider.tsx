'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, useEffect } from 'react'
import { useGetMe } from '@/lib/react-query/queries'
import { useCallStore } from '@/store/useCallStore'
import { initSocketClient } from '@/lib/socket-client'

const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { data: user, isLoading } = useGetMe();
  const setSocketStatus = useCallStore(state => state.setSocketStatus);
  const initSocketListeners = useCallStore(state => state.initSocketListeners);

  useEffect(() => {
    if (!user || isLoading) return;

    try {
      const socket = initSocketClient(user.id);
      if (socket) {
        initSocketListeners();
      }
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setSocketStatus('disconnected');
    }

    return () => {
      setSocketStatus('disconnected');
    };
  }, [user, isLoading, setSocketStatus, initSocketListeners]);

  return <>{children}</>;
};

const QueryProvider = ({children}: {children: ReactNode}) => {
    const [queryClient] = React.useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                gcTime: 5 * 60_000,
                refetchOnWindowFocus: false,
            },
        },
    }));

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        {children}
      </SocketProvider>
    </QueryClientProvider>
  )
}

export default QueryProvider
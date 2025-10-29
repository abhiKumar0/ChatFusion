'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, useEffect } from 'react'
import { useGetMe } from '@/lib/react-query/queries'
import { useSocketStore } from '@/store/useSocketStore'
import { initSocketClient } from '@/lib/socket-client'
import ClientOnly from '@/components/ClientOnly'
// import { ThemeProvider } from "next-themes"

const SocketInitializer = () => {
  const { data: user, isLoading } = useGetMe();
  const { actions: { setSocket, setIsConnected } } = useSocketStore();

  useEffect(() => {
    if (!user || isLoading) return;

    try {
      const socket = initSocketClient(user.id);
      setSocket(socket);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setIsConnected(false);
    }

    return () => {
      setIsConnected(false);
    };
  }, [user, isLoading, setSocket, setIsConnected]);

  return null;
}

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
      {/* Delay theme provider until after hydration to avoid pre-hydration DOM changes */}
      {/* <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      > */}
        <ClientOnly>
          <SocketInitializer />
        </ClientOnly>
        {children}
      {/* </ThemeProvider> */}
    </QueryClientProvider>
  )
}

export default QueryProvider
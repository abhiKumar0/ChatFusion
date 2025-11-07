'use client'

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useGetMe } from "@/lib/react-query/queries";
// import { useCallStore } from "@/store/useCallStore"; // Keep this commented if not used yet

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { data: user, isLoading: userLoading } = useGetMe();

  // const setSocketStatus = useCallStore(state => state.setSocketStatus);

  // 👇 UNCOMMENT THIS ENTIRE BLOCK 👇
  useEffect(() => {
    // Only create socket connection when user data is available and we're in browser
    if (!user || userLoading || typeof window === 'undefined') return;

    // Get socket URL based on environment
    const getSocketUrl = () => {
      // Use localhost:3001 for dev, or your production URL
      return process.env.NODE_ENV === 'production' 
        ? (process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin)
        : 'http://localhost:3000'; // Make sure this port matches your server!
    };

    // const setSocketStatus = 'connecting'; // Simplified for now

    const newSocket = io(getSocketUrl(), { 
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: { userId: user.id } // This sends the user.id on connection
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      // setSocketStatus('connected');
      if (user?.id) {
        newSocket.emit('join', user.id);
        console.log('Joined user room:', user.id);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      // setSocketStatus('disconnected');
      if (reason === "io server disconnect") {
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error('Socket URL attempted:', getSocketUrl());
      console.error('Environment:', process.env.NODE_ENV);
      // setSocketStatus('disconnected');
    });

    setSocket(newSocket);

    return () => {
      // setSocketStatus('disconnected');
      newSocket.close();
    };
  }, [user, userLoading]); // Removed setSocketStatus from dependencies for now

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
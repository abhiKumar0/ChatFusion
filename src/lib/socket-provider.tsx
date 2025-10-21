"use client"

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useGetMe } from "@/lib/react-query/queries";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { data: user, isLoading: userLoading } = useGetMe();

  useEffect(() => {
    // Only create socket connection when user data is available
    if (!user || userLoading) return;

    // Get socket URL based on environment
    const getSocketUrl = () => {
      if (process.env.NODE_ENV === 'production') {
        // In production, use the same domain as the app
        return process.env.APP_URL || window.location.origin;
      }
      return 'http://localhost:3000';
    };

    const newSocket = io(getSocketUrl(), { 
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      // Join user-specific room for notifications
      if (user?.id) {
        newSocket.emit('join', user.id);
        console.log('Joined user room:', user.id);
      }
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error('Socket URL attempted:', getSocketUrl());
      console.error('Environment:', process.env.NODE_ENV);
    });
    
    newSocket.on('receive_message', (data) => {
      console.log('Received message via socket:', data);
    });

    newSocket.on('user_typing', () => {
      console.log('User is typing...');
    });

    newSocket.on('user_stop_typing', () => {
      console.log('User stopped typing...');
    });
    
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, userLoading]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

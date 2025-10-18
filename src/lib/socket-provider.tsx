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
  const { data: user } = useGetMe();

  useEffect(() => {
    const newSocket = io(process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000', { 
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
      }
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    newSocket.on('receive_message', (data) => {
      console.log('Received message via socket:', data);
    });
    
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Join user room when user data is available
  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('join', user.id);
    }
  }, [socket, user?.id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

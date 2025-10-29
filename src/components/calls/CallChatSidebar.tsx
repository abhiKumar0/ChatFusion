"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCallStore } from '@/store/useCallStore';
import { useSocketStore } from '@/store/useSocketStore';
import { useGetMe } from '@/lib/react-query/queries';

interface ChatMessage {
  id: string;
  sender: {
    id: string;
    name: string;
  };
  message: string;
  timestamp: Date;
}

export function CallChatSidebar() {
  const { socket } = useSocketStore();
  const { data: currentUser } = useGetMe();
  const { isChatOpen, actions: { setIsChatOpen }, call: { remoteUser } } = useCallStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('call_chat_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('call_chat_message');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !currentUser || !remoteUser) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: {
        id: currentUser.id,
        name: currentUser.fullName,
      },
      message: newMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
    
    socket.emit('call_chat_message', {
      targetUserId: remoteUser.id,
      message,
    });

    setNewMessage('');
  };

  if (!isChatOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-xl border-l border-gray-700 flex flex-col z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Chat</h3>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsChatOpen(false)}
            className="text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start chatting without ending the call</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender.id === currentUser?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-white'
                  }`}
                >
                  {msg.sender.id !== currentUser?.id && (
                    <p className="text-xs opacity-70 mb-1">{msg.sender.name}</p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

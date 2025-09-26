import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { MoreVertical, Paperclip, Phone, Send, Smile, Video } from 'lucide-react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/useAuthStore'
import { useChatStore } from '@/store/useChatStore';
import { useGetConversationById, useGetMessages } from '@/lib/react-query/queries';
import {Message} from '@/types/types';

const ChatArea = () => {
  const [messages, setMessages] = useState([]);

  const { user } = useAuthStore();

  const {currentConversation} = useChatStore();

  const {data, loading, error} = useGetMessages(currentConversation || '');
  const {data: conversation, loading: convoLoading, error: convoError} = useGetConversationById(currentConversation || '');
  console.log("Messages Data:", data)
  
  useEffect(() => {
    if (!data || !data.pages) return;
    setMessages(
      data.pages.flatMap(page =>
        page.messages.map((msg: any) => ({
          ...msg,
          isOwn: msg.senderId === user?.id,
        }))
      ).reverse()
    );
  }, [data, user?.id]);
  
    
  if (loading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (error) return <div className="flex-1 flex items-center justify-center">Error loading messages</div>;
  console.log("Messages:", messages);
  if (currentConversation === null) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation to start chatting</div>;
  }
  return (
    <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="https://i.pravatar.cc/150?img=1" />
                <AvatarFallback>AJ</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">Alex Johnson</h3>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages && messages.map((message: Message) => (
              <div key={message.id} className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${message.isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary'} rounded-2xl p-3 px-4`}>
                  <p>{message.content}</p>
                  <span className="text-xs opacity-70 block text-right mt-1">{message.time}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input 
                placeholder="Type a message..." 
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              />
              <Button variant="ghost" size="icon" className="rounded-full">
                <Smile className="w-5 h-5" />
              </Button>
              <Button size="icon" className="rounded-full bg-primary hover:bg-primary/90">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
  )
}

export default ChatArea
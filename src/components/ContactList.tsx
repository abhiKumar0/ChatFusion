import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { PlusCircle, Search } from 'lucide-react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetConversations, useGetMe } from '@/lib/react-query/queries';
import { useSocket } from '@/lib/socket-provider';

const ContactList = () => {

  // const { conversations, getConversations, currentConversation, getConversationById } = useChatStore();
  const { data: conversations, loading, error} = useGetConversations();


  
  const {currentConversation, setCurrentConversation, setCurrentParticipant} = useChatStore();
  const socket = useSocket();

  const { data: user } = useGetMe();

// console.log("Conversations:", conversations);

  return (
    <div className="w-80 border-r border-border hidden lg:flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Messages</h2>
              <Button variant="ghost" size="icon" className="rounded-full">
                <PlusCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search conversations..." className="pl-10 bg-secondary" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2">
            {conversations && conversations.map((convo) => {
              const contact = convo.participants.filter(participant => participant.user.id !== user?.id)[0].user; 
              
            return (
              <div 
                key={convo.id}
                className={`p-3 flex items-center gap-3 hover:bg-secondary/50 cursor-pointer transition-colors ${currentConversation === convo.id ? 'bg-secondary' : ''}`}
                onClick={() => {
                  setCurrentConversation(convo.id);
                  setCurrentParticipant(contact);
                  socket?.emit('join_conversation', convo.id);
                }}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span 
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${contact.status === 'online' ? 'bg-green-500' : contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{contact.fullName}</h3>
                    <span className="text-xs text-muted-foreground">{contact.username}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">Hello</p>
                </div>
                {/* {contact.unread > 0 && (
                  <Badge variant="default" className="rounded-full h-5 min-w-5 flex items-center justify-center p-1">
                    {contact.unread}
                  </Badge>
                )} */}
              </div>
            )})}
          </div>
        </div>
  )
}

export default ContactList
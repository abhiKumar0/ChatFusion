import React, { useCallback, useMemo, useState } from 'react'
import { Button } from './ui/button'
import { PlusCircle, Search, AlertCircle } from 'lucide-react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';
import { useChatStore } from '@/store/useChatStore';
import { useGetConversations, useGetMe } from '@/lib/react-query/queries';
import { useSocket } from '@/lib/SocketProvider';
import { ConversationSkeleton } from './Loading';
import { ComponentErrorBoundary } from './ErrorBoundary';

interface ConversationItemProps {
  conversation: {
    id: string;
    lastMessage?: string;
    unreadCount?: number;
  };
  contact: {
    id: string;
    fullName?: string;
    username?: string;
    avatar?: string;
    status?: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem = React.memo(({ conversation, contact, isSelected, onClick }: ConversationItemProps) => {
  return (
    <div 
      className={`p-3 flex items-center gap-3 hover:bg-secondary/50 cursor-pointer transition-colors ${
        isSelected ? 'bg-secondary' : ''
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="relative">
        <Avatar>
          <AvatarImage src={contact?.avatar} />
          <AvatarFallback>{contact?.fullName?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        <span 
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
            contact?.status === 'online' ? 'bg-green-500' : 
            contact?.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium truncate">{contact?.fullName || 'Unknown User'}</h3>
          <span className="text-xs text-muted-foreground">{contact?.username || ''}</span>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {conversation?.lastMessage || 'No messages yet'}
        </p>
      </div>
      {(conversation?.unreadCount ?? 0) > 0 && (
        <Badge variant="default" className="rounded-full h-5 min-w-5 flex items-center justify-center p-1">
          {conversation.unreadCount}
        </Badge>
      )}
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

const ContactList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: conversations, isLoading, error } = useGetConversations();
  const { currentConversation, setCurrentConversation, setCurrentParticipant } = useChatStore();
  const socket = useSocket();
  const { data: user } = useGetMe();

  // Process and filter conversations
  const processedConversations = useMemo(() => {
    if (!conversations || !user) return [];
    
    return conversations.map((convo: any) => {
      const contact = convo.participants.find((participant: any) => participant.user.id !== user.id)?.user;
      return { ...convo, contact };
    }).filter((convo: any) => convo.contact); // Filter out conversations without valid contacts
  }, [conversations, user]);

  // Filter conversations based on search term
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return processedConversations;
    
    const searchLower = searchTerm.toLowerCase();
    return processedConversations.filter((convo: any) => 
      convo.contact.fullName?.toLowerCase().includes(searchLower) ||
      convo.contact.username?.toLowerCase().includes(searchLower)
    );
  }, [processedConversations, searchTerm]);

  // Handle conversation selection
  const handleConversationClick = useCallback((convo: { id: string; contact: any }) => {
    setCurrentConversation(convo.id);
    setCurrentParticipant(convo.contact);
    socket?.emit('join_conversation', convo.id);
  }, [setCurrentConversation, setCurrentParticipant, socket]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full lg:w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
        </div>
        <ConversationSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full lg:w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="font-medium mb-2">Failed to load conversations</h3>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ComponentErrorBoundary>
      <div className="w-full lg:w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Messages</h2>
            <Button variant="ghost" size="icon" className="rounded-full" title="New Conversation">
              <PlusCircle className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 bg-secondary" 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((convo: any) => (
              <ConversationItem
                key={convo.id}
                conversation={convo}
                contact={convo.contact}
                isSelected={currentConversation === convo.id}
                onClick={() => handleConversationClick(convo)}
              />
            ))
          ) : searchTerm ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Search className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No conversations found</p>
              <p className="text-sm text-muted-foreground">Try a different search term</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-muted-foreground mb-2">No conversations yet</p>
              <p className="text-sm text-muted-foreground mb-4">Start a new conversation to get chatting</p>
              <Button size="sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          )}
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}

export default ContactList
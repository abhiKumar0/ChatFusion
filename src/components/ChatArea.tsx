import React, { useEffect, useMemo } from 'react'
import { Button } from './ui/button'
import { MoreVertical, Paperclip, Phone, Send, Smile, Video } from 'lucide-react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatStore } from '@/store/useChatStore';
import { useGetMessages, useCreateMessage, useGetMe } from '@/lib/react-query/queries';
import { useSocket } from '@/lib/socket-provider';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '@/types/types';
import { encryptMessage } from '@/lib/crypto';
import { useCrypto } from '@/lib/crypto-context';
import Loading from './Loading';
import MessageBubble from './MessageBubble';

interface UIMessage extends Message {
  isOwn: boolean;
}

const ChatArea = () => {
  const [newMessage, setNewMessage] = React.useState('');

  //Current User
  const { data: user } = useGetMe();

  //Current Conversation's ID
  const {currentConversation, currentParticipant} = useChatStore();

  //Messages in Current Conversation
  const { data: messagePages, isLoading: messagesLoading, error: messagesError } = useGetMessages(currentConversation, !!currentConversation);

  //Instance for message creation
  const createMessageMutation = useCreateMessage();
  const queryClient = useQueryClient();

  // Crypto context for cached private key
  const { decryptedPrivateKey, isLoading: cryptoLoading } = useCrypto();

  // Socket subscription with optimistic updates
  const socket = useSocket();
  useEffect(() => {
    if (!socket || !currentConversation) return;
    socket.emit('join_conversation', currentConversation);
    const handler = (newMessage: Message) => {
      console.log('ChatArea received socket message:', newMessage);
      // Optimistic update - add to the last page (most recent messages)
      queryClient.setQueryData(['messages', currentConversation], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const data = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
        if (data.pages.length === 0) return data;
        
        // Add to the first page (most recent messages)
        const firstPage = data.pages[0];
        return {
          ...data,
          pages: [
            { ...firstPage, messages: [...firstPage.messages, newMessage] },
            ...data.pages.slice(1)
          ]
        };
      });
    };
    socket.on('receive_message', handler);
    return () => {
      socket.off('receive_message', handler);
    };
  }, [socket, currentConversation, queryClient]);
  
  
  //Combining multiple pages of messages into one
  const messages: UIMessage[] = useMemo(() => {
    if (!messagePages || !messagePages.pages) return [];
    return messagePages.pages
      .flatMap((page: unknown) => {
        const typedPage = page as { messages: Message[]; nextCursor: string | null };
        return typedPage.messages;
      })
      .map((msg: Message) => ({
        ...msg,
        isOwn: msg.senderId === user?.id,
      }))
      .reverse();
  }, [messagePages, user?.id]);
  
  //Send new Message in current conversation
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || !user || !currentParticipant || !decryptedPrivateKey) return;
    
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      content: messageText,
      createdAt: new Date(),
      updatedAt: new Date(),
      seen: false,
      sender: user,
      nonce: ''
    };
    
    // Add optimistic update immediately
    queryClient.setQueryData(['messages', currentConversation], (oldData: unknown) => {
      if (!oldData || typeof oldData !== 'object') return oldData;
      const data = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
      if (data.pages.length === 0) return data;
      
      const firstPage = data.pages[0];
      return {
        ...data,
        pages: [
          { ...firstPage, messages: [...firstPage.messages, optimisticMessage] },
          ...data.pages.slice(1)
        ]
      };
    });
    
    try {
      const {ciphertext, nonce} = await encryptMessage(messageText, currentParticipant.publicKey!, decryptedPrivateKey);
      createMessageMutation.mutate({ conversationId: currentConversation, content: ciphertext, nonce });
    } catch {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['messages', currentConversation] });
      setNewMessage(messageText); // Restore message text
    }
  };


  //In case no conversation is selected
  if (currentConversation === null) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation to start chatting</div>;
  }


  //Loading
  if (messagesLoading || cryptoLoading) return <Loading />;

  //Error
  if (messagesError) return <div className="flex-1 flex items-center justify-center">Error loading messages</div>;

  return (
    <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={currentParticipant?.avatar} />
                <AvatarFallback>{currentParticipant?.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{currentParticipant?.fullName}</h3>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-4 h-screen">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
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
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button variant="ghost" size="icon" className="rounded-full">
                <Smile className="w-5 h-5" />
              </Button>
              <Button size="icon" className="cursor-pointer not-last-of-type:rounded-full bg-primary hover:bg-primary/90" onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
  )
}

export default ChatArea
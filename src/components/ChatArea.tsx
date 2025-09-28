import React, { useMemo } from 'react'
import { Button } from './ui/button'
import { MoreVertical, Paperclip, Phone, Send, Smile, Video } from 'lucide-react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/useAuthStore'
import { useChatStore } from '@/store/useChatStore';
import { useGetConversationById, useGetMessages, useCreateMessage, useGetMe } from '@/lib/react-query/queries';
import { Message } from '@/types/types';

interface UIMessage extends Message {
  isOwn: boolean;
}

const ChatArea = () => {
  const [newMessage, setNewMessage] = React.useState('');

  const { data: user } = useGetMe();
  const {currentConversation} = useChatStore();

  const { data: messagePages, isLoading: messagesLoading, error: messagesError } = useGetMessages(currentConversation, !!currentConversation);
  const { data: conversation, isLoading: convoLoading, error: convoError } = useGetConversationById(currentConversation, !!currentConversation);

  const createMessageMutation = useCreateMessage();
  
  const messages: UIMessage[] = useMemo(() => {
    if (!messagePages || !messagePages.pages) return [];
    return messagePages.pages
      .flatMap(page => page.messages)
      .map((msg: Message) => ({
        ...msg,
        isOwn: msg.senderId === user?.id,
      }))
      .reverse();
  }, [messagePages, user?.id]);
  
  const handleSendMessage = () => {
    if (newMessage.trim() && currentConversation) {
      createMessageMutation.mutate({ conversationId: currentConversation, content: newMessage });
      setNewMessage('');
    }
  };

  if (currentConversation === null) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation to start chatting</div>;
  }

  if (convoLoading || messagesLoading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (convoError || messagesError) return <div className="flex-1 flex items-center justify-center">Error loading conversation</div>;

  const otherParticipant = conversation?.participants.find(p => p.user.id !== user?.id)?.user;

  return (
    <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={otherParticipant?.avatar} />
                <AvatarFallback>{otherParticipant?.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{otherParticipant?.fullName}</h3>
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
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${message.isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary'} rounded-2xl p-3 px-4`}>
                  <p>{message.content}</p>
                  <span className="text-xs opacity-70 block text-right mt-1">{new Date(message.createdAt).toLocaleTimeString()}</span>
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
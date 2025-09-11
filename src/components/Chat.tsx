import React from 'react';
import { Button } from './ui/button';
import { MoreVertical, Paperclip, Phone, Send, Smile, Video } from 'lucide-react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

const Chat = () => {
  const { user } = useAuthStore();
  const { currentConversation, messages, getMessages, sendMessage } = useChatStore();
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (currentConversation) {
      getMessages(currentConversation.id);
    }
  }, [currentConversation, getMessages]);

  const handleSendMessage = () => {
    if (currentConversation && message.trim()) {
      sendMessage(currentConversation.id, message);
      setMessage('');
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>
    );
  }

  const otherUser = currentConversation.participants.find(p => p.user.id !== user?.id)?.user;

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser?.avatar} />
            <AvatarFallback>{otherUser?.fullName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{otherUser?.fullName}</h3>
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
        {messages?.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] ${msg.senderId === user?.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'} rounded-2xl p-3 px-4`}>
              <p>{msg.content}</p>
              <span className="text-xs opacity-70 block text-right mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</span>
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
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button variant="ghost" size="icon" className="rounded-full">
            <Smile className="w-5 h-5" />
          </Button>
          <Button size="icon" className="rounded-full bg-primary hover:bg-primary/90" onClick={handleSendMessage}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

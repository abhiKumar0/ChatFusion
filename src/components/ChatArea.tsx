import React, { useState } from 'react'
import { Button } from './ui/button'
import { MoreVertical, Paperclip, Phone, Send, Smile, Video } from 'lucide-react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/useAuthStore'

const ChatArea = () => {

    const { user } = useAuthStore();
      const [darkMode, setDarkMode] = useState(false);
      const [activeChat, setActiveChat] = useState<string | null>(null);
      
      // Demo data
      const contacts = [
        { id: '1', name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?img=1', status: 'online', lastMessage: 'Hey! How are you doing?', time: '2:30 PM', unread: 3 },
        { id: '2', name: 'Sarah Williams', avatar: 'https://i.pravatar.cc/150?img=2', status: 'offline', lastMessage: "Let me know when you're free', time: 'Yesterday", unread: 0 },
        { id: '3', name: 'Michael Brown', avatar: 'https://i.pravatar.cc/150?img=3', status: 'online', lastMessage: 'The project looks great!', time: '9:15 AM', unread: 1 },
        { id: '4', name: 'Emma Davis', avatar: 'https://i.pravatar.cc/150?img=4', status: 'away', lastMessage: 'Can we schedule a call?', time: 'Monday', unread: 0 },
        { id: '5', name: 'Team ChatFusion', avatar: 'https://i.pravatar.cc/150?img=5', status: 'online', lastMessage: 'Welcome to ChatFusion!', time: 'Tuesday', unread: 2 },
      ];
    
      const messages = [
        { id: '1', senderId: '1', text: "Hey there! How's the new ChatFusion app working for you?", time: '2:30 PM', isOwn: false },
        { id: '2', senderId: user?.id, text: "It's amazing! The interface is so clean and intuitive.", time: '2:32 PM', isOwn: true },
        { id: '3', senderId: '1', text: "I know right? The real-time sync is impressive too.", time: '2:33 PM', isOwn: false },
        { id: '4', senderId: user?.id, text: "Absolutely! And I love the dark mode feature.", time: '2:35 PM', isOwn: true },
        { id: '5', senderId: '1', text: "Have you tried the group chat feature yet?", time: '2:36 PM', isOwn: false },
        { id: '6', senderId: user?.id, text: "Not yet, but I'm planning to set one up for our team soon!", time: '2:38 PM', isOwn: true },
      ];

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
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${message.isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary'} rounded-2xl p-3 px-4`}>
                  <p>{message.text}</p>
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
import React, { useState } from 'react'
import { Button } from './ui/button'
import { PlusCircle, Search } from 'lucide-react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';

const ContactList = () => {


  const [activeChat, setActiveChat] = useState<string | null>(null);
    const contacts = [
    { id: '1', name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?img=1', status: 'online', lastMessage: 'Hey! How are you doing?', time: '2:30 PM', unread: 3 },
    { id: '2', name: 'Sarah Williams', avatar: 'https://i.pravatar.cc/150?img=2', status: 'offline', lastMessage: "Let me know when you're free', time: 'Yesterday", unread: 0 },
    { id: '3', name: 'Michael Brown', avatar: 'https://i.pravatar.cc/150?img=3', status: 'online', lastMessage: 'The project looks great!', time: '9:15 AM', unread: 1 },
    { id: '4', name: 'Emma Davis', avatar: 'https://i.pravatar.cc/150?img=4', status: 'away', lastMessage: 'Can we schedule a call?', time: 'Monday', unread: 0 },
    { id: '5', name: 'Team ChatFusion', avatar: 'https://i.pravatar.cc/150?img=5', status: 'online', lastMessage: 'Welcome to ChatFusion!', time: 'Tuesday', unread: 2 },
  ];


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
            {contacts.map((contact) => (
              <div 
                key={contact.id}
                className={`p-3 flex items-center gap-3 hover:bg-secondary/50 cursor-pointer transition-colors ${activeChat === contact.id ? 'bg-secondary' : ''}`}
                onClick={() => setActiveChat(contact.id)}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span 
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${contact.status === 'online' ? 'bg-green-500' : contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{contact.name}</h3>
                    <span className="text-xs text-muted-foreground">{contact.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                </div>
                {contact.unread > 0 && (
                  <Badge variant="default" className="rounded-full h-5 min-w-5 flex items-center justify-center p-1">
                    {contact.unread}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
  )
}

export default ContactList
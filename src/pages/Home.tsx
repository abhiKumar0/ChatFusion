'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Settings, LogOut, Moon, Sun, Search, PlusCircle, Send, Paperclip, Smile, MoreVertical, Phone, Video } from 'lucide-react';
import { ChatArea, ContactList, RightSidebar, Sidebar } from '@/components';

const Home = () => {
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Main Layout */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
          setIsContactListOpen={() => {}} 
        />
        
        {/* Contacts List */}
        <ContactList />

        {/* Chat Area */}
        <ChatArea />
        
        {/* Right Sidebar - User Profile (Hidden on smaller screens) */}
        <RightSidebar />
      </div>
      
      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2">
        <div className="flex justify-around">
          <Button variant="ghost" size="icon">
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Users className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
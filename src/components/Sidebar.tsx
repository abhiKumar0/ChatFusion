import { LogOut, MessageSquare, Moon, Settings, Sun, Users } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/useAuthStore'
import Link from 'next/link';

const Sidebar = () => {

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
    <aside className="w-20 bg-card border-r border-border flex flex-col items-center py-6 hidden md:flex">
          <div className="flex flex-col items-center gap-6">
            {/* App Logo */}
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            
            {/* Navigation Icons */}
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Link href="/"><MessageSquare className="w-5 h-5" /> </Link>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Link href="/users"><Users className="w-5 h-5" /> </Link>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Link href="/settings"><Settings className="w-5 h-5" /> </Link>
            </Button>
          </div>
          
          <div className="mt-auto flex flex-col items-center gap-4">
            {/* Dark Mode Toggle */}
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {/* User Avatar */}
            <Avatar className="cursor-pointer border-2 border-primary hover:scale-110 transition-transform">
              <AvatarImage src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`} />
              <AvatarFallback>{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            
            {/* Logout */}
            <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </aside>
  )
}

export default Sidebar
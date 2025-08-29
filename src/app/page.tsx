'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageSquare, Moon, Settings, Sun, Users } from 'lucide-react';
import { ChatArea, ContactList, RightSidebar, Sidebar } from '@/components';
import Welcome from '@/pages/Welcome';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { user, getCurrentUser } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    getCurrentUser();
  }, [])

  if (!user) {
    return <Welcome />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Main Layout */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content - ContactList displayed by default */}
        
        <ContactList />

        <ChatArea />

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
}
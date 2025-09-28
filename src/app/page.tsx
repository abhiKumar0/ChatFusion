'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Sidebar, ContactList, Chat, ChatArea, Loading } from '@/components';
import Welcome from '@/pages/Welcome';
import MobileNav from '@/components/MobileNav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useChatStore } from '@/store/useChatStore';
import { useGetMe } from '@/lib/react-query/queries';

export default function HomePage() {
  const [activeView, setActiveView] = useState('contacts');
  const [darkMode, setDarkMode] = useState(false);
  const [isContactListOpen, setIsContactListOpen] = useState(false);

  const currentConversation = useChatStore(state => state.currentConversation);

  const { data:user, isLoading, error} = useGetMe();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return 
  }

  if (!user) {
    return <Welcome />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className="flex-1 flex">
        <Sidebar 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
          setIsContactListOpen={setIsContactListOpen} 
        />
        {/* Desktop layout */}
        <div className="hidden lg:flex flex-1">
          <ContactList />
          {currentConversation ? <ChatArea /> : <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation to start chatting</div>}
        </div>


        {/* Tablet layout */}
        <div className="hidden md:flex lg:hidden flex-1">
          <Sheet open={isContactListOpen} onOpenChange={setIsContactListOpen}>
            <SheetContent side="left" className="p-0 w-80">
              <ContactList />
            </SheetContent>
          </Sheet>
          


        </div>


        {/* Mobile layout */}
        <div className="md:hidden flex-1">
          {activeView === 'contacts' ? <ContactList /> :
            <>
              {currentConversation ? <ChatArea /> : <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation to start chatting</div>}
            
            </>
          }
        </div>


      </div>

      
      <MobileNav 
        activeView={activeView} 
        setActiveView={setActiveView} 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
      />
    </div>
  );
}
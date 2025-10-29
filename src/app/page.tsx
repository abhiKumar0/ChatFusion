'use client';

import React, { useState } from 'react';
import { Sidebar, ContactList, ChatArea } from '@/components';
import Welcome from '@/pages/Welcome';
import MobileNav from '@/components/MobileNav';
import { useChatStore } from '@/store/useChatStore';
import { useGetMe } from '@/lib/react-query/queries';
import { CryptoProvider } from '@/lib/crypto-context';

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState('light');
  const [activeView, setActiveView] = useState('contacts');
  const [isContactListOpen, setIsContactListOpen] = useState(false);
  const currentConversation = useChatStore(state => state.currentConversation);

  const { data:user} = useGetMe();

  const toggleDarkMode = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setDarkMode(next === 'dark');
  };



  if (!user) {
    return <Welcome />;
  }

  return (
    <CryptoProvider>
      
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className="flex-1 flex">
        <Sidebar 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
          setIsContactListOpen={setIsContactListOpen} 
        />
        {/* Desktop layout */}
        <div className="hidden lg:flex flex-1">
          <div className="w-80">
            <ContactList />
          </div>
          {currentConversation ? <ChatArea /> : <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation to start chatting</div>}
        </div>


        {/* Tablet layout */}
        {/*<div className="hidden md:flex lg:hidden flex-1">*/}
          {/*<Sheet open={isContactListOpen} onOpenChange={setIsContactListOpen}>*/}
          {/*  <SheetContent side="left" className="p-0 w-80">*/}
          {/*    <ContactList />*/}
          {/*  </SheetContent>*/}
          {/*</Sheet>*/}
          


        {/*</div>*/}


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

    </CryptoProvider>
  );
}
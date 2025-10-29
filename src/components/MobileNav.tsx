'use client'

import React, {useState} from 'react';
import { Button } from './ui/button';
import { MessageSquare, Users, Settings, Moon, Sun } from 'lucide-react';

interface MobileNavProps {
  activeView: string;
  setActiveView: (view: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const MobileNav = ({ activeView, setActiveView, darkMode, toggleDarkMode }: MobileNavProps) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2">
      <div className="flex justify-around">
        <Button variant={activeView === 'contacts' ? 'secondary' : 'ghost'} size="icon" onClick={() => setActiveView('contacts')}>
          <Users className="w-5 h-5" />
        </Button>
        <Button variant={activeView === 'chat' ? 'secondary' : 'ghost'} size="icon" onClick={() => setActiveView('chat')}>
          <MessageSquare className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default MobileNav;

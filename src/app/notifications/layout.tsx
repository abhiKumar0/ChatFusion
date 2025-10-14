'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Sidebar } from '@/components';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);

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
        
        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
        
        {/* Dark Mode Toggle (Mobile) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2">
          <div className="flex justify-around">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
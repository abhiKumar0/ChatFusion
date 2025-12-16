'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Sidebar } from '@/components';
import MobileNav from '@/components/MobileNav';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsLayout({
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
          setIsContactListOpen={() => { }}
        />

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>

        {/* Mobile Navigation */}
        <MobileNav
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </div>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components';
import MobileNav from '@/components/MobileNav';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
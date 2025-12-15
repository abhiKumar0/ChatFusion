'use client';

import React from 'react';
import NotificationsList from "@/components/NotificationsList";
import MobileNav from "@/components/MobileNav";
import Loading from "@/components/Loading";
import Welcome from "@/pages/Welcome";
import { useGetMe } from "@/lib/react-query/queries";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

export default function NotificationsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const { data: user, isLoading, error } = useGetMe();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading user.</div>;
  if (!user) return <Welcome />;

  return (
    <div className={`flex items-stretch flex-1 h-[calc(100vh)] overflow-hidden ${darkMode ? 'dark' : ''} bg-background`}>
      {/* Notifications List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-border h-full bg-background flex flex-col z-10">
        <NotificationsList />
      </div>

      {/* Empty State / Detail Area - Visible on Desktop */}
      <div className="hidden md:flex flex-1 h-full bg-background flex-col items-center justify-center text-muted-foreground bg-secondary/30">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>
        <p className="font-medium">Select a notification to view details</p>
      </div>

      <div className="md:hidden block">
        <MobileNav
          activeView="notifications"
          setActiveView={() => { }}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </div>
    </div>
  );
}
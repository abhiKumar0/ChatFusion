'use client';

import React from 'react';
import NotificationsList from "@/components/NotificationsList";
import MobileNav from "@/components/MobileNav";
import Loading from "@/components/Loading";
import Welcome from "@/components/Welcome";
import { useGetMe } from "@/lib/react-query/queries";
import { Bell, Sparkles } from "lucide-react";
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
    <div className={`flex items-stretch flex-1 h-[calc(100vh)] overflow-hidden ${darkMode ? 'dark' : ''} bg-[#0a0a0b]`}>
      {/* Notifications List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-white/5 h-full bg-[#0f0f11] flex flex-col z-10">
        <NotificationsList />
      </div>

      {/* Empty State / Detail Area - Visible on Desktop */}
      <div className="hidden md:flex flex-1 h-full bg-[#0a0a0b] flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px]" />

        <div className="relative z-10 text-center max-w-md px-6">
          {/* Icon */}
          <div className="relative inline-flex mb-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
              <Bell className="w-9 h-9 text-violet-400" />
            </div>
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Text */}
          <h2 className="text-2xl font-semibold text-white mb-2">
            Notifications
          </h2>
          <p className="text-gray-500">
            Stay updated with friend requests, messages, and activity from your network
          </p>
        </div>
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
'use client';

import NotificationsList from "@/components/NotificationsList";
import ChatArea from "@/components/ChatArea";
import MobileNav from "@/components/MobileNav";
import Loading from "@/components/Loading";
import Welcome from "@/pages/Welcome";
import { useGetMe } from "@/lib/react-query/queries";
import { useState } from "react";
import {Resizable, ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable"; // Adjust import if needed

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
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel className="h-screen border-r border-border hidden lg:flex flex-col w-80">
          <NotificationsList />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel className="h-screen ">
          <ChatArea />
        </ResizablePanel>
      </ResizablePanelGroup>
      <MobileNav
        activeView="notifications"
        setActiveView={() => {}}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    </div>
  );
}
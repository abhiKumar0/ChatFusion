'use client';

import NotificationsList from "@/components/NotificationsList";
import ChatArea from "@/components/ChatArea";
import MobileNav from "@/components/MobileNav";
import Loading from "@/components/Loading";
import Welcome from "@/pages/Welcome";
import { useGetMe } from "@/lib/react-query/queries";
import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

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
    <div className={`min-h-screen flex flex-col bg-background ${darkMode ? 'dark' : ''}`}>
      <ResizablePanelGroup direction="horizontal" className="h-screen">
        <ResizablePanel 
          defaultSize={30} 
          minSize={25} 
          maxSize={40}
          className="h-screen hidden lg:flex flex-col border-r border-border bg-background"
        >
          <NotificationsList />
        </ResizablePanel>
        <ResizableHandle withHandle className="hidden lg:flex" />
        <ResizablePanel 
          defaultSize={70} 
          minSize={60}
          className="h-screen bg-background"
        >
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
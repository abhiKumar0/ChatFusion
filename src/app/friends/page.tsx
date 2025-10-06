'use client';

import FriendList from "@/components/FriendList";
import ChatArea from "@/components/ChatArea";
import MobileNav from "@/components/MobileNav";
import Loading from "@/components/Loading";
import Welcome from "@/pages/Welcome";
import { useGetMe } from "@/lib/react-query/queries";
import { useState } from "react";

export default function FriendsPage() {
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
      <div className="flex flex-1">
        <FriendList />
        <ChatArea />
      </div>
      <MobileNav
        activeView="friends"
        setActiveView={() => {}}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    </div>
  );
}
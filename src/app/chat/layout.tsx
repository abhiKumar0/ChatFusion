'use client';

import React, { useState } from 'react';
import { Sidebar, ContactList } from '@/components';
import { useGetMe } from '@/lib/react-query/queries';
import { useRouter, useParams } from 'next/navigation';
import MobileNav from '@/components/MobileNav';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const [darkMode, setDarkMode] = useState(false);
    const { data: user } = useGetMe();
    const [isContactListOpen, setIsContactListOpen] = useState(false);
    const params = useParams();
    const conversationId = params?.conversationId as string | undefined;

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    return (
        <div className={`min-h-screen flex flex-col bg-[#0a0a0b] ${darkMode ? 'dark' : ''}`}>
            <div className="flex-1 flex overflow-hidden">
                <Sidebar
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    setIsContactListOpen={setIsContactListOpen}
                />

                {/* Desktop Layout: Always show ContactList */}
                <div className="hidden md:flex w-80 lg:w-[340px] border-r border-white/5 h-full bg-[#0f0f11]">
                    <ContactList selectedConversationId={conversationId} />
                </div>

                {/* Mobile Layout: Show ContactList only if NO conversation selected */}
                <div className={`md:hidden flex-1 flex flex-col h-full bg-[#0f0f11] ${conversationId ? 'hidden' : 'flex'}`}>
                    <ContactList selectedConversationId={conversationId} />
                </div>

                {/* Main Content (ChatArea or Empty State) */}
                <div className={`flex-1 flex flex-col h-[100vh] overflow-hidden bg-[#0a0a0b] ${!conversationId ? 'hidden md:flex' : 'flex'}`}>
                    {children}
                </div>
            </div>

            <div className={`${conversationId ? 'hidden' : 'block'}`}>
                <MobileNav
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                />
            </div>
        </div>
    );
}

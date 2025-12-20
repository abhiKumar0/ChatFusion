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

    // Mobile view logic
    // If conversationId exists, we are in a chat on mobile -> show child (ChatArea)
    // If not, we are in list on mobile -> show ContactList

    return (
        <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
            <div className="flex-1 flex overflow-hidden">
                <Sidebar
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    setIsContactListOpen={setIsContactListOpen}
                />

                {/* Desktop Layout: Always show ContactList */}
                <div className="hidden md:flex w-80 border-r border-border h-full">
                    <ContactList selectedConversationId={conversationId} />
                </div>

                {/* Mobile Layout: Show ContactList only if NO conversation selected */}
                <div className={`md:hidden flex-1 flex flex-col h-full ${conversationId ? 'hidden' : 'flex'}`}>
                    <ContactList selectedConversationId={conversationId} />
                </div>

                {/* Main Content (ChatArea or Empty State) */}
                {/* On Mobile: If conversationId, show this. If not, hide this (because ContactList is shown). */}
                {/* Actually, if children is EmptyState (page.tsx), we want to hide it on mobile if we want to show ContactList? 
            Wait, if route is /chat (page.tsx), conversationId is undefined. 
            So ContactList is visible. Child (EmptyState) is ...?
            On mobile, EmptyState is usually not shown. User sees ContactList.
            So we should hide children on mobile if conversationId is missing.
        */}
                <div className={`flex-1 flex flex-col h-[100vh] overflow-hidden ${!conversationId ? 'hidden md:flex' : 'flex'}`}>
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

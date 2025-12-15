'use client';

import React, { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
    const { currentConversation } = useChatStore();
    const router = useRouter();

    useEffect(() => {
        // If we have a stored conversation ID, redirect to it
        if (currentConversation) {
            router.replace(`/chat/${currentConversation}`);
        }
    }, [currentConversation, router]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-secondary/30 h-full">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <p className="font-medium">Select a conversation to start chatting</p>
        </div>
    );
}

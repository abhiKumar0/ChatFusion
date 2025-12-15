'use client';

import React from 'react';
import { ChatArea } from '@/components';
import { useParams } from 'next/navigation';

export default function ConversationPage() {
    const params = useParams();
    const conversationId = params?.conversationId as string;

    if (!conversationId) {
        return <div>Loading...</div>;
    }

    return (
        <ChatArea conversationId={conversationId} />
    );
}


'use client';

import React, { useEffect } from 'react';
import { MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useRouter } from 'next/navigation';
import { useGetMe } from '@/lib/react-query/queries';

export default function ChatPage() {
    const { currentConversation } = useChatStore();
    const router = useRouter();
    const { data: user } = useGetMe();

    if (!user) {
        router.replace('/');
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0a0a0b] relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[100px]" />

            <div className="relative z-10 text-center max-w-md px-6">
                {/* Icon */}
                <div className="relative inline-flex mb-6">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10">
                        <MessageSquare className="w-9 h-9 text-violet-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                    </div>
                </div>

                {/* Text */}
                <h2 className="text-2xl font-semibold text-white mb-2">
                    Select a conversation
                </h2>
                <p className="text-gray-500 mb-8">
                    Choose from your existing conversations or start a new one to begin chatting
                </p>

                {/* Tips */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-left">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <ArrowRight className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-white font-medium">Quick tip</p>
                            <p className="text-xs text-gray-500">Use the search bar to find conversations</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { create } from 'zustand';
import { ChatStore } from '@/types/types';
import axios from 'axios';

export const useChatStore = create<ChatStore>((set) => ({
    currentConversation: null,
    setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
    
}))
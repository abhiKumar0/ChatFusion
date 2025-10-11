import { create } from 'zustand';
import { ChatStore } from '@/types/types';

export const useChatStore = create<ChatStore>((set) => ({
    currentConversation: null,
    currentParticipant: null,
    setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
    setCurrentParticipant: (participant) => set({ currentParticipant: participant }),
}))
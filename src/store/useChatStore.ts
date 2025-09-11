import { create } from 'zustand';
import { ChatStore } from '@/types/types';
import axios from 'axios';

export const useChatStore = create<ChatStore>((set) => ({
    conversations: null,
    currentConversation: null,
    messages: null,
    loading: false,
    error: null,
    getConversations: async () => {
        try {
            set({ loading: true });
            const response = await axios.get('/api/conversations', { withCredentials: true });
            // console.log("Response:", response);
            if (response.status === 200) {
                set({ conversations: response.data });
            }
        } catch (error) {
            set({ error: 'Error fetching conversations' });
            console.error('Fetch Conversations Error:', error);
        } finally {
            set({ loading: false });
        }
    },
    getConversationById: async (id: string) => {
        try {
            set({ loading: true });
            const response  = await axios.get(`/api/conversations/${id}`, { withCredentials: true });
            if (response.status === 200) {
                set({ currentConversation: response.data });
            }
        } catch (error) {
            set({ error: 'Error fetching conversation' });
            console.error('Fetch Conversation Error:', error);  
        } finally {
            set({ loading: false });
        }
    },
    sendMessage: async (conversationId: string, content: string, parentId?: string, media?: string) => {
        try {
            set({ loading: true });
            const payload = {content, parentId, media};
            const response = await axios.post(`/api/conversations/${conversationId}/message`, payload, { withCredentials: true });
            if (response.status === 200) {
                console.log('Message sent successfully');
            }
        } catch (error) {
            set({ error: 'Error sending message' });
            console.error('Send Message Error:', error);
        } finally {
            set({ loading: false });
        }
    },
    getMessages: async (conversationId: string) => {
        try {
            set({ loading: true });
            const response = await axios.get(`/api/conversations/${conversationId}/messages`, { withCredentials: true });

            if (response.status === 200) {
                set({ messages: response.data });
            }
        } catch (error) {
            set({ error: 'Error fetching messages' });
            console.error('Fetch Messages Error:', error);
        } finally {
            set({ loading: false });
        }
    },
    createConversation: async (participantId: string) => {
        try {
            set({ loading: true });
            const payload = { recipientId: participantId };
            const response = await axios.post('/api/conversations', payload, { withCredentials: true });
            if (response.status === 200) {
                console.log('Conversation created successfully');
            }
        } catch (error) {
            set({ error: 'Error creating conversation' });
        } finally {
            set({ loading: false });
        }
    }
}))
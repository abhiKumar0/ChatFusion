export interface User {
    id: string,
    email: string,
    username: string,
    fullName: string,
    avatar: string,
    bio: string,
    status: string,
    publicKey?: string,
    encryptedPrivateKey?: string
}

export interface Reaction {
    id: string,
    emoji: string,
    messageId: string,
    userId: string,
    user: User,
    createdAt: Date,
    updatedAt: Date,
}

export interface Message {
    id: string,
    senderId: string,
    parentMessageId?: string,
    media?: string,
    content: string,
    createdAt: Date,
    updatedAt: Date,
    replies?: Message[],
    sender: User,
    parentMessage?: Message,
    nonce?: string,
    status: string,
    type?: 'TEXT' | 'IMAGE' | 'STICKER' | 'AUDIO' | 'VIDEO' | 'FILE',
    reactions?: Reaction[],
}

interface Conversation {
    id: string,
    participants: User[],
    messages: Message[],
    createdAt: Date
}



export interface AuthStore {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    getCurrentUser: () => Promise<void>;
}



export interface ChatStore {
    currentConversation: string | null;
    currentParticipant: User | null;
    replyingTo: Message | null;
    setCurrentConversation: (id: string) => void;
    setCurrentParticipant: (participant: User) => void;
    setReplyingTo: (message: Message | null) => void;
    clearReplyingTo: () => void;
}
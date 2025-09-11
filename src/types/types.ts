export interface User {
    id: string,
    email: string,
    username: string,
    fullName: string,
    avatar: string,
    bio: string,
    status: string
}

interface Message {
    id: string,
    senderId: string,
    parentMessageId?: string,
    seen: boolean,
    media?: string,
    content: string,
    createdAt: Date,
    updatedAt: Date,
    replies?: Message[],
    sender: User,
    parentMessage?: Message
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

export interface UserStore {
    users: User[] | null;
    loading: boolean;
    error: string | null;
    fetchUsers: () => Promise<void>;
    getUserById: (id: string) => Promise<User | null>;
}

export interface ChatStore {
    conversations: Conversation[] | null;
    currentConversation: Conversation | null;
    loading: boolean;
    error: string | null;
    messages: Message[] | null;
    getConversations: () => Promise<void>;
    getConversationById: (id: string) => Promise<void>;
    sendMessage: (conversationId: string, content: string, parentId?: string, media?: string) => Promise<void>;
    getMessages: (conversationId: string) => Promise<void>;
    createConversation: (participantId: string) => Promise<void>;
}
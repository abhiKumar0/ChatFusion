export interface User {
    id: string,
    email: string,
    username: string,
    fullName: string,
    avatar: string,
    bio: string,
    status: string,
    publicKey?: string,
    encryptedPrivateKey?: string,
    friendshipStatus?: 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE',
    friendshipId?: string
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

export enum CallStatus {
    PENDING = 'PENDING',
    RINGING = 'RINGING',
    CONNECTED = 'CONNECTED',
    ENDED = 'ENDED',
    REJECTED = 'REJECTED'
}

export interface Call {
    id: string;
    caller_id: string;
    receiver_id: string;
    status: CallStatus;
    offer_sdp: any;
    answer_sdp: any;
    created_at: string;
    is_video?: boolean;
    // Joined User data from foreign keys
    caller: User;
    receiver: User;
    // Deprecated: use snake_case or joined data instead
    callerId?: string;
    receiverId?: string;
    offerSdp?: any;
    answerSdp?: any;
    createdAt?: string;
    isVideo?: boolean;
}



export interface AuthStore {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    signup: (email: string, password: string, name: string) => Promise<boolean>;
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

export interface SearchedUser {
    id: string;
    email: string;
    username: string;
    fullName: string;
    avatar: string;
}
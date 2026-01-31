import axios from "axios";
import { SearchedUser, User } from "@/types/types";
import { encryptPrivateKey, generateUserKeys } from "../crypto";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Add response interceptor to handle errors properly
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Extract error message from backend response
    if (error.response?.data?.message) {
      // Backend sent a custom error message
      const customError = new Error(error.response.data.message);
      (customError as any).status = error.response.status;
      (customError as any).data = error.response.data;
      throw customError;
    } else if (error.response?.data?.error) {
      // Alternative error format
      const customError = new Error(error.response.data.error);
      (customError as any).status = error.response.status;
      (customError as any).data = error.response.data;
      throw customError;
    } else if (error.message) {
      // Use axios error message as fallback
      throw error;
    } else {
      // Generic error
      const customError = new Error('An unexpected error occurred');
      (customError as any).status = error.response?.status || 500;
      throw customError;
    }
  }
);

// Auth
export const requestOtp = async (fullName: string, email: string) => {
  const response = await api.post("/auth/signup", { fullName, email });
  return response.data;
};

export const verifyAndCompleteSignUp = async (
  fullName: string,
  email: string,
  password: string,
  otp: string
) => {
  //Generating 
  const { publicKey, privateKey } = await generateUserKeys();
  const encryptedKey_base64 = encryptPrivateKey(privateKey, email);
  console.log(publicKey, privateKey, encryptedKey_base64);
  const data = {
    fullName,
    email,
    password,
    publicKey,
    encryptPrivateKey: encryptedKey_base64,
    otp
  };
  console.log(data);
  const response = await api.post("/auth/verify", data);
  return response.data;
};

export const requestPasswordReset = async (email: string) => {
  const response = await api.post("/auth/password-reset/request", { email });
  return response.data;
};

export const confirmPasswordReset = async ({ email, otp, newPassword }: any) => {
  const response = await api.post("/auth/password-reset/confirm", { email, otp, newPassword });
  return response.data;
};



export const logIn = async (data: { email: string; password: string }) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const logOut = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const getKey = async () => {
  const response = await api.get("/auth/key");
  return response.data;
}

export const sendInvite = async (email: string) => {
  const response = await api.post("/invite", { email });
  return response.data;
};

// Users
export const getMe = async () => {
  const response = await api.get("/users/me");
  return response.data.user;
};


export const updateUser = async (updates: Partial<User>) => {
  const response = await api.put("/users/me", updates);
  return response.data.user;
};


export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get("/users");
  return data.users;
};

export const getFriends = async (): Promise<User[]> => {
  const { data } = await api.get("/users/friends");
  return data.friends;
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const headers = {
    'Content-Type': 'multipart/form-data',
  };

  const response = await api.post("/upload", formData, { headers });
  return response.data.url;
};



export const checkUsername = async (username: string): Promise<boolean> => {
  const response = await api.post("/users/checkUsername", { username });
  return response.data.available;
};

export const getUserById = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const getUserByUsername = async (username: string) => {
  const response = await api.get(`/users/username/${username}`);
  return response.data;
};

export const getUserByEmail = async (email: string): Promise<{ user: SearchedUser }> => {
  const response = await api.post(`/users/getUserByEmail`, { email });
  return response.data;
};

export const getUserFriends = async (userId: string) => {
  const response = await api.get(`/users/${userId}/friends`);
  return response.data;
};

// Friend Requests
export const sendFriendRequest = async (receiverId: string) => {
  const response = await api.post("/friendRequest", { receiverId });
  return response.data;
};

export const acceptFriendRequest = async (friendRequestId: string ) => {
  const response = await api.patch("/friendRequest?friendRequestId=" + friendRequestId);
  return response.data;
};

//Cancel, Decline , remove Friend Request
export const removeFriendRequest = async ( friendRequestId: string ) => {
  const response = await api.delete("/friendRequest?friendRequestId=" + friendRequestId);
  return response.data;
};

export const getFriendRequests = async () => {
  const response = await api.get("/friendRequest");
  console.log(response);
  return response.data;
};

export const getFriendRequestCount = async () => {
  const response = await api.get("/friendRequest/count");
  return response.data;
};


// Conversations
export const getConversations = async () => {
  const response = await api.get("/conversations");
  return response.data;
};

export const createConversation = async (recipientId: string) => {
  const response = await api.post("/conversations", { recipientId });
  return response.data;
};

export const getConversationById = async (id: string) => {
  const response = await api.get(`/conversations/${id}`);
  return response.data.conversation;
};

export const deleteConversation = async (id: string, deleteFor: string) => {
  const response = await api.delete(`/conversations/${id}?deleteFor=${deleteFor}`);
  return response.data;
};

// Messages
export const markAsSeen = async (conversationId: string) => {
  const response = await api.post(`/conversations/${conversationId}/seen`);
  return response.data;
};

export const createMessage = async ({
  conversationId,
  content,
  media,
  parentId,
  nonce,
  type,
}: {
  conversationId: string;
  content: string;
  media?: string;
  parentId?: string;
  nonce?: string;
  type?: 'TEXT' | 'IMAGE' | 'STICKER' | 'AUDIO' | 'VIDEO' | 'FILE';
}) => {


  const response = await api.post(`/conversations/${conversationId}/message`, {
    content,
    media,
    parentId,
    nonce,
    type,
  });
  return response.data;
};

export const getMessages = async ({
  conversationId,
  cursor,
}: {
  conversationId: string;
  cursor?: string;
}) => {
  const response = await api.get(`/conversations/${conversationId}/message`, {
    params: { cursor },
  });
  return response.data;
};

// Message edit/delete
export const updateMessage = async ({
  conversationId,
  messageId,
  content,
  nonce,
}: {
  conversationId: string;
  messageId: string;
  content: string;
  nonce: string;
}) => {

  const { data } = await api.patch(`/conversations/${conversationId}/message/${messageId}`, { content, nonce });
  return data;
};

//Delete message
export const deleteMessage = async ({
  conversationId,
  messageId,
  deleteType
}: {
  conversationId: string;
  messageId: string;
  deleteType: string;
}) => {
  const { data } = await api.delete(`/message/${messageId}?conversationId=${conversationId}&deleteType=${deleteType}`);
  return data;
};

// Reactions
export const addReaction = async ({
  conversationId,
  messageId,
  emoji,
}: {
  conversationId: string;
  messageId: string;
  emoji: string;
}) => {
  const { data } = await api.post(`/message/${messageId}/reactions`, { conversationId, emoji });
  return data;
};

export const removeReaction = async ({
  conversationId,
  messageId,
  reactionId,
}: {
  conversationId: string;
  messageId: string;
  reactionId: string;
}) => {

  const { data } = await api.delete(`/message/${messageId}/reactions`, { data: { conversationId, reactionId } });
  return data;
};

// Call API
export const initiateCall = async (data: { receiverId: string; offerSdp: any; isVideo: boolean }) => {
  const response = await api.post('/call/initiate', data);
  return response.data;
};

export const updateCallStatus = async (callId: string, status: string) => {
  const response = await api.patch(`/call/${callId}`, { status });
  return response.data;
};

export const answerCall = async (callId: string, answerSdp: any) => {
  const response = await api.patch(`/call/${callId}/answer`, { answerSdp });
  return response.data;
};
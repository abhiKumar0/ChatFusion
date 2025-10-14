import axios from "axios";
import { User } from "@/types/types";
import { encryptPrivateKey, generateUserKeys } from "../crypto";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Auth
export const signUp = async (
  fullName: string,
  email: string,
  password: string
) => {
  const { publicKey, privateKey } = await generateUserKeys();
  const encryptedKey_base64 = encryptPrivateKey(privateKey, email);
  console.log(publicKey, privateKey, encryptedKey_base64);
  const data = {
    fullName,
    email,
    password,
    publicKey,
    encryptPrivateKey: encryptedKey_base64,
  };
  console.log(data);
  const response = await api.post("/auth/signup", data);
  return response.data;
};

export const logIn = async (data: { email: string; password: string }) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

// Users
export const getMe = async () => {
  const response = await api.get("/users/me");
  return response.data.user;
};

export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get("/users");
  return data.users;
};

export const getUserById = async (id: string): Promise<User> => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

// Friend Requests
export const sendFriendRequest = async (receiverId: string) => {
  const response = await api.post("/friendRequest", { receiverId });
  return response.data;
};

export const respondToFriendRequest = async (
  friendRequestId: string,
  status: "ACCEPTED" | "REJECTED"
) => {
  const response = await api.put("/friendRequest", { friendRequestId, status });
  return response.data;
};

export const getFriendRequests = async () => {
  const response = await api.get("/friendRequest");
  console.log(response);
  return response.data;
};

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

// Messages
export const createMessage = async ({
  conversationId,
  content,
  media,
  parentId,
  nonce,
}: {
  conversationId: string;
  content: string;
  media?: string;
  parentId?: string;
  nonce?: string;
}) => {
  const response = await api.post(`/conversations/${conversationId}/message`, {
    content,
    media,
    parentId,
    nonce,
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

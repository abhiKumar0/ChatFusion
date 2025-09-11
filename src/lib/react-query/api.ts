import axios from 'axios';
import { User } from '@/types/types';

const api = axios.create({
  baseURL: '/api',
});

// Auth
export const signUp = async (data: {data: {fullName: string, email: string, password: string}}) => {
  const response = await api.post('/auth/signup', data);
  return response.data;
};

export const logIn = async (data: {data: {email: string, password: string}}) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

// Users
export const getMe = async () => {
  const response = await api.get('/users/me');
  return response.data.user;
};

export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/users');
  return data.users;
};

export const getUserById = async (id: string): Promise<User> => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

// Conversations
export const getConversations = async () => {
  const response = await api.get('/conversations');
  return response.data;
};

export const createConversation = async (recipientId: string) => {
  const response = await api.post('/conversations', { recipientId });
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
}: {
  conversationId: string;
  content: string;
  media?: string;
  parentId?: string;
}) => {
  const response = await api.post(
    `/conversations/${conversationId}/message`,
    { content, media, parentId }
  );
  return response.data;
};

export const getMessages = async ({
  conversationId,
  cursor,
}: {
  conversationId: string;
  cursor?: string;
}) => {
  const response = await api.get(
    `/conversations/${conversationId}/message`,
    {
      params: { cursor },
    }
  );
  return response.data;
};

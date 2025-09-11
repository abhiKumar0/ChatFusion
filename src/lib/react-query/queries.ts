import {
  useQuery,  useMutation,  useInfiniteQuery,  QueryClient,
} from '@tanstack/react-query';
import {
  signUp,  logIn,  getMe,  getUsers,  getUserById,  getConversations,  createConversation,  getConversationById,  createMessage,  getMessages,
} from './api';

export const queryClient = new QueryClient();

// Auth Mutations
export const useSignUp = () => {
  return useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useLogIn = () => {
  return useMutation({
    mutationFn: logIn,
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data.user);
    },
  });
};

// User Queries
export const useGetMe = () => {
  return useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: Infinity });
};

export const useGetUsers = () => {
  return useQuery({ queryKey: ['users'], queryFn: getUsers });
};

export const useGetUserById = (id: string) => {
  return useQuery({ queryKey: ['user', id], queryFn: () => getUserById(id) });
};

// Conversation Queries and Mutations
export const useGetConversations = () => {
  return useQuery({ queryKey: ['conversations'], queryFn: getConversations });
};

export const useCreateConversation = () => {
  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useGetConversationById = (id: string) => {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversationById(id),
  });
};

// Message Queries and Mutations
export const useCreateMessage = () => {
  return useMutation({
    mutationFn: createMessage,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.conversationId],
      });
    },
  });
};

export const useGetMessages = (conversationId: string) => {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      getMessages({ conversationId: conversationId, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};  

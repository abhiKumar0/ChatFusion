import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  QueryClient,
} from '@tanstack/react-query';
import {
  signUp,
  logIn,
  getMe,
  getUsers,
  getUserById,
  getConversations,
  createConversation,
  getConversationById,
  createMessage,
  getMessages,
} from './api';

export const queryClient = new QueryClient();

// Auth Mutations
export const useSignUp = () => {
  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

export const useLogIn = () => {
  const mutation = useMutation({
    mutationFn: logIn,
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data.user);
    },
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

// User Queries
export const useGetMe = () => {
  const query = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: Infinity,
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const useGetUsers = () => {
  const query = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const useGetUserById = (id: string) => {
  const query = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

// Conversation Queries and Mutations
export const useGetConversations = () => {
  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const useCreateConversation = () => {
  const mutation = useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

export const useGetConversationById = (id: string) => {
  const query = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversationById(id),
    enabled: !!id,
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

// Message Queries and Mutations
export const useCreateMessage = () => {
  const mutation = useMutation({
    mutationFn: createMessage,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.conversationId],
      });
    },
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

export const useGetMessages = (conversationId: string) => {
  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      getMessages({ conversationId: conversationId, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!conversationId,
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

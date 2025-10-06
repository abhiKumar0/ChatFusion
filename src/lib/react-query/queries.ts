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
  sendFriendRequest,
  createConversation,
  getConversationById,
  createMessage,
  getMessages,
  getConversations,
  getFriendRequests,
  respondToFriendRequest,
} from './api';

export const queryClient = new QueryClient();

// Auth Mutations
export const useSignUp = () => {
  const mutation = useMutation({
    mutationFn: ({ fullName, email, password }: { fullName: string; email: string; password: string }) => signUp(fullName, email, password),
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

// Friend Request Mutations
export const useSendFriendRequest = () => {
    const mutation = useMutation({
        mutationFn: sendFriendRequest,
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

export const useRespondToFriendRequest = () => {
  const mutation = useMutation({
    mutationFn: ({ friendRequestId, status }: { friendRequestId: string; status: 'ACCEPTED' | 'REJECTED' }) => respondToFriendRequest(friendRequestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

export const useGetFriendRequests = () => {
  const query = useQuery({
    queryKey: ['friendRequests'],
    queryFn: getFriendRequests,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

// Conversation Queries


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

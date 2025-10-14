import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
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
import { Message } from '@/types/types';

// QueryClient is now provided by the provider.tsx

// Auth Mutations
export const useSignUp = () => {
  const queryClient = useQueryClient();
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
  const queryClient = useQueryClient();
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    const queryClient = useQueryClient();
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
  const queryClient = useQueryClient();
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
    staleTime: 60 * 1000, // 1 minute
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
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
    staleTime: 60 * 1000, // 1 minute
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

// Message Queries and Mutations
export const useCreateMessage = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createMessage,
    onSuccess: (data, variables) => {
      // Replace optimistic message with real message from server
      queryClient.setQueryData(['messages', variables.conversationId], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const queryData = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
        
        return {
          ...queryData,
          pages: queryData.pages.map(page => ({
            ...page,
            messages: page.messages.map(msg => 
              msg.id.startsWith('temp-') ? data : msg
            )
          }))
        };
      });
    },
    onError: (error, variables) => {
      // Revert optimistic update on error
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

export const useGetMessages = (conversationId: string | null, enabled: boolean) => {
  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      getMessages({ conversationId: conversationId as string, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled: Boolean(enabled && conversationId),
    staleTime: 30 * 1000, // 30 seconds
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

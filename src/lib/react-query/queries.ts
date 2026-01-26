import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  requestOtp,
  verifyAndCompleteSignUp,
  requestPasswordReset,
  confirmPasswordReset,
  sendInvite,
  logIn,
  logOut,
  getMe,
  getUsers,
  getUserById,
  getUserByUsername,
  sendFriendRequest,
  createConversation,
  getConversationById,
  createMessage,
  markAsSeen,
  getMessages,
  getConversations,
  getFriendRequests,
  respondFriendRequest,
  updateMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  getFriends,
  updateUser,
  uploadAvatar,
  checkUsername,
  cancelFriendRequest,
  getUserFriends,
  initiateCall,
  updateCallStatus,
  answerCall,
  getUserByEmail,
  getKey,
  deleteConversation,
  getFriendRequestCount,
} from './api';


import { Message } from '@/types/types';

// QueryClient is now provided by the provider.tsx

// ********************************************* Auth Mutations *********************************************

// Request OTP
export const useRequestOtp = () => {
  return useMutation({
    mutationFn: ({ fullName, email }: { fullName: string; email: string }) => requestOtp(fullName, email),
  });
};

// Complete Signup (Verify OTP and Create User)
export const useCompleteSignUp = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ fullName, email, password, otp }: { fullName: string; email: string; password: string, otp: string }) => verifyAndCompleteSignUp(fullName, email, password, otp),
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


//Log in
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


//Login from server side, delete cookies and all
export const useLogOut = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: logOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error) => {
      console.error('Logout failed:', error);
    },
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}


// Password Reset Hooks
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
};

export const useConfirmPasswordReset = () => {
  return useMutation({
    mutationFn: confirmPasswordReset,
  });
};

//To get Private key of current user
export const useGetKey = () => {
  const query = useQuery({
    queryKey: ['key'],
    queryFn: getKey,
    staleTime: Infinity,
  })
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  }
}


// *********************************************User Queries ***********************************************

//Get Current User
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


// Invite Hook
export const useSendInvite = () => {
  return useMutation({
    mutationFn: (email: string) => sendInvite(email),
  });
};

//Get All Users
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


//Singile user by Id
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

//Single user by username
export const useGetUserByUsername = (username: string) => {
  const query = useQuery({
    queryKey: ['user', username],
    queryFn: () => getUserByUsername(username),
    enabled: !!username,
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

//Get user by email
export const useGetUserByEmail = (email: string) => {
  const query = useQuery({
    queryKey: ['user', email],
    queryFn: () => getUserByEmail(email),
    enabled: false, // Only fetch manually when refetch() is called
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
}

//Get all friends
export const useGetFriends = () => {
  const query = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
    staleTime: 5 * 60 * 1000,
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

// Get friends of users
export const useGetUserFriends = (userId: string) => {
  return useQuery({
    queryKey: ['user-friends', userId],
    queryFn: () => getUserFriends(userId),
    enabled: !!userId,
  });
};

// Check Username Query
export const useCheckUsername = (username: string) => {
  return useQuery({
    queryKey: ['checkUsername', username],
    queryFn: () => checkUsername(username),
    enabled: false, // Manual trigger or handle in component
    retry: false,
  });
};

// Update User Mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      queryClient.invalidateQueries({ queryKey: ['users'] }); // Invalidate users list as info might have changed
    },
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};



export const useUploadAvatar = () => {
  const mutation = useMutation({
    mutationFn: uploadAvatar,
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
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


//Respond to friend request mutation
export const useRespondToFriendRequest = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: respondFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

//Cancel friend request mutation
export const useCancelFriendRequest = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};


//Get friend requests query
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

export const useGetFriendRequestCount = () => {
  const query = useQuery({
    queryKey: ['friendRequestCount'],
    queryFn: getFriendRequestCount,
    staleTime: 1000 * 60 * 5,
  });
  return {
    ...query,
    isLoading: query.isLoading,
    error: query.error,
  };
};

// *****************************Conversation Queries *************************
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
    mutationFn: ({ recipientId }: { recipientId: string }) => createConversation(recipientId),
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


export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, deleteFor }: { id: string, deleteFor: 'SELF' | 'ALL' }) => deleteConversation(id, deleteFor),
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


// Message Queries and Mutations
export const useMarkAsSeen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsSeen,
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    }
  });
};

export const useCreateMessage = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createMessage,
    onSuccess: (data, variables) => {
      // Add the new message to the cache
      queryClient.setQueryData(['messages', variables.conversationId], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const queryData = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };

        if (queryData.pages.length === 0) return queryData;

        // Add to the first page (most recent messages)
        const firstPage = queryData.pages[0];
        return {
          ...queryData,
          pages: [
            { ...firstPage, messages: [...firstPage.messages, data] },
            ...queryData.pages.slice(1)
          ]
        };
      });
    },
    onError: (error, variables) => {
      console.error('Message creation failed:', error);
      // Don't invalidate queries on error - let the UI handle the error state
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

// Message update/delete mutations
export const useUpdateMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMessage,
    onSuccess: (data, variables) => {
      // Update local cache immediately
      queryClient.setQueryData(['messages', variables.conversationId], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const queryData = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
        if (queryData.pages.length === 0) return queryData;
        const pages = queryData.pages.map((p) => ({
          ...p,
          messages: p.messages.map((m) => (m.id === variables.messageId ? { ...m, ...data } : m)),
        }));
        return { ...queryData, pages };
      });
    },
  });
};

// Delete Message
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, messageId, deleteType }: { conversationId: string, messageId: string, deleteType: 'SELF' | 'ALL' }) => deleteMessage({ conversationId, messageId, deleteType }),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(['messages', variables.conversationId], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const queryData = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
        if (queryData.pages.length === 0) return queryData;
        const pages = queryData.pages.map((p) => ({
          ...p,
          messages: p.messages.filter((m) => m.id !== variables.messageId),
        }));
        return { ...queryData, pages };
      });
    },
  });
}


// Reactions mutations
export const useAddReaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addReaction,
    onSuccess: (data, variables) => {
      // Update local cache immediately with the new reaction
      queryClient.setQueryData(['messages', variables.conversationId], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const queryData = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
        if (queryData.pages.length === 0) return queryData;

        const pages = queryData.pages.map((page) => ({
          ...page,
          messages: page.messages.map((msg) => {
            if (msg.id === variables.messageId) {
              const existingReactions = msg.reactions || [];
              const reactionExists = existingReactions.some(
                (r: any) => r.userId === data.userId && r.emoji === data.emoji
              );

              if (!reactionExists) {
                return {
                  ...msg,
                  reactions: [...existingReactions, data]
                };
              }
            }
            return msg;
          })
        }));
        return { ...queryData, pages };
      });
    },
  });
};

export const useRemoveReaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeReaction,
    onSuccess: (_data, variables) => {
      // Update local cache immediately by removing the reaction
      queryClient.setQueryData(['messages', variables.conversationId], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const queryData = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
        if (queryData.pages.length === 0) return queryData;

        const pages = queryData.pages.map((page) => ({
          ...page,
          messages: page.messages.map((msg) => {
            if (msg.id === variables.messageId) {
              return {
                ...msg,
                reactions: (msg.reactions || []).filter((r: any) => r.id !== variables.reactionId)
              };
            }
            return msg;
          })
        }));
        return { ...queryData, pages };
      });
    },
  });
};


// Call Hooks
export const useInitiateCall = () => {
  const mutation = useMutation({
    mutationFn: initiateCall,
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

export const useUpdateCallStatus = () => {
  const mutation = useMutation({
    mutationFn: ({ callId, status }: { callId: string; status: string }) => updateCallStatus(callId, status),
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

export const useAnswerCall = () => {
  const mutation = useMutation({
    mutationFn: ({ callId, answerSdp }: { callId: string; answerSdp: any }) => answerCall(callId, answerSdp),
  });
  return {
    ...mutation,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

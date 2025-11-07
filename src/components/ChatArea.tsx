import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { Button } from './ui/button'
import { MoreVertical, Paperclip, Phone, Send, Smile, Video, AlertTriangle, X, Reply } from 'lucide-react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatStore } from '@/store/useChatStore';
import { useGetMessages, useCreateMessage, useGetMe, useGetConversationById } from '@/lib/react-query/queries';
import { useSocket } from '@/lib/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '@/types/types';
import { decryptMessage, decryptPrivateKey, encryptMessage } from '@/lib/crypto';
import { useCrypto } from '@/lib/crypto-context';
import { MessageSkeleton } from './Loading';
import MessageBubble from './MessageBubble';
import { ComponentErrorBoundary } from './ErrorBoundary';
import EmojiPicker from 'emoji-picker-react'
// import { useCallStore } from "@/store/useCallStore";
import dynamic from "next/dynamic";
import StartCallButton from './StartButton';
// import { CallButton } from './calls';

interface UIMessage extends Message {
  isOwn: boolean;
}

// Dynamically import call-related components
// const CallWindow = dynamic(() => import('./calls/CallWindow'), { ssr: false });
// const IncomingCall = dynamic(() => import('./calls/IncomingCall'), { ssr: false });

// Typing indicator component
const TypingIndicator = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;
  
  return (
    <div className="flex justify-start mb-2">
      <div className="max-w-[70%] bg-secondary rounded-2xl rounded-bl-none p-3 px-4">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
};

const ChatArea = () => {
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<UIMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [decryptedReplyingMessage, setDecryptedReplyingMessage] = useState<string>("");


//   const ClientOnlyCallButton = dynamic(
//   () => import("./calls/ClientOnlyCallButton"),
//   { ssr: false }
// );


  // Current User
  const { data: user, error: userError } = useGetMe();

  // Current Conversation's ID
  const { currentConversation, currentParticipant, replyingTo, clearReplyingTo } = useChatStore();

  const { data: conversationData, error: conversationError } = useGetConversationById(currentConversation || "");

  // Messages in Current Conversation
  const { data: messagePages, isLoading: messagesLoading, error: messagesError } = useGetMessages(currentConversation, !!currentConversation);

  // Instance for message creation
  const createMessageMutation = useCreateMessage();
  const queryClient = useQueryClient();

  // Crypto context for cached private key
  const { decryptedPrivateKey, isLoading: cryptoLoading } = useCrypto();

  // Socket subscription with real-time updates
  const socket = useSocket();
  useEffect(() => {
    if (!socket || !currentConversation || !user) {
      console.log('Socket setup skipped:', { socket: !!socket, currentConversation, user: !!user });
      return;
    }

    console.log('Setting up socket for conversation:', currentConversation);

    // Join conversation room
    socket.emit('join_conversation', currentConversation);
    console.log('Emitted join_conversation for:', currentConversation);

    const handler = (newMessage: Message) => {
      console.log('ChatArea received socket message:', newMessage);
      console.log('Current user ID:', user?.id, 'Message sender ID:', newMessage.senderId);

      // Only add message if it's not from current user (to avoid duplicates)
      if (newMessage.senderId === user?.id) {
        console.log('Ignoring own message from socket');
        return;
      }

      // Add message to query cache
      queryClient.setQueryData(['messages', currentConversation], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const data = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
        if (data.pages.length === 0) return data;

        // Check if message already exists to prevent duplicates
        const firstPage = data.pages[0];
        const messageExists = firstPage.messages.some(msg => msg.id === newMessage.id);
        if (messageExists) {
          console.log('Message already exists, skipping');
          return data;
        }

        console.log('Adding new message to cache:', newMessage.id);
        // Add to the first page (most recent messages)
        return {
          ...data,
          pages: [
            { ...firstPage, messages: [...firstPage.messages, newMessage] },
            ...data.pages.slice(1)
          ]
        };
      });
    };

    // Handle new messages
    socket.on('receive_message', handler);
    console.log('Added receive_message listener');

    // Handle message updates
    const handleMessageUpdate = (updatedMessage: Message) => {
      console.log('ChatArea received message update:', updatedMessage);
      queryClient.setQueryData(['messages', currentConversation], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const data = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
        if (data.pages.length === 0) return data;

        const pages = data.pages.map((page) => ({
          ...page,
          messages: page.messages.map((msg) => 
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
          )
        }));
        return { ...data, pages };
      });
    };

    // Handle message deletions
    const handleMessageDelete = ({ messageId }: { messageId: string }) => {
      console.log('ChatArea received message deletion:', messageId);
      queryClient.setQueryData(['messages', currentConversation], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const data = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
        if (data.pages.length === 0) return data;

        const pages = data.pages.map((page) => ({
          ...page,
          messages: page.messages.filter((msg) => msg.id !== messageId)
        }));
        return { ...data, pages };
      });
    };

    // Handle reaction additions
    const handleReactionAdd = (reaction: { id: string; emoji: string; messageId: string; userId: string; user: { id: string; fullName: string; username: string } }) => {
      console.log('ChatArea received reaction addition:', reaction);
      queryClient.setQueryData(['messages', currentConversation], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const data = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
        if (data.pages.length === 0) return data;

        const pages = data.pages.map((page) => ({
          ...page,
          messages: page.messages.map((msg) => {
            if (msg.id === reaction.messageId) {
              const existingReactions = msg.reactions || [];
              const reactionExists = existingReactions.some(
                (r: { userId: string; emoji: string }) => r.userId === reaction.userId && r.emoji === reaction.emoji
              );
              
              if (!reactionExists) {
                return {
                  ...msg,
                  reactions: [...existingReactions, reaction]
                };
              }
            }
            return msg;
          })
        }));
        return { ...data, pages };
      });
    };

    // Handle reaction removals
    const handleReactionRemove = ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      console.log('ChatArea received reaction removal:', { messageId, emoji });
      queryClient.setQueryData(['messages', currentConversation], (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const data = oldData as { pages: Array<{ messages: Message[]; nextCursor: string | null }> };
        if (data.pages.length === 0) return data;

        const pages = data.pages.map((page) => ({
          ...page,
          messages: page.messages.map((msg) => {
            if (msg.id === messageId) {
              return {
                ...msg,
                reactions: (msg.reactions || []).filter((r: { emoji: string }) => r.emoji !== emoji)
              };
            }
            return msg;
          })
        }));
        return { ...data, pages };
      });
    };

    // Add all socket listeners
    socket.on('message_updated', handleMessageUpdate);
    socket.on('message_deleted', handleMessageDelete);
    socket.on('reaction_added', handleReactionAdd);
    socket.on('reaction_removed', handleReactionRemove);

    return () => {
      console.log('Cleaning up socket listeners for conversation:', currentConversation);
      socket.off('receive_message', handler);
      socket.off('message_updated', handleMessageUpdate);
      socket.off('message_deleted', handleMessageDelete);
      socket.off('reaction_added', handleReactionAdd);
      socket.off('reaction_removed', handleReactionRemove);
    };
  }, [socket, currentConversation, queryClient, user]);


  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Combining multiple pages of messages into one (optimized)
  const messages: UIMessage[] = useMemo(() => {
    if (!messagePages?.pages || !user?.id) return [];

    try {
      const serverMessages = messagePages.pages
        .flatMap((page: unknown) => {
          const typedPage = page as { messages: Message[]; nextCursor: string | null };
          return typedPage.messages || [];
        })
        .map((msg: Message) => ({
          ...msg,
          isOwn: msg.senderId === user.id,
          status: 'delivered' as const
        }));

      // Merge with local messages more efficiently
      const localMessagesMap = new Map(localMessages.map(msg => [msg.id, msg]));
      const mergedMessages = new Map<string, UIMessage>();

      // Add server messages
      serverMessages.forEach(msg => {
        const localMsg = localMessagesMap.get(msg.id);
        mergedMessages.set(msg.id, {
          ...msg,
          status: localMsg?.status === 'sending' ? 'sent' : msg.status
        });
      });

      // Add local messages that aren't yet on server
      localMessages.forEach(msg => {
        if (msg.status === 'sending' && !mergedMessages.has(msg.id)) {
          mergedMessages.set(msg.id, msg);
        }
      });

      return Array.from(mergedMessages.values())
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      console.error('Error processing messages:', error);
      setError('Failed to load messages');
      return [];
    }
  }, [messagePages, user?.id, localMessages]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const timeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, scrollToBottom]);

  // Clean up local messages when server messages arrive
  useEffect(() => {
    if (messagePages?.pages?.length) {
      setLocalMessages(prev => prev.filter(msg => msg.status === 'sending'));
    }
  }, [messagePages?.pages?.length]);

  // Handle errors
  useEffect(() => {
    if (userError || conversationError || messagesError) {
      const errorMsg = userError?.message || conversationError?.message || messagesError?.message || 'An error occurred';
      setError(errorMsg);
      console.error('Chat error:', { userError, conversationError, messagesError });
    }
  }, [userError, conversationError, messagesError]);

  // Socket typing events
  useEffect(() => {
    if (!socket || !currentConversation) return;

    const handleTyping = () => setIsTyping(true);
    const handleStopTyping = () => setIsTyping(false);

    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, currentConversation]);

  // Typing timeout ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing events
  const handleTyping = useCallback(() => {
    if (!socket || !currentConversation) return;

    // Emit typing event
    socket.emit('typing', { conversationId: currentConversation });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: currentConversation });
    }, 1000);
  }, [socket, currentConversation]);

  // Send new Message in current conversation (optimized)
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentConversation || !user || !currentParticipant || !decryptedPrivateKey || !conversationData) {
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    setError(null); // Clear any previous errors
    
    // Stop typing when sending message
    if (socket && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('stop_typing', { conversationId: currentConversation });
    }

    const participant = conversationData.participants.find((p: { user: { id: string } }) => p.user.id !== user.id)?.user;
    if (!participant) {
      setError('Unable to find conversation participant');
      setNewMessage(messageText);
      return;
    }

    // Create optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: UIMessage = {
      id: tempId,
      senderId: user.id,
      content: messageText,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: user,
      nonce: '',
      isOwn: true,
      status: "sending"
    };
    
    setLocalMessages(prev => [...prev, optimisticMessage]);

    try {
      // Encrypt message
      const { ciphertext, nonce } = await encryptMessage(messageText, participant.publicKey, decryptedPrivateKey);
      
      // Update message status to sent
      setLocalMessages(prev =>
        prev.map(msg =>
          msg.id === tempId ? { ...msg, status: 'sent' } : msg
        )
      );
      
      // Send message to server
      const serverMessage = await createMessageMutation.mutateAsync({ 
        conversationId: currentConversation, 
        content: ciphertext, 
        nonce,
        parentId: replyingTo?.id
      });
      
      // Emit message via socket for real-time updates
      if (socket && currentConversation) {
        console.log('Emitting message via client socket:', serverMessage);
        socket.emit('send_message', {
          conversationId: currentConversation,
          message: serverMessage
        });
      }
      
      // Remove optimistic message and let the server message take over
      setLocalMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      // Clear reply state after successful send
      if (replyingTo) {
        clearReplyingTo();
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message status to error
      setLocalMessages(prev =>
        prev.map(msg =>
          msg.id === tempId ? { ...msg, status: 'error' } : msg
        )
      );
      
      // Set error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(`Failed to send message: ${errorMessage}`);
      
      // Restore message text for retry
      setNewMessage(messageText);
    }
  }, [newMessage, currentConversation, user, currentParticipant, decryptedPrivateKey, conversationData, socket, createMessageMutation, replyingTo, clearReplyingTo]);


  // Handle input change with typing indicator
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  }, [handleTyping]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Clear typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Toggle emoji picker visibility
  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker(prev => !prev);
  }, []);

  // Handle emoji selection
  const onEmojiClick = useCallback((emojiData: { emoji: string }) => {
    setNewMessage(prev => prev + emojiData.emoji);
    // Focus back on input after emoji selection
    inputRef.current?.focus();
  }, []);

  // console.log("replying to", replyingTo)
  const handleDecryptedReplyingMessage =  async () => {
    if (replyingTo) {
      let privateKey, publicKey;

      const isItMine = replyingTo.senderId === user?.id;
      if (isItMine) {
        privateKey = decryptedPrivateKey;
        publicKey = currentParticipant?.publicKey;
      } else {
        publicKey = user?.publicKey;
        privateKey = decryptPrivateKey(currentParticipant?.encryptedPrivateKey || "", currentParticipant?.email || "");
      }

      const text = await decryptMessage(replyingTo.content, replyingTo?.nonce || "", publicKey, privateKey||"");
      // console.log("Text", text)
      setDecryptedReplyingMessage(text);

    }
  }

  useEffect(() => {
    handleDecryptedReplyingMessage();
    // console.log("Decrypted replying message",decryptedReplyingMessage)
  }, [replyingTo]);




  // Loading states
  if (messagesLoading || cryptoLoading) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Chat Header Skeleton */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
            <div>
              <div className="h-4 bg-muted rounded w-24 mb-1 animate-pulse"></div>
              <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
            ))}
          </div>
        </div>
        <MessageSkeleton />
        {/* Input Skeleton */}
        <div className="p-4 border-t border-border">
          <div className="bg-secondary rounded-full px-4 py-2 animate-pulse">
            <div className="h-10 bg-muted rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a conversation to start chatting
      </div>
    );
  }

  if (messagesError && !messages.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load messages</h3>
        <p className="text-muted-foreground mb-4">{messagesError.message}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  
  return (
    <ComponentErrorBoundary>
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={currentParticipant?.avatar} />
              <AvatarFallback>{currentParticipant?.fullName?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{currentParticipant?.fullName || 'Unknown User'}</h3>
              <p className="text-xs text-muted-foreground">
                {isTyping ? 'typing...' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
   {currentParticipant && ( 
    <>
      {/* <CallButton
        callType="audio"
        targetUser={currentParticipant}
      />  */}
      
      <StartCallButton
        recipientId={currentParticipant?.id}
      />
    </>
  )}

  <Button 
    variant="outline"
    className="h-8 w-8 p-0 rounded-full"
  >
    <MoreVertical className="h-4 w-4" />
  </Button>
</div>
        </div>

        {/* Call Interface */}
        {/* <CallWindow />
        <IncomingCall /> */}

        {/* Error Display */}
        {error && (
          <div className="px-6 py-2 bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="ml-auto h-auto p-1 text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {messages && messages.length > 0 ? (
            <>
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  conversationData={conversationData}
                  conversationId={currentConversation}
                />
              ))}
              <TypingIndicator isVisible={isTyping} />
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>Be the first to send a message</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Preview */}
        {replyingTo && (
          <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Replying to {replyingTo.sender.fullName || replyingTo.sender.username}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-[200px]">
                  {decryptedReplyingMessage.length > 50 ? `${decryptedReplyingMessage.substring(0, 50)}...` : decryptedReplyingMessage}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearReplyingTo}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
            <Button variant="ghost" size="icon" className="rounded-full" title="Attach File">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              ref={inputRef}
              placeholder={replyingTo ? `Reply to ${replyingTo.sender.fullName || replyingTo.sender.username}...` : "Type a message..."}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
            <div className="relative" ref={emojiPickerRef}>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className={`rounded-full cursor-pointer ${showEmojiPicker ? 'bg-accent' : ''}`} 
                title="Emojis"
                onClick={toggleEmojiPicker}
              >
                {showEmojiPicker ? <X className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
              </Button>
              {showEmojiPicker && (
                <div className="absolute bottom-10 right-0 z-50">
                  <EmojiPicker 
                    onEmojiClick={onEmojiClick}
                    width={300}
                    height={350}
                    searchPlaceholder="Search emojis..."
                    previewConfig={{
                      showPreview: false
                    }}
                    skinTonesDisabled
                  />
                </div>
              )}
            </div>
            <Button 
              size="icon" 
              className="rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 cursor-pointer" 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}

export default ChatArea
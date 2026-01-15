/**
 * ChatArea Component
 * 
 * The main chat interface for displaying and sending encrypted messages.
 * 
 * Key Features:
 * - Real-time messaging with Supabase subscriptions
 * - End-to-end encryption for all messages
 * - Optimistic UI updates for instant message feedback
 * - Typing indicators to show when the other person is typing
 * - Image support with previews
 * - Reply/quote functionality
 * - Emoji picker integration
 * - Auto-scroll to latest messages
 * 
 * Real-time Features:
 * - Message updates via Supabase Postgres changes
 * - Typing indicators via Supabase broadcast
 * - Reaction updates via Supabase broadcast
 * 
 * Performance Optimizations:
 * - Memoized values (messages, participant)
 * - useCallback for handlers to prevent re-renders
 * - Optimistic updates (show message immediately before server confirms)
 * - Message deduplication (merge local + server messages)
 */
'use client';

import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { Button } from './ui/button'
import { MoreVertical, Paperclip, Phone, Send, Smile, Video, AlertTriangle, X, Reply, MessageSquare, Circle, Image as ImageIcon, ArrowLeftSquare, ArrowLeft, Image } from 'lucide-react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useChatStore } from '@/store/useChatStore';
import { usePresenceStore } from '@/store/usePresenceStore';
import { useGetMessages, useCreateMessage, useGetMe, useGetConversationById, useMarkAsSeen } from '@/lib/react-query/queries';

import { createClient } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '@/types/types';
import { decryptMessage, decryptPrivateKey, encryptMessage } from '@/lib/crypto';
import { useCrypto } from '@/lib/crypto-context';
import { MessageSkeleton } from './Loading';
import MessageBubble from './MessageBubble';
import { ComponentErrorBoundary } from './ErrorBoundary';
import EmojiPicker from 'emoji-picker-react'
import dynamic from "next/dynamic";
import StartCallButton from './StartButton';
import Link from 'next/link';
import { TopRightChatButton } from './smaller';

/**
 * Extended Message type with UI-specific properties
 * isOwn - true if the current user sent this message
 */
interface UIMessage extends Message {
  isOwn: boolean;
}

/**
 * Typing Indicator Component
 * 
 * Displays an animated bubble with bouncing dots when the other person is typing.
 * Uses staggered animation delays for a nice wave effect.
 */
const TypingIndicator = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="max-w-[70%] bg-secondary/80 border-border rounded-2xl rounded-bl-none shadow-sm">
        <div className="p-3 px-4">
          <div className="flex items-center space-x-1.5">
            {/* Three bouncing dots with staggered timing */}
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const ChatArea = ({ conversationId }: { conversationId: string }) => {
  // ========== State Management ==========

  // Message input state
  const [newMessage, setNewMessage] = useState('');

  // Local optimistic messages (shown immediately before server confirms)
  const [localMessages, setLocalMessages] = useState<UIMessage[]>([]);

  // UI state
  const [isTyping, setIsTyping] = useState(false); // Is the other person typing?
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [decryptedReplyingMessage, setDecryptedReplyingMessage] = useState<string>(""); // Decrypted version of message we're replying to
  const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);

  // Refs for DOM elements and timeouts
  const messagesEndRef = useRef<HTMLDivElement>(null); // For auto-scrolling to bottom
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== Data Fetching ==========

  // Current logged-in user
  const { data: user, error: userError } = useGetMe();

  // Global chat state (reply management, current conversation)
  const { replyingTo, clearReplyingTo, setCurrentConversation } = useChatStore();
  const { onlineUsers } = usePresenceStore();
  const currentConversation = conversationId;


  // Keep the global store in sync with current conversation
  // This helps track "last visited" conversation for features like unread badges
  useEffect(() => {
    if (conversationId) {
      setCurrentConversation(conversationId);
    }
  }, [conversationId, setCurrentConversation]);

  // Fetch conversation details (participants, etc.)
  const { data: conversationData, error: conversationError } = useGetConversationById(currentConversation || "");

  /**
   * Find the other person in this conversation
   * We need their public key for encryption!
   */
  const currentParticipant = useMemo(() => {
    if (!conversationData || !user) return null;
    return conversationData.participants.find((p: any) => p.user.id !== user.id)?.user;
  }, [conversationData, user]);

  // Fetch paginated messages for this conversation
  const { data: messagePages, isLoading: messagesLoading, error: messagesError } = useGetMessages(currentConversation, !!currentConversation);

  // Mark as seen mutation
  const { mutate: markAsSeen } = useMarkAsSeen();

  // Mark messages as seen when conversation is opened
  // Only trigger when conversation changes or user changes, not on every message update
  useEffect(() => {
    if (currentConversation && user) {
      markAsSeen(currentConversation);
    }
  }, [currentConversation, user?.id]); // Only re-run when conversation or user ID changes

  // React Query instance for creating messages
  const createMessageMutation = useCreateMessage();
  const queryClient = useQueryClient();

  // Get our decrypted private key from the Crypto Context
  // This was fetched once at app load and cached, so we don't decrypt it for every message!
  const { decryptedPrivateKey, isLoading: cryptoLoading } = useCrypto();

  // ========== Supabase Real-time Setup ==========

  // Supabase client (created once, reused for subscriptions)
  const [supabase] = useState(() => createClient());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  /**
   * Real-time subscriptions for this conversation
   * Listens for message updates, typing events, and reactions
   */
  useEffect(() => {
    if (!currentConversation || !user) return;

    const newChannel = supabase.channel(`chat:${currentConversation}`);

    newChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Message', filter: `conversationId=eq.${currentConversation}` }, (payload) => {
        console.log('[ChatArea] Database change detected:', payload.eventType, payload);
        queryClient.invalidateQueries({ queryKey: ['messages', currentConversation] });
      })
      .on('broadcast', { event: 'typing' }, () => setIsTyping(true))
      .on('broadcast', { event: 'stop_typing' }, () => setIsTyping(false))
      .on('broadcast', { event: 'reaction_update' }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', currentConversation] });
      })
      .on('broadcast', { event: 'messages_seen' }, () => {
        console.log('[ChatArea] Messages marked as seen, refetching...');
        queryClient.invalidateQueries({ queryKey: ['messages', currentConversation] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
      setChannel(null);
    };
  }, [currentConversation, user, queryClient, supabase]);


  /**
   * Auto-scroll helper
   * Smoothly scrolls to the bottom of the message list
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * Merge server messages with local optimistic messages
   * Shows messages instantly while waiting for server confirmation
   */
  const messages: UIMessage[] = useMemo(() => {
    if (!messagePages?.pages || !user?.id) return [];

    try {
      // Flatten all pages from infinite query into one array
      const serverMessages = messagePages.pages
        .flatMap((page: unknown) => {
          const typedPage = page as { messages: Message[]; nextCursor: string | null };
          return typedPage.messages || [];
        })
        .map((msg: Message) => ({
          ...msg,
          isOwn: msg.senderId === user.id,
          // Use the actual status from the database, don't hardcode it
          status: msg.status || 'sent' // Default to 'sent' if no status
        }));

      // Create efficient lookup maps
      const localMessagesMap = new Map(localMessages.map(msg => [msg.id, msg]));
      const mergedMessages = new Map<string, UIMessage>();

      // Add server messages (source of truth)
      serverMessages.forEach(msg => {
        const localMsg = localMessagesMap.get(msg.id);
        mergedMessages.set(msg.id, {
          ...msg,
          // If we have a local version marked as "sending", keep it as sending
          // Otherwise use the server status
          status: localMsg?.status === 'sending' ? 'sending' : msg.status
        });
      });

      // Add local optimistic messages that haven't reached server yet
      localMessages.forEach(msg => {
        if (msg.status === 'sending' && !mergedMessages.has(msg.id)) {
          mergedMessages.set(msg.id, msg);
        }
      });

      // Sort by timestamp (oldest first)
      return Array.from(mergedMessages.values())
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      console.error('Error processing messages:', error);
      setError('Failed to load messages');
      return [];
    }
  }, [messagePages, user?.id, localMessages]);

  /**
   * Auto-scroll when new messages arrive
   * 
   * Small delay ensures DOM has updated with new message before scrolling
   */
  useEffect(() => {
    if (messages.length > 0) {
      const timeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, scrollToBottom]);

  /**
   * Clean up local optimistic messages once server has them
   * 
   * When messagePages updates (server confirmed our message),
   * we can remove the "sending" local versions
   */
  useEffect(() => {
    if (messagePages?.pages?.length) {
      setLocalMessages(prev => prev.filter(msg => msg.status === 'sending'));
    }
  }, [messagePages?.pages?.length]);

  /**
   * Global error handler
   * Display any errors from user fetch, conversation fetch, or message fetch
   */
  useEffect(() => {
    if (userError || conversationError || messagesError) {
      const errorMsg = userError?.message || conversationError?.message || messagesError?.message || 'An error occurred';
      setError(errorMsg);
      console.error('Chat error:', { userError, conversationError, messagesError });
    }
  }, [userError, conversationError, messagesError]);


  // ========== Event Handlers ==========

  // Ref to track typing timeout (so we can clear it when user keeps typing)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle typing events
   * 
   * Flow:
   * 1. User types -> broadcast "typing" event
   * 2. Clear any existing timeout
   * 3. Set new timeout to broadcast "stop_typing" after 1 second
   * 
   * This creates the effect where typing indicator shows when actively typing,
   * then disappears 1 second after they stop.
   */
  const handleTyping = useCallback(() => {
    if (!channel || !currentConversation) return;

    // Let other users know we're typing
    channel.send({ type: 'broadcast', event: 'typing' });

    // Clear the previous "stop typing" timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Schedule a "stop typing" event for 1 second from now
    // If user keeps typing, this gets cancelled and rescheduled
    typingTimeoutRef.current = setTimeout(() => {
      channel.send({ type: 'broadcast', event: 'stop_typing' });
    }, 1000);
  }, [channel, currentConversation]);

  /**
   * Broadcast reaction updates
   * Called when user adds/removes a reaction to a message
   */
  const handleBroadcastReaction = useCallback(() => {
    channel?.send({ type: 'broadcast', event: 'reaction_update' });
  }, [channel]);

  /**
   * Handle image selection from file input
   * \n   * Validates file type and size before creating a preview
   */
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept image files
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Limit to 10MB (prevents huge uploads)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    // Create a preview URL for immediate display
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage({
        file,
        preview: reader.result as string // Data URL for preview
      });
    };
    reader.readAsDataURL(file);
  }, []);

  /**
   * Convert image file to base64 string
   * Used when sending image to server (stored as base64 in database)
   */
  const convertImageToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Remove selected image and clear file input
   */
  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    // Clear the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Send new Message in current conversation (optimized)
  const handleSendMessage = useCallback(async () => {
    if ((!newMessage.trim() && !selectedImage) || !currentConversation || !user || !currentParticipant || !decryptedPrivateKey || !conversationData) {
      return;
    }

    const messageText = newMessage.trim();
    const imageToSend = selectedImage;

    // Clear input and image immediately
    setNewMessage('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null); // Clear any previous errors

    // Stop typing when sending message
    if (channel && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      channel.send({ type: 'broadcast', event: 'stop_typing' });
    }

    const participant = conversationData?.participants?.find((p: { user: { id: string } }) => p.user.id !== user.id)?.user;

    if (!participant) {
      setError('Unable to find conversation participant');
      setNewMessage(messageText);
      if (imageToSend) {
        setSelectedImage(imageToSend);
      }
      return;
    }

    // Create optimistic message
    const tempId = `temp-${Date.now()}`;
    const messageType: 'TEXT' | 'IMAGE' = (imageToSend && !messageText) ? 'IMAGE' : 'TEXT';
    const optimisticMessage: UIMessage = {
      id: tempId,
      senderId: user.id,
      content: messageText || '',
      media: imageToSend?.preview,
      type: messageType,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: user,
      nonce: '',
      isOwn: true,
      status: "sending",
      parentMessage: replyingTo || undefined,
      parentMessageId: replyingTo?.id
    };

    setLocalMessages(prev => [...prev, optimisticMessage]);

    try {
      let ciphertext = '';
      let nonce = '';
      let mediaUrl = '';
      let messageType: 'TEXT' | 'IMAGE' = 'TEXT';

      // Determine message type
      if (imageToSend && messageText) {
        messageType = 'TEXT'; // Text with image is still TEXT type
      } else if (imageToSend && !messageText) {
        messageType = 'IMAGE'; // Image-only is IMAGE type
      }

      // If there's text, encrypt it
      if (messageText) {
        const encrypted = await encryptMessage(messageText, participant.publicKey, decryptedPrivateKey);
        ciphertext = encrypted.ciphertext;
        nonce = encrypted.nonce;
      }
      // If no text, don't encrypt (empty content for image-only messages)

      // If there's an image, convert to base64
      if (imageToSend) {
        mediaUrl = await convertImageToBase64(imageToSend.file);
      }

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
        media: mediaUrl,
        nonce: nonce || undefined,
        type: messageType,
        parentId: replyingTo?.id
      });



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

      // Restore message text and image for retry
      setNewMessage(messageText);
      if (imageToSend) {
        setSelectedImage(imageToSend);
      }
    }
  }, [newMessage, selectedImage, currentConversation, user, currentParticipant, decryptedPrivateKey, conversationData, channel, createMessageMutation, replyingTo, clearReplyingTo, convertImageToBase64]);


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
  const handleDecryptedReplyingMessage = async () => {
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

      const text = await decryptMessage(replyingTo.content, replyingTo?.nonce || "", publicKey, privateKey || "");
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
      <div className="flex-1 flex flex-col bg-background">
        {/* Chat Header Skeleton */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
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
        <div className="p-4 border-t border-border bg-background">
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
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">Select a conversation</h3>
          <p className="text-sm text-muted-foreground">Choose a conversation from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  if (messagesError && !messages.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Failed to load messages</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">{messagesError.message}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="active:scale-95 transition-transform duration-150"
        >
          Retry
        </Button>
      </div>
    );
  }


  return (
    <ComponentErrorBoundary>
      <div className="flex-1 flex flex-col bg-background h-full">
        {/* Chat Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center gap-2">
              <Link className='md:hidden' href="/chat"><ArrowLeft className="w-6 h-6" /></Link>
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={currentParticipant?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {currentParticipant?.fullName?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${isTyping ? 'bg-yellow-500 animate-pulse' :
                currentParticipant && onlineUsers.has(currentParticipant.id) ? 'bg-green-500' : 'bg-gray-400'
                }`} />

            </div>
            <div>
              <h3 className="font-semibold text-sm">{currentParticipant?.fullName || 'Unknown User'}</h3>
              <div className="flex items-center gap-1.5">
                {isTyping ? (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-xs text-primary font-medium">typing...</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {currentParticipant && onlineUsers.has(currentParticipant.id) ? 'Online' : 'Offline'}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentParticipant && (
              <>
                <StartCallButton
                  recipientId={currentParticipant?.id}
                />
              </>
            )}
            <TopRightChatButton conversationId={conversationId} />
          </div>
        </div>

        {/* Call Interface */}
        {/* <CallWindow />
        <IncomingCall /> */}

        {/* Error Display */}
        {error && (
          <div className="px-6 py-3 bg-destructive/10 border-b border-destructive/20 animate-in slide-in-from-top duration-300">
            <Card className="bg-destructive/5 border-destructive/20">
              <div className="flex items-center gap-2 text-destructive px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-sm flex-1">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="h-6 w-6 p-0 rounded-full hover:bg-destructive/20 active:scale-95 transition-all duration-150"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {messages && messages.length > 0 ? (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  conversationData={conversationData}
                  conversationId={currentConversation}
                  onBroadcastReaction={handleBroadcastReaction}
                />
              ))}
              <TypingIndicator isVisible={isTyping} />
            </>
          ) : (
            <div className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center p-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Be the first to send a message and start the conversation
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image Preview */}
        {selectedImage && (
          <div className="px-6 py-3 bg-accent/50 border-t border-border animate-in slide-in-from-bottom duration-300">
            <Card className="bg-card border-border">
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-primary">Image Preview</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="h-6 w-6 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all duration-150"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={selectedImage.preview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Reply Preview */}
        {replyingTo && (
          <div className="px-6 py-3 bg-accent/50 border-t border-border animate-in slide-in-from-bottom duration-300">
            <Card className="bg-card border-border">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Reply className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary mb-0.5">
                      Replying to {replyingTo.sender.fullName || replyingTo.sender.username}
                    </p>
                    {replyingTo?.type === 'TEXT' ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {decryptedReplyingMessage.length > 50 ? `${decryptedReplyingMessage.substring(0, 50)}...` : decryptedReplyingMessage}
                      </p>
                    ) : replyingTo?.type === 'IMAGE' ? (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Image className="w-4 h-4 text-primary shrink-0" /> Photo
                      </p>
                    ) : replyingTo?.type === 'VIDEO' ? (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Video className="w-4 h-4 text-primary shrink-0" /> Video
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground truncate">
                        Unknown Type
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearReplyingTo}
                  className="h-7 w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all duration-150 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-background sticky bottom-0 z-10">
          <Card className="bg-secondary/50 border-border shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-accent active:scale-95 transition-all duration-150"
                title="Send Image"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-accent active:scale-95 transition-all duration-150"
                title="Attach File"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                ref={inputRef}
                placeholder={replyingTo ? `Reply to ${replyingTo.sender.fullName || replyingTo.sender.username}...` : "Type a message..."}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 placeholder:text-muted-foreground"
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
              />
              <div className="relative" ref={emojiPickerRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`rounded-full cursor-pointer hover:bg-accent active:scale-95 transition-all duration-150 ${showEmojiPicker ? 'bg-primary/10 text-primary' : ''
                    }`}
                  title="Emojis"
                  onClick={toggleEmojiPicker}
                >
                  {showEmojiPicker ? <X className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 right-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Card className="border-border shadow-lg">
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
                    </Card>
                  </div>
                )}
              </div>
              <Button
                size="icon"
                className={`rounded-full transition-all duration-200 active:scale-95 ${(newMessage.trim() || selectedImage)
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && !selectedImage}
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}

export default ChatArea
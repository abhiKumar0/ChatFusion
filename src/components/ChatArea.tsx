'use client';

import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { Button } from './ui/button'
import { MoreVertical, Paperclip, Phone, Send, Smile, Video, AlertTriangle, X, Reply, MessageSquare, Circle, Image as ImageIcon } from 'lucide-react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useChatStore } from '@/store/useChatStore';
import { useGetMessages, useCreateMessage, useGetMe, useGetConversationById } from '@/lib/react-query/queries';
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
    <div className="flex justify-start mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="max-w-[70%] bg-secondary/80 border-border rounded-2xl rounded-bl-none shadow-sm">
        <div className="p-3 px-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </Card>
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [decryptedReplyingMessage, setDecryptedReplyingMessage] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);


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

  // Supabase Realtime subscription
  const [supabase] = useState(() => createClient());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!currentConversation || !user) return;

    const newChannel = supabase.channel(`chat:${currentConversation}`);

    newChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Message', filter: `conversationId=eq.${currentConversation}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', currentConversation] });
      })
      .on('broadcast', { event: 'typing' }, () => setIsTyping(true))
      .on('broadcast', { event: 'stop_typing' }, () => setIsTyping(false))
      .on('broadcast', { event: 'reaction_update' }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', currentConversation] });
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
      setChannel(null);
    };
  }, [currentConversation, user, queryClient, supabase]);


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



  // Typing timeout ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing events
  const handleTyping = useCallback(() => {
    if (!channel || !currentConversation) return;

    // Emit typing event
    channel.send({ type: 'broadcast', event: 'typing' });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      channel.send({ type: 'broadcast', event: 'stop_typing' });
    }, 1000);
  }, [channel, currentConversation]);

  const handleBroadcastReaction = useCallback(() => {
    channel?.send({ type: 'broadcast', event: 'reaction_update' });
  }, [channel]);

  // Handle image selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage({
        file,
        preview: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  }, []);

  // Convert image to base64
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

  // Remove selected image
  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
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

    const participant = conversationData.participants.find((p: { user: { id: string } }) => p.user.id !== user.id)?.user;
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
      status: "sending"
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
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={currentParticipant?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {currentParticipant?.fullName?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${isTyping ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
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
                  <p className="text-xs text-muted-foreground">Online</p>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-accent active:scale-95 transition-all duration-150"
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
                    <p className="text-xs text-muted-foreground truncate">
                      {decryptedReplyingMessage.length > 50 ? `${decryptedReplyingMessage.substring(0, 50)}...` : decryptedReplyingMessage}
                    </p>
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
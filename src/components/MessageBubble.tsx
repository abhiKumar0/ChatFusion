/**
 * MessageBubble Component
 * 
 * A fully-featured, encrypted message display component for the chat application.
 * 
 * Key Features:
 * - End-to-end encryption using NaCl box encryption
 * - Automatic message decryption with caching for performance
 * - Message editing (within 48-hour window)
 * - Message deletion with confirmation
 * - Emoji reactions with toggle behavior
 * - Reply/quote functionality
 * - Image attachment support
 * - Delivery status indicators (sending → sent → delivered → seen)
 * 
 * Encryption Details:
 * - Uses your private key (from Crypto Context) + other person's public key
 * - Private keys are fetched from a secure server endpoint, not from user objects
 * - Decrypted messages are cached globally to avoid re-decryption on re-renders
 * 
 * Performance Optimizations:
 * - React.memo to prevent unnecessary re-renders
 * - Message cache to avoid redundant decryption
 * - Memoized values (participant, parentMsg, cacheKey)
 * - Cancelled state checks to prevent updates on unmounted components
 */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Message } from '@/types/types';
import { useGetMe } from "@/lib/react-query/queries.ts";
import { decryptMessage, decryptPrivateKey } from "@/lib/crypto.ts";
import { useCrypto } from "@/lib/crypto-context.tsx";
import { Ellipsis, Smile, Check, X, Reply, Image } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDeleteMessage, useUpdateMessage, useAddReaction, useRemoveReaction } from '@/lib/react-query/queries';
import { Button } from '@/components/ui/button';
import { encryptMessage } from '@/lib/crypto';
import EmojiPicker from 'emoji-picker-react';
import { useChatStore } from '@/store/useChatStore';

/**
 * Props for the MessageBubble component
 * 
 * message - The message object with additional metadata (isOwn tells us if current user sent it)
 * conversationData - Info about conversation participants (needed for encryption/decryption)
 * conversationId - ID of the conversation (needed for mutations like edit/delete)
 * onBroadcastReaction - Optional callback to notify other components when reactions change
 */
interface MessageBubbleProps {
    message: Message & { isOwn: boolean; status?: string };
    conversationData?: {
        participants: Array<{
            user: {
                id: string;
                email: string;
                fullName: string;
                publicKey: string; // Other user's public key - needed for decryption
            };
        }>;
    };
    conversationId: string;
    onBroadcastReaction?: () => void;
}

/**
 * Global cache for decrypted messages
 * 
 * Why? Decryption is computationally expensive and we don't want to re-decrypt
 * the same message every time the component re-renders. This cache persists across
 * component instances, so scrolling up/down won't trigger unnecessary decryptions.
 * 
 * Key format: `${messageId}-${content}-${nonce}`
 * Value: The decrypted plaintext message
 */
const messageCache = new Map<string, string>();

/**
 * MessageBubble Component
 * 
 * Displays an individual message in the chat with full encryption/decryption support.
 * Handles: message display, editing, deleting, reactions, and replies.
 * 
 * Uses React.memo to prevent unnecessary re-renders when parent components update.
 */
const MessageBubble = React.memo(({ message, conversationData, conversationId, onBroadcastReaction }: MessageBubbleProps) => {
    // ========== State Management ==========

    // Decrypted message content (starts empty, gets filled after decryption)
    const [content, setContent] = useState<string>("");
    const [parentContent, setParentContent] = useState<string>(""); // For quoted/replied messages

    // Current logged-in user data
    const { data: currentUser } = useGetMe();

    // Decryption loading states
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [isDecryptingParent, setIsDecryptingParent] = useState(false);

    // Delete Message Type
    const [deleteMessageType, setDeleteMessageType] = useState<"ALL" | "SELF">("SELF");

    // Get our decrypted private key from the Crypto Context
    // This is cached globally so we don't have to decrypt it for every message!
    const { decryptedPrivateKey } = useCrypto();

    // UI state for interactions
    const [showOptions, setShowOptions] = useState(false); // Show edit/delete menu on hover
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [alowEdit, setAlowEdit] = useState<boolean>(true); // Can only edit within 48 hours

    // ========== React Query Mutations ==========
    const updateMessageMutation = useUpdateMessage();
    const { mutate: deleteMessageMutation, isPending: deleteMessagePending, isError: deleteMessageError, isSuccess: deleteMessageSuccess } = useDeleteMessage();
    const addReactionMutation = useAddReaction();
    const removeReactionMutation = useRemoveReaction();

    // Global state for reply functionality
    const { setReplyingTo } = useChatStore();



    // ========== Error & Success Handling ==========

    // Show feedback when update operations succeed or fail
    useEffect(() => {
        if (updateMessageMutation.error) {
            setError('Failed to update message');
            setIsEditing(false);
        } else if (updateMessageMutation.isSuccess) {
            setSuccessMessage('Message updated successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    }, [updateMessageMutation.error, updateMessageMutation.isSuccess]);

    useEffect(() => {
        if (deleteMessageError) {
            setError('Failed to delete message');
        } else if (deleteMessageSuccess) {
            setSuccessMessage('Message deleted successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    }, [deleteMessageError, deleteMessageSuccess]);

    useEffect(() => {
        if (addReactionMutation.error) {
            setError('Failed to add reaction');
        } else if (addReactionMutation.isSuccess) {
            setSuccessMessage('Reaction added');
            setTimeout(() => setSuccessMessage(null), 2000);
        }
    }, [addReactionMutation.error, addReactionMutation.isSuccess]);

    useEffect(() => {
        if (removeReactionMutation.error) {
            setError('Failed to remove reaction');
        } else if (removeReactionMutation.isSuccess) {
            setSuccessMessage('Reaction removed');
            setTimeout(() => setSuccessMessage(null), 2000);
        }
    }, [removeReactionMutation.error, removeReactionMutation.isSuccess]);

    // ========== Event Handlers ==========

    /**
     * Enter edit mode for this message
     * Pre-fills the edit input with the current decrypted content
     */
    const handleEdit = () => {
        setError(null);
        setIsEditing(true);
        setEditText(content);
    };

    /**
     * Keep edit text in sync with decrypted content
     * This ensures if the message finishes decrypting while we're editing,
     * we get the latest decrypted text
     */
    useEffect(() => {
        if (isEditing) {
            setEditText(content);
        }
    }, [content, isEditing]);

    /**
     * Close emoji picker when user clicks outside of it
     * This provides better UX than requiring a manual close button
     */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showEmojiPicker) {
                const target = event.target as Element;
                if (!target.closest('.emoji-picker-container')) {
                    setShowEmojiPicker(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    const handleCopy = async () => {
        try {
            setError(null);
            await navigator.clipboard.writeText(content);
            setSuccessMessage('Message copied to clipboard');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch {
            setError('Failed to copy message');
        }
    };

    const handleDeleteMessage = (deleteType: "ALL" | "SELF") => {
        setShowDeleteConfirm(true);
        setDeleteMessageType(deleteType);
    };

    const confirmDelete = (conversationId: string, messageId: string) => {
        setError(null);
        console.log(deleteMessageType);
        deleteMessageMutation({ conversationId, messageId, deleteType: deleteMessageType });
        setShowDeleteConfirm(false);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const handleReact = () => {
        setShowEmojiPicker(true);
    };

    /**
     * Handle emoji reaction selection
     * 
     * Toggle behavior: if you already reacted with this emoji, we remove it.
     * Otherwise, we add it. This creates a nice "like/unlike" experience.
     */
    const handleEmojiSelect = (emojiData: { emoji: string }) => {
        setError(null);

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions?.find(
            reaction => reaction.userId === currentUser?.id && reaction.emoji === emojiData.emoji
        );

        console.log("Existing reaction", existingReaction);
        if (existingReaction) {
            // User already reacted with this emoji, so remove it (toggle off)
            removeReactionMutation.mutate({
                conversationId,
                messageId: message.id,
                reactionId: existingReaction.id
            }, {
                onSuccess: () => onBroadcastReaction?.()
            });
        } else {
            // Add new reaction (toggle on)
            addReactionMutation.mutate({
                conversationId,
                messageId: message.id,
                emoji: emojiData.emoji
            }, {
                onSuccess: () => onBroadcastReaction?.()
            });
        }

        setShowEmojiPicker(false);
    };

    /**
     * Save edited message
     * 
     * Process:
     * 1. Validate that text actually changed
     * 2. Encrypt the new message text using the other person's public key + our private key
     * 3. Send encrypted message to the server
     * 4. Server will broadcast the update via Supabase realtime
     */
    const handleSaveEdit = async () => {
        // Don't save if nothing changed or input is empty
        if (!editText.trim() || editText === content) {
            setIsEditing(false);
            return;
        }

        // Make sure we have all the keys needed for encryption
        if (!conversationData || !currentUser?.id || !participant) {
            setError('Unable to encrypt message');
            return;
        }

        setError(null);

        try {
            // Encrypt the updated message with the participant's public key
            const { ciphertext, nonce } = await encryptMessage(editText.trim(), participant.publicKey, decryptedPrivateKey!);

            // Send the encrypted message to the server
            updateMessageMutation.mutate({
                conversationId,
                messageId: message.id,
                content: ciphertext,
                nonce
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Error encrypting message:', error);
            setError('Failed to encrypt message');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditText('');
        setError(null);
    };

    const handleReply = () => {
        setReplyingTo(message);
    };



    // ========== Memoized Values ==========

    /**
     * Find the other person in this conversation
     * 
     * In a 1-on-1 chat, we need their public key for decryption.
     * We memoize this to avoid recalculating on every render.
     */
    const participant = useMemo(() => {
        if (!conversationData || !currentUser?.id) return null;
        return conversationData.participants.find(p => p.user.id !== currentUser.id)?.user;
    }, [conversationData, currentUser?.id]);

    /**
     * Handle parent message (for replies/quotes)
     * 
     * Supabase sometimes returns this as an object, sometimes as a single-element array.
     * We normalize it here to always work with a single object.
     */
    const parentMsg = useMemo(() => {
        if (!message.parentMessage) return null;
        return Array.isArray(message.parentMessage) ? message.parentMessage[0] : message.parentMessage;
    }, [message.parentMessage]);

    /**
     * Create a unique cache key for this specific message
     * 
     * If any of these values change, we need to re-decrypt.
     * This prevents unnecessary decryption when other parts of the component update.
     */
    const cacheKey = useMemo(() =>
        `${message.id}-${message.content}-${message.nonce}`,
        [message.id, message.content, message.nonce]
    );

    // ========== Main Message Decryption ==========

    /**
     * Decrypt the message content
     * 
     * This runs whenever the message, user data, or keys change.
     * Uses NaCl box encryption with this formula:
     *   - Your private key (from Crypto Context)
     *   - Other person's public key (from participant)
     * 
     * Performance optimization: checks cache first to avoid re-decrypting.
     */
    useEffect(() => {
        let cancelled = false; // Prevents state updates after unmount

        // Image-only messages don't have encrypted text content
        const isImageOnly = message.type === 'IMAGE' && (!message.content || message.content.trim() === '');

        if (isImageOnly) {
            setContent('');
            setIsDecrypting(false);
            return;
        }

        // Validate we have all the data needed for decryption
        if (!conversationData || !currentUser?.id || !message?.sender?.id || !participant) {
            setContent('[Unable to decrypt message]');
            setIsDecrypting(false);
            return;
        }

        // Some messages might not have content (e.g., system messages)
        if (!message.content || message.content.trim() === '') {
            setContent('');
            setIsDecrypting(false);
            return;
        }

        // Check if we've already decrypted this exact message before
        const cached = messageCache.get(cacheKey);
        if (cached) {
            setContent(cached);
            setIsDecrypting(false);
            return;
        }

        /**
         * The actual decryption function
         * 
         * This is async because decryption with NaCl can take a moment.
         * We wrap everything in a cancelled check to prevent state updates
         * if the component unmounts during decryption.
         */
        const decryptMessageContent = async () => {
            try {
                setIsDecrypting(true);
                setContent("");

                const isOwn = message.sender.id === currentUser.id;

                // Wait for the private key to be ready
                // The Crypto Context fetches and decrypts this on app load
                if (!decryptedPrivateKey) {
                    const errorMsg = '[Waiting for key...]';
                    if (!cancelled) {
                        setContent(errorMsg);
                    }
                    return;
                }

                // KEY CONCEPT: In NaCl box encryption, you always decrypt with:
                // - Your private key (decryptedPrivateKey - from our secure storage)
                // - The other person's public key (participant.publicKey - publicly shared)
                // This works for BOTH sent and received messages!
                const publicKey = participant?.publicKey;

                // Validate we have everything needed for decryption
                if (!publicKey || !message.nonce) {
                    const errorMsg = message.type === 'IMAGE' ? '' : '[Message could not be decrypted]';
                    if (!cancelled) {
                        setContent(errorMsg);
                        if (message.nonce) {
                            messageCache.set(cacheKey, errorMsg); // Cache the error to avoid retrying
                        }
                    }
                    return;
                }

                // Finally, decrypt the message!
                // This uses the crypto.ts decryptMessage function which calls NaCl under the hood
                const decrypted = await decryptMessage(message.content, message.nonce, publicKey, decryptedPrivateKey);
                if (!cancelled) {
                    setContent(decrypted);
                    messageCache.set(cacheKey, decrypted); // Cache for future renders
                }
            } catch (error) {
                console.error('Error decrypting message:', error);
                const errorMsg = message.type === 'IMAGE' ? '' : '[Message could not be decrypted]';
                if (!cancelled) {
                    setContent(errorMsg);
                    if (message.nonce) {
                        messageCache.set(cacheKey, errorMsg);
                    }
                }
            } finally {
                // Always clear the loading state when done
                if (!cancelled) setIsDecrypting(false);
            }
        };

        // Start the decryption process
        decryptMessageContent();

        // Cleanup function: mark as cancelled if component unmounts
        // This prevents "Can't perform a React state update on an unmounted component" warnings
        return () => {
            cancelled = true;
        };
    }, [message, currentUser, participant, cacheKey, decryptedPrivateKey, conversationData]);

    // ========== Parent Message Decryption (for Replies/Quotes) ==========

    /**
     * Decrypt the parent/quoted message if this is a reply
     * 
     * Uses the same decryption logic as the main message.
     * We do this separately because parent messages have their own state and cache keys.
     */
    useEffect(() => {
        let cancelled = false;

        // No parent message to decrypt
        if (!parentMsg || !conversationData || !currentUser?.id || !participant) {
            setParentContent('');
            setIsDecryptingParent(false);
            return;
        }

        // Check cache first (avoid re-decrypting the same parent message)
        const parentCacheKey = `${parentMsg.id}-${parentMsg.content}-${parentMsg.nonce}`;
        const cachedParent = messageCache.get(parentCacheKey);
        if (cachedParent) {
            setParentContent(cachedParent);
            setIsDecryptingParent(false);
            return;
        }

        // Handle image-only parent messages
        const isParentImageOnly = (parentMsg.type === 'IMAGE' || parentMsg.media) && (!parentMsg.content || parentMsg.content.trim() === '');
        if (isParentImageOnly) {
            setParentContent('📷 Photo');
            setIsDecryptingParent(false);
            return;
        }

        /**
         * Decrypt parent message content
         * Same logic as main message decryption
         */
        const decryptParentMessage = async () => {
            try {
                setIsDecryptingParent(true);
                setParentContent("");

                const isParentOwn = parentMsg.senderId === currentUser.id;

                // Wait for private key
                if (!decryptedPrivateKey) {
                    const errorMsg = '[Waiting for key...]';
                    if (!cancelled) {
                        setParentContent(errorMsg);
                    }
                    return;
                }

                // Always use participant's public key (same as main message)
                const publicKey = participant?.publicKey;

                // Validate
                if (!publicKey || !parentMsg.nonce) {
                    const errorMsg = '[Parent message could not be decrypted]';
                    if (!cancelled) {
                        setParentContent(errorMsg);
                        messageCache.set(parentCacheKey, errorMsg);
                    }
                    return;
                }

                // Decrypt
                const decrypted = await decryptMessage(parentMsg.content, parentMsg.nonce, publicKey, decryptedPrivateKey);
                if (!cancelled) {
                    setParentContent(decrypted);
                    messageCache.set(parentCacheKey, decrypted);
                }
            } catch (error) {
                console.error('Error decrypting parent message:', error);
                const errorMsg = '[Parent message could not be decrypted]';
                if (!cancelled) {
                    setParentContent(errorMsg);
                    messageCache.set(parentCacheKey, errorMsg);
                }
            } finally {
                if (!cancelled) setIsDecryptingParent(false);
            }
        };

        // Start decrypting the parent message
        decryptParentMessage();

        // Cleanup on unmount
        return () => {
            cancelled = true;
        };
    }, [parentMsg, currentUser, participant, decryptedPrivateKey, conversationData]);

    // ========== UI Components & Helpers ==========

    /**
     * Status Icon Component
     * 
     * Shows the delivery/read status for messages you sent.
     * Only visible on your own messages (not on received messages).
     * 
     * Status progression: sending → sent → delivered → seen
     */
    const StatusIcon = ({ status }: { status?: string }) => {
        if (!message.isOwn) return null;
        // console.log(status)

        // Debug logging
        // if (status) {
        //     console.log(`[StatusIcon] Message ${content}: status="${status}"`);
        // }

        switch (status) {
            case 'sending':
                return <span className="ml-1 text-xs text-muted-foreground">🕒</span>; // Clock emoji while sending
            case 'sent':
                return <span className="ml-1 text-xs text-muted-foreground">✓</span>; // Single check - sent to server
            case 'delivered':
                return <span className="ml-1 text-xs text-muted-foreground">✓✓</span>; // Double check - delivered to recipient
            case 'seen':
                return <span className="ml-1 text-xs text-blue-500">✓✓</span>; // Blue double check - read by recipient
            case 'error':
                return <span className="ml-1 text-xs text-red-500">!</span>; // Red exclamation - failed to send
            default:
                return null;
        }
    };

    /**
     * 48-Hour Edit Window
     * 
     * Messages can only be edited within 48 hours of being sent.
     * This prevents editing very old messages which could be confusing in long conversations.
     * 
     * We recalculate this whenever the message changes (which is rare after initial load).
     */
    useEffect(() => {
        const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

        const now = Date.now();
        const createdTime = new Date(message.createdAt).getTime();
        const timeElapsed = now - createdTime;

        // Allow editing only if less than 48 hours have passed
        setAlowEdit(timeElapsed <= FORTY_EIGHT_HOURS_MS);
    }, [message]);

    // ========== Render ==========

    /**
     * The JSX below renders:
     * 1. Error/success notifications (positioned absolutely)
     * 2. Message options menu (edit, delete, react) - shows on hover
     * 3. The message bubble with:
     *    - Parent/quoted message (if replying)
     *    - Main content (text and/or image)
     *    - Reactions
     *    - Timestamp and status icon
     */

    return (
        <div className={`flex items-center ${message.isOwn ? 'justify-end' : 'justify-start'} mb-2`}
            onMouseEnter={() => setShowOptions(true)}
            onMouseLeave={() => setShowOptions(false)}>

            {/* Error Display */}
            {error && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm z-10 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Success Display */}
            {successMessage && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg text-sm z-10 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <span>{successMessage}</span>
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 cursor-pointer"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}


            <div className={`mr-2 items-end space-x-2 ${showOptions && message.isOwn ? 'flex' : 'hidden'}`}>
                <div className="flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg border">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                                disabled={updateMessageMutation.isPending || deleteMessagePending}
                            >
                                <Ellipsis className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1" align="end">
                            <div className="space-y-1">
                                {/* Reply */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm"
                                    onClick={handleReply}
                                >
                                    <Reply className="w-3 h-3 mr-2" />
                                    Reply
                                </Button>

                                {/* Edit */}
                                {alowEdit && <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm"
                                    onClick={handleEdit}
                                    disabled={updateMessageMutation.isPending}
                                >
                                    {updateMessageMutation.isPending ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                            Editing...
                                        </div>
                                    ) : (
                                        'Edit'
                                    )}
                                </Button>}

                                {/* Copy */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm"
                                    onClick={handleCopy}
                                >
                                    Copy
                                </Button>

                                {/* Delete for me */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteMessage("SELF")}
                                    disabled={deleteMessagePending}
                                >
                                    {deleteMessagePending ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                            Deleting...
                                        </div>
                                    ) : (
                                        'Delete for me'
                                    )}
                                </Button>

                                {/* Delete for All */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteMessage("ALL")}
                                    disabled={deleteMessagePending}
                                >
                                    {deleteMessagePending ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                            Deleting...
                                        </div>
                                    ) : (
                                        'Delete for Everyone'
                                    )}
                                </Button>

                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={handleReact}
                            title={addReactionMutation.isPending ? 'Adding reaction...' : 'Add reaction'}
                        >
                            <Smile className="h-4 w-4" />
                        </Button>
                        {showEmojiPicker && (
                            <div className="absolute bottom-10 right-0 z-50 emoji-picker-container">
                                <EmojiPicker
                                    onEmojiClick={handleEmojiSelect}
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
                </div>
            </div>
            <div
                className={`max-w-[70%] relative rounded-2xl p-3 px-4 ${message.isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-secondary rounded-bl-none'
                    }`}
            >
                {/* Parent Message Display */}
                {parentMsg && (
                    <div className={`mb-2 p-2 rounded-lg border-l-2 ${message.isOwn
                        ? 'bg-white/10 border-white/30'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                        }`}>

                        <div className="flex items-center gap-2 mb-1">
                            <Reply className="w-3 h-3 opacity-70" />
                            <span className="text-xs font-medium opacity-70">
                                {parentMsg?.sender?.fullName || parentMsg?.sender?.username || "Unknown sender"}
                            </span>
                        </div>
                        {parentMsg?.type === 'IMAGE' ? (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <Image className="w-4 h-4 text-primary shrink-0" /> Photo
                            </p>
                        ) : parentMsg?.type === 'TEXT' ? (
                            <div className="text-sm opacity-80">
                                {isDecryptingParent ? (
                                    <div className="flex items-center space-x-1">
                                        <div className="w-1 h-1 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1 h-1 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1 h-1 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                ) : (
                                    <p className="truncate">{parentContent}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm opacity-80">
                                <p className='text-xs opacity-70'>Unknown Type</p>
                            </p>
                        )}

                    </div>
                )}

                {isDecrypting ? (
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                ) : isEditing ? (
                    <div className="flex items-center gap-2 p-2 bg-white/10 dark:bg-black/10 rounded-lg">
                        <input
                            className="flex-1 rounded px-3 py-2 text-sm border border-gray-700 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            disabled={updateMessageMutation.isPending}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                            }}
                            placeholder="Edit message..."
                        />
                        <div className="flex items-center  gap-1">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={updateMessageMutation.isPending}
                                title="Cancel"
                                className="h-8 w-8 p-0 bg-red-500 hover:bg-red-700 cursor-pointer"
                            >
                                <X className='w-4 h-4' />
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={updateMessageMutation.isPending || !editText.trim() || editText === content}
                                title="Save"
                                className="h-8 w-8 p-0 cursor-pointer"
                            >
                                {updateMessageMutation.isPending ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Check className='w-4 h-4' />
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Image Display */}
                        {message.media && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-border/50 max-w-full">
                                <img
                                    src={message.media}
                                    alt="Message attachment"
                                    className="max-w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(message.media, '_blank')}
                                    loading="lazy"
                                />
                            </div>
                        )}
                        {/* Text Content - Show if there's decrypted content */}
                        {content && content.trim() !== '' && (
                            <p className="break-words">{content}</p>
                        )}
                    </>
                )}

                {/* Reactions Display */}
                {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {message.reactions.map((reaction) => (
                            <span
                                key={reaction.id}
                                className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                onClick={() => handleEmojiSelect({ emoji: reaction.emoji })}
                            >
                                {reaction.emoji}
                            </span>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg rounded-lg p-3 text-sm z-20">
                        <p className="text-gray-700 dark:text-gray-300 mb-3">Delete this message?</p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => confirmDelete(conversationId, message.id)}
                                disabled={deleteMessagePending}
                                className="h-8 cursor-pointer"
                            >
                                {deleteMessagePending ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                        Deleting...
                                    </div>
                                ) : (
                                    'Delete'
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelDelete}
                                disabled={deleteMessagePending}
                                className="h-8 text-gray-700 cursor-pointer"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-end mt-1 space-x-1">
                    <span className="text-xs opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <StatusIcon status={message?.status} />
                </div>

            </div>

            {/*EOption for Other messages*/}
            <div className={`ml-2 flex items-end space-x-2 ${showOptions && !message.isOwn ? 'flex' : 'hidden'}`}>
                <div className="flex items-center space-x-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg border">
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={handleReact}
                            title={addReactionMutation.isPending ? 'Adding reaction...' : 'Add reaction'}
                        >
                            <Smile className="h-4 w-4" />
                        </Button>
                        {showEmojiPicker && (
                            <div className="absolute bottom-10 left-0 z-50 emoji-picker-container">
                                <EmojiPicker
                                    onEmojiClick={handleEmojiSelect}
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

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Ellipsis className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-32 p-1" align="start">
                            <div className="space-y-1">

                                {/* Reply */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm"
                                    onClick={handleReply}
                                >
                                    <Reply className="w-3 h-3 mr-2" />
                                    Reply
                                </Button>

                                {/* Copy */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm"
                                    onClick={handleCopy}
                                >
                                    Copy
                                </Button>

                                {/* Delete for me */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteMessage("SELF")}
                                    disabled={deleteMessagePending}
                                >
                                    {deleteMessagePending ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                            Deleting...
                                        </div>
                                    ) : (
                                        'Delete for me'
                                    )}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
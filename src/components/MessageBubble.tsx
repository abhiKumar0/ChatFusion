'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Message } from '@/types/types';
import { useGetMe } from "@/lib/react-query/queries.ts";
import { decryptMessage, decryptPrivateKey } from "@/lib/crypto.ts";
import { useCrypto } from "@/lib/crypto-context.tsx";
import { Ellipsis, Smile, Check, X, Reply } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDeleteMessage, useUpdateMessage, useAddReaction, useRemoveReaction } from '@/lib/react-query/queries';
import { Button } from '@/components/ui/button';
import { encryptMessage } from '@/lib/crypto';
import EmojiPicker from 'emoji-picker-react';
import { useChatStore } from '@/store/useChatStore';

interface MessageBubbleProps {
    message: Message & { isOwn: boolean; status?: string };
    conversationData?: {
        participants: Array<{
            user: {
                id: string;
                email: string;
                fullName: string;
                publicKey: string;
                encryptedPrivateKey: string;
            };
        }>;
    };
    conversationId: string;
    onBroadcastReaction?: () => void;
}

// Cache for decrypted messages to avoid re-decryption
const messageCache = new Map<string, string>();

const MessageBubble = React.memo(({ message, conversationData, conversationId, onBroadcastReaction }: MessageBubbleProps) => {
    const [content, setContent] = useState<string>("");
    const [parentContent, setParentContent] = useState<string>("");
    const { data: currentUser } = useGetMe();
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [isDecryptingParent, setIsDecryptingParent] = useState(false);
    const { decryptedPrivateKey } = useCrypto();
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [alowEdit, setAlowEdit] = useState<boolean>(true);
    const updateMessageMutation = useUpdateMessage();
    const deleteMessageMutation = useDeleteMessage();
    const addReactionMutation = useAddReaction();
    const removeReactionMutation = useRemoveReaction();
    const { setReplyingTo } = useChatStore();

    // Handle operation errors and success
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
        if (deleteMessageMutation.error) {
            setError('Failed to delete message');
        } else if (deleteMessageMutation.isSuccess) {
            setSuccessMessage('Message deleted successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    }, [deleteMessageMutation.error, deleteMessageMutation.isSuccess]);

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

    // Clear error when starting new operations
    const handleEdit = () => {
        setError(null);
        setIsEditing(true);
        setEditText(content);
    };

    // Update edit text when content changes and we're editing
    useEffect(() => {
        if (isEditing) {
            setEditText(content);
        }
    }, [content, isEditing]);

    // Close emoji picker when clicking outside
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

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        setError(null);
        setShowDeleteConfirm(false);
        deleteMessageMutation.mutate({ conversationId, messageId: message.id });
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const handleReact = () => {
        setShowEmojiPicker(true);
    };

    const handleEmojiSelect = (emojiData: { emoji: string }) => {
        setError(null);

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions?.find(
            reaction => reaction.userId === currentUser?.id && reaction.emoji === emojiData.emoji
        );

        console.log("Existing reaction", existingReaction);
        if (existingReaction) {
            // Remove existing reaction
            removeReactionMutation.mutate({
                conversationId,
                messageId: message.id,
                reactionId: existingReaction.id
            }, {
                onSuccess: () => onBroadcastReaction?.()
            });
        } else {
            // Add new reaction
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

    const handleSaveEdit = async () => {
        if (!editText.trim() || editText === content) {
            setIsEditing(false);
            return;
        }

        if (!conversationData || !currentUser?.id || !participant) {
            setError('Unable to encrypt message');
            return;
        }

        setError(null);

        try {
            // Encrypt the updated message
            const { ciphertext, nonce } = await encryptMessage(editText.trim(), participant.publicKey, decryptedPrivateKey!);

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



    // Memoize participant to avoid recalculation
    const participant = useMemo(() => {
        if (!conversationData || !currentUser?.id) return null;
        return conversationData.participants.find(p => p.user.id !== currentUser.id)?.user;
    }, [conversationData, currentUser?.id]);

    // if (message.parentMessageId) console.log(message);
    // Handle both object and single-element array for parentMessage
    const parentMsg = useMemo(() => {
        if (!message.parentMessage) return null;
        return Array.isArray(message.parentMessage) ? message.parentMessage[0] : message.parentMessage;
    }, [message.parentMessage]);

    // Create cache key for this message
    const cacheKey = useMemo(() =>
        `${message.id}-${message.content}-${message.nonce}`,
        [message.id, message.content, message.nonce]
    );

    useEffect(() => {
        let cancelled = false;

        // Skip decryption for image-only messages (type IMAGE with no content)
        const isImageOnly = message.type === 'IMAGE' && (!message.content || message.content.trim() === '');

        if (isImageOnly) {
            setContent('');
            setIsDecrypting(false);
            return;
        }

        if (!conversationData || !currentUser?.id || !message?.sender?.id || !participant) {
            setContent('[Unable to decrypt message]');
            setIsDecrypting(false);
            return;
        }

        // Skip decryption if there's no content to decrypt
        if (!message.content || message.content.trim() === '') {
            setContent('');
            setIsDecrypting(false);
            return;
        }

        // Check cache first
        const cached = messageCache.get(cacheKey);
        if (cached) {
            setContent(cached);
            setIsDecrypting(false);
            return;
        }

        const decryptMessageContent = async () => {
            try {
                setIsDecrypting(true);
                setContent("");

                const isOwn = message.sender.id === currentUser.id;

                // Use cached private key from crypto context when available
                let privateKey;
                if (decryptedPrivateKey && !isOwn) {
                    privateKey = decryptedPrivateKey;
                } else {
                    privateKey = isOwn
                        ? await decryptPrivateKey(participant.encryptedPrivateKey, participant.email)
                        : await decryptPrivateKey(currentUser.encryptedPrivateKey, currentUser.email);
                }

                const publicKey = isOwn ? currentUser?.publicKey : participant?.publicKey;

                // Skip decryption if no nonce (image-only messages don't have nonce)
                if (!publicKey || !message.nonce || !privateKey) {
                    const errorMsg = message.type === 'IMAGE' ? '' : '[Message could not be decrypted]';
                    if (!cancelled) {
                        setContent(errorMsg);
                        if (message.nonce) {
                            messageCache.set(cacheKey, errorMsg);
                        }
                    }
                    return;
                }

                const decrypted = await decryptMessage(message.content, message.nonce, publicKey, privateKey);
                if (!cancelled) {
                    setContent(decrypted);
                    messageCache.set(cacheKey, decrypted);
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
                if (!cancelled) setIsDecrypting(false);
            }
        };

        decryptMessageContent();

        return () => {
            cancelled = true;
        };
    }, [message, currentUser, participant, cacheKey, decryptedPrivateKey, conversationData]);

    // Decrypt parent message if it exists
    useEffect(() => {
        let cancelled = false;

        if (!parentMsg || !conversationData || !currentUser?.id || !participant) {
            setParentContent('');
            setIsDecryptingParent(false);
            return;
        }

        // Debug logging for parentMessage
        // console.log('Parent message debug:', {
        //     parentMessage: parentMsg,
        //     sender: parentMsg?.sender,
        //     senderId: parentMsg?.senderId
        // });

        const parentCacheKey = `${parentMsg.id}-${parentMsg.content}-${parentMsg.nonce}`;
        const cachedParent = messageCache.get(parentCacheKey);
        if (cachedParent) {
            setParentContent(cachedParent);
            setIsDecryptingParent(false);
            return;
        }

        // Check for image-only parent message
        const isParentImageOnly = (parentMsg.type === 'IMAGE' || parentMsg.media) && (!parentMsg.content || parentMsg.content.trim() === '');
        if (isParentImageOnly) {
            setParentContent('📷 Photo');
            setIsDecryptingParent(false);
            return;
        }

        const decryptParentMessage = async () => {
            try {
                setIsDecryptingParent(true);
                setParentContent("");

                const isParentOwn = parentMsg.senderId === currentUser.id;
                let privateKey;
                if (decryptedPrivateKey && !isParentOwn) {
                    privateKey = decryptedPrivateKey;
                } else {
                    privateKey = isParentOwn
                        ? await decryptPrivateKey(participant.encryptedPrivateKey, participant.email)
                        : await decryptPrivateKey(currentUser.encryptedPrivateKey, currentUser.email);
                }

                const publicKey = isParentOwn ? currentUser?.publicKey : participant?.publicKey;

                if (!publicKey || !parentMsg.nonce || !privateKey) {
                    const errorMsg = '[Parent message could not be decrypted]';
                    if (!cancelled) {
                        setParentContent(errorMsg);
                        messageCache.set(parentCacheKey, errorMsg);
                    }
                    return;
                }

                const decrypted = await decryptMessage(parentMsg.content, parentMsg.nonce, publicKey, privateKey);
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

        decryptParentMessage();

        return () => {
            cancelled = true;
        };
    }, [parentMsg, currentUser, participant, decryptedPrivateKey, conversationData]);

    // Status icon component
    const StatusIcon = ({ status }: { status?: string }) => {
        if (!status || !message.isOwn) return null;

        switch (status) {
            case 'sending':
                return <span className="ml-1 text-xs text-muted-foreground">🕒</span>;
            case 'sent':
                return <span className="ml-1 text-xs text-muted-foreground">✓</span>;
            case 'delivered':
                return <span className="ml-1 text-xs text-muted-foreground">✓✓</span>;
            case 'seen':
                return <span className="ml-1 text-xs text-blue-500">✓✓</span>;
            case 'error':
                return <span className="ml-1 text-xs text-red-500">!</span>;
            default:
                return null;
        }
    };

    //Allow edit
    useEffect(() => {
        // 1. Define the 48-hour window in milliseconds (The limit)
        // 48 hours * 60 min * 60 sec * 1000 ms = 172,800,000 ms
        const FORTY_EIGHT_HOURS_MS = 172800000;

        // 2. Get the current time and the creation time
        const now = Date.now(); // Current timestamp in ms
        const createdTime = new Date(message.createdAt).getTime(); // Message timestamp in ms

        // 3. Calculate the difference
        const timeElapsed = now - createdTime;

        // 4. Set permission based on the comparison
        if (timeElapsed > FORTY_EIGHT_HOURS_MS) {
            // If the elapsed time is greater than 48 hours, editing is disabled.
            setAlowEdit(false);
        } else {
            // If the elapsed time is less than 48 hours, editing is allowed.
            setAlowEdit(true);
        }
    }, [message, setAlowEdit]);



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
                                disabled={updateMessageMutation.isPending || deleteMessageMutation.isPending}
                            >
                                <Ellipsis className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-32 p-1" align="end">
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm"
                                    onClick={handleReply}
                                >
                                    <Reply className="w-3 h-3 mr-2" />
                                    Reply
                                </Button>
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
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm"
                                    onClick={handleCopy}
                                >
                                    Copy
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={handleDelete}
                                    disabled={deleteMessageMutation.isPending}
                                >
                                    {deleteMessageMutation.isPending ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                            Deleting...
                                        </div>
                                    ) : (
                                        'Delete'
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
                {message.parentMessageId && (



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
                                onClick={confirmDelete}
                                disabled={deleteMessageMutation.isPending}
                                className="h-8 cursor-pointer"
                            >
                                {deleteMessageMutation.isPending ? (
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
                                disabled={deleteMessageMutation.isPending}
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

            {/*Emoji picker*/}
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
                        <PopoverContent className="w-24 p-1" align="start">
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm"
                                    onClick={handleReply}
                                >
                                    <Reply className="w-3 h-3 mr-2" />
                                    Reply
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-sm"
                                    onClick={handleCopy}
                                >
                                    Copy
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


// now i want users to reply to a message, soo be a professional experienced senior SDE and implement a features where a user can reply to a message, after clicking on 3 dots there should be a reply option when clicked on that, about input it shpuld that youre replying to that with a cross icon for cancelling, after sending that new message shhould ne associated the repliedTo messages and also ui for that message should be different as well
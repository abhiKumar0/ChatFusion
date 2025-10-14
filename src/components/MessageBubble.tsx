import React, {useEffect, useState, useMemo} from 'react';
import { Message } from '@/types/types';
import {useGetMe} from "@/lib/react-query/queries.ts";
import {decryptMessage, decryptPrivateKey} from "@/lib/crypto.ts";
import {useCrypto} from "@/lib/crypto-context.tsx";

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
}

// Cache for decrypted messages to avoid re-decryption
const messageCache = new Map<string, string>();

const MessageBubble = React.memo(({ message, conversationData }: MessageBubbleProps) => {
    const [content, setContent] = useState<string>("");
    const { data: currentUser }= useGetMe();
    const [isDecrypting, setIsDecrypting] = useState(false);
    const { decryptedPrivateKey } = useCrypto();

    // Memoize participant to avoid recalculation
    const participant = useMemo(() => {
        if (!conversationData || !currentUser?.id) return null;
        return conversationData.participants.find(p => p.user.id !== currentUser.id)?.user;
    }, [conversationData, currentUser?.id]);

    // Create cache key for this message
    const cacheKey = useMemo(() => 
        `${message.id}-${message.content}-${message.nonce}`,
        [message.id, message.content, message.nonce]
    );

    useEffect(() => {
        let cancelled = false;

        if (!conversationData || !currentUser?.id || !message?.sender?.id || !participant) {
            setContent('[Unable to decrypt message]');
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

                if (!publicKey || !message.nonce || !privateKey) {
                    const errorMsg = '[Message could not be decrypted]';
                    if (!cancelled) {
                        setContent(errorMsg);
                        messageCache.set(cacheKey, errorMsg);
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
                const errorMsg = '[Message could not be decrypted]';
                if (!cancelled) {
                    setContent(errorMsg);
                    messageCache.set(cacheKey, errorMsg);
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

    return (
        <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
            <div
                className={`max-w-[70%] relative rounded-2xl p-3 px-4 ${
                    message.isOwn 
                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                        : 'bg-secondary rounded-bl-none'
                }`}
            >
                {isDecrypting ? (
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-current opacity-70 animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 rounded-full bg-current opacity-70 animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 rounded-full bg-current opacity-70 animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                ) : (
                    <p className="break-words">{content}</p>
                )}

                <div className="flex items-center justify-end mt-1 space-x-1">
                    <span className="text-xs opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <StatusIcon status={message?.status} />
                </div>
            </div>
        </div>
    );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;

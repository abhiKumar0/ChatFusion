import React, {useEffect, useState} from 'react';
import { Message } from '@/types/types';
import {useGetConversationById, useGetMe} from "@/lib/react-query/queries.ts";
import {decryptMessage, decryptPrivateKey} from "@/lib/crypto.ts";
import {useChatStore} from "@/store/useChatStore.ts";

interface MessageBubbleProps {
  message: Message & { isOwn: boolean };
}

const MessageBubble = React.memo(({ message }: MessageBubbleProps) => {
    const [content, setContent] = useState<string>("");
    const { data: currentUser }= useGetMe();
    const {currentConversation} = useChatStore();
    const {data:conversationData} = useGetConversationById(currentConversation || "");
    const [isDecrypting, setIsDecrypting] = useState(true);

    useEffect(() => {
        let cancelled = false;

        if (!conversationData || !currentUser?.id || !message?.sender?.id) {
            // nothing to do yet; wait for data
            setIsDecrypting(false);
            return;
        }

        const decryptMessageContent = async () => {
            try {
                setIsDecrypting(true);
                setContent(""); // clear previous content while decrypting

                const isOwn = message.sender.id === currentUser.id;
                const participant = conversationData.participants.find((p: any) => p.user.id !== currentUser.id)?.user;

                if (!participant) {
                    if (!cancelled) setContent('[Message could not be decrypted]');
                    return;
                }

                // await decryption of private keys
                const privateKey = isOwn
                    ? await decryptPrivateKey(participant.encryptedPrivateKey, participant.email)
                    : await decryptPrivateKey(currentUser.encryptedPrivateKey, currentUser.email);

                const publicKey = isOwn ? currentUser?.publicKey : participant?.publicKey;

                // if any required material is missing, show error
                if (!publicKey || !message.nonce || !privateKey) {
                    if (!cancelled) setContent('[Message could not be decrypted]');
                    return;
                }

                const decrypted = await decryptMessage(message.content, message.nonce, publicKey, privateKey);
                if (!cancelled) setContent(decrypted);
            } catch (error) {
                console.error('Error decrypting message:', error);
                if (!cancelled) setContent('[Message could not be decrypted]');
            } finally {
                if (!cancelled) setIsDecrypting(false);
            }
        };

        decryptMessageContent();

        return () => {
            cancelled = true;
        };
    }, [message, currentUser, conversationData]);

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

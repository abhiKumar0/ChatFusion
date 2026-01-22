'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { Button } from './ui/button'
import { PlusCircle, Search, AlertCircle, MessageSquare, Clock, Plus, Mail, UserPlus } from 'lucide-react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { useChatStore } from '@/store/useChatStore';
import { useGetConversations, useGetMe, useSendInvite } from '@/lib/react-query/queries';
import { createClient } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { ConversationSkeleton } from './Loading';
import { ComponentErrorBoundary } from './ErrorBoundary';
import { useRouter } from 'next/navigation';
import { usePresenceStore } from '@/store/usePresenceStore';
import { useCrypto } from '@/lib/crypto-context';
import { decryptMessage } from '@/lib/crypto';


interface ConversationItemProps {
  conversation: {
    id: string;
    lastMessage?: string;
    lastMessageData?: {
      senderId: string;
      status: string;
      content: string;
      type: string;
      nonce?: string;
    };
    unreadCount?: number;
    allParticipants?: Array<{
      user: {
        id: string;
        publicKey: string;
        fullName: string;
      };
    }>;
  };
  contact: {
    id: string;
    fullName?: string;
    username?: string;
    avatar?: string;
    status?: string;
  };
  isSelected: boolean;
  onClick: () => void;
  currentUserId?: string;
  decryptedPrivateKey?: string;
}

const ConversationItem = React.memo(({ conversation, contact, isSelected, onClick, currentUserId, decryptedPrivateKey }: ConversationItemProps) => {
  const lastMsg = conversation.lastMessageData;
  const isOwnLastMsg = lastMsg?.senderId === currentUserId;
  const [decryptedContent, setDecryptedContent] = useState<string>('');

  // Decrypt last message for preview
  useEffect(() => {
    const decrypt = async () => {
      if (!lastMsg?.content || !lastMsg?.nonce || !decryptedPrivateKey) {
        return;
      }

      const otherParticipant = conversation.allParticipants?.find(p => p.user.id !== currentUserId);
      if (!otherParticipant?.user?.publicKey) {
        return;
      }

      try {
        const decrypted = await decryptMessage(
          lastMsg.content,
          lastMsg.nonce,
          otherParticipant.user.publicKey,
          decryptedPrivateKey
        );
        setDecryptedContent(decrypted);
      } catch (error) {
        console.error('Failed to decrypt last message:', error);
        setDecryptedContent('Message');
      }
    };

    decrypt();
  }, [lastMsg?.content, lastMsg?.nonce, decryptedPrivateKey, currentUserId, conversation.allParticipants]);

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'sent': return <span className="ml-1 text-xs text-muted-foreground">✓</span>;
      case 'delivered': return <span className="ml-1 text-xs text-muted-foreground">✓✓</span>;
      case 'seen': return <span className="ml-1 text-xs text-blue-500">✓✓</span>;
      default: return null;
    }
  };

  return (
    <div
      className={`mx-2 my-1 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${isSelected
        ? 'bg-violet-500/10 border border-violet-500/30'
        : 'hover:bg-white/[0.03] border border-transparent'
        }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="h-11 w-11 border border-white/10">
            <AvatarImage src={contact?.avatar} />
            <AvatarFallback className="bg-violet-500/20 text-violet-400 font-medium text-sm">
              {contact?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f0f11] transition-all ${contact?.status === 'online' ? 'bg-green-500' :
              contact?.status === 'away' ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-medium text-sm text-white truncate">{contact?.fullName || 'Unknown User'}</h3>
            {(conversation?.unreadCount ?? 0) > 0 && (
              <span className="h-5 min-w-5 flex items-center justify-center px-1.5 rounded-full bg-violet-500 text-white text-xs font-medium">
                {(conversation?.unreadCount ?? 0) > 99 ? '99+' : (conversation?.unreadCount ?? 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {conversation?.unreadCount && conversation.unreadCount > 0 ? (
              <p className="text-xs font-medium text-violet-400 truncate">
                New message
              </p>
            ) : conversation.lastMessageData ? (
              <p className="text-xs text-gray-500 truncate flex-1">
                {isOwnLastMsg && lastMsg?.status && <StatusIcon status={lastMsg.status} />}
                {lastMsg?.type === 'IMAGE' && !decryptedContent ? '📷 Photo' : decryptedContent || 'Message...'}
              </p>
            ) : (
              <p className="text-xs text-gray-600 italic">No messages yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

interface ContactListProps {
  onContactSelect?: () => void;
  selectedConversationId?: string | null;
}

const ContactList = ({ onContactSelect, selectedConversationId }: ContactListProps) => {

  const [searchTerm, setSearchTerm] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: conversations, isLoading, error } = useGetConversations();
  const { setCurrentConversation, setCurrentParticipant } = useChatStore();
  const { data: user } = useGetMe();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const { decryptedPrivateKey } = useCrypto(); // Get decrypted private key

  const { mutateAsync: sendInvite, isPending: isInviting } = useSendInvite();

  // Handle invite friend
  const handleInviteFriend = async () => {
    if (!inviteEmail.trim()) return;

    try {
      await sendInvite(inviteEmail.trim());

      setInviteEmail('');
      setInviteDialogOpen(false);
      alert(`Invite sent to ${inviteEmail}!`);
    } catch (error: any) {
      console.error('Failed to send invite:', error);
      alert(error.message || 'Failed to send invite. Please try again.');
    }
  };

  // Listen for new messages to update conversation list
  React.useEffect(() => {
    const channel = supabase.channel('conversations_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Message' }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  const { onlineUsers } = usePresenceStore();

  // Process and filter conversations
  const processedConversations = useMemo(() => {
    if (!conversations || !user) return [];

    return conversations.map((convo: any) => {
      const contactData = convo.allParticipants.find((participant: any) => participant.user.id !== user.id)?.user;
      const contact = contactData ? { ...contactData, status: onlineUsers.has(contactData.id) ? 'online' : 'offline' } : null;
      return { ...convo, contact };
    }).filter((convo: any) => convo.contact); // Filter out conversations without valid contacts
  }, [conversations, user, onlineUsers]);


  // Filter conversations based on search term
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return processedConversations;

    const searchLower = searchTerm.toLowerCase();
    return processedConversations.filter((convo: any) =>
      convo.contact.fullName?.toLowerCase().includes(searchLower) ||
      convo.contact.username?.toLowerCase().includes(searchLower)
    );
  }, [processedConversations, searchTerm]);

  // Handle conversation selection
  const router = useRouter();

  const handleConversationClick = useCallback((convo: { id: string; contact: any }) => {
    // setCurrentConversation(convo.id);
    // setCurrentParticipant(convo.contact);
    router.push(`/chat/${convo.id}`);
    if (onContactSelect) {
      onContactSelect();
    }
  }, [router, onContactSelect]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col bg-[#0f0f11]">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Messages</h2>
          </div>
        </div>
        <ConversationSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full  border-r border-border flex flex-col bg-background">
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Messages</h2>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Failed to load conversations</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">{error.message}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="active:scale-95 transition-transform duration-150"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ComponentErrorBoundary>
        <div className="w-full flex flex-col bg-[#0f0f11] h-full">
          <div className="p-4 border-b border-white/5 sticky top-0 z-10 bg-[#0f0f11]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Messages</h2>
                {filteredConversations.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400">
                    {filteredConversations.length}
                  </span>
                )}
              </div>

              <button
                className="h-9 w-9 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 flex items-center justify-center transition-colors"
                onClick={() => setInviteDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                placeholder="Search..."
                className="pl-10 h-10 bg-white/5 border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((convo: any) => (
                <ConversationItem
                  key={convo.id}
                  conversation={convo}
                  contact={convo.contact}
                  isSelected={selectedConversationId === convo.id}
                  onClick={() => handleConversationClick(convo)}
                  currentUserId={user?.id}
                  decryptedPrivateKey={decryptedPrivateKey ?? undefined}
                />
              ))
            ) : searchTerm ? (
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="font-medium text-white mb-1">No results</h3>
                <p className="text-sm text-gray-500">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-7 h-7 text-violet-400" />
                </div>
                <h3 className="font-medium text-white mb-1">No conversations</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start chatting with your friends
                </p>
                <button
                  className="h-9 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors flex items-center gap-2"
                  onClick={() => setInviteDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Invite friend
                </button>
              </div>
            )}
          </div>
        </div>
      </ComponentErrorBoundary>

      {/* Invite Friend Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f11] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <UserPlus className="h-5 w-5 text-violet-400" />
              Invite a Friend
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter your friend's email address to send them an invitation to join ChatFusion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500/50"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isInviting && handleInviteFriend()}
                  disabled={isInviting}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setInviteDialogOpen(false)}
              disabled={isInviting}
              className="h-10 px-4 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInviteFriend}
              disabled={!inviteEmail.trim() || isInviting}
              className="h-10 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center"
            >
              {isInviting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ContactList
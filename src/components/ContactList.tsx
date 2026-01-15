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
    <Card
      className={`mx-2 my-1.5 rounded-xl border-border cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${isSelected
        ? 'bg-primary/10 border-primary shadow-sm'
        : 'hover:border-primary/50 hover:bg-accent/50'
        }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick()}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 border-2 border-border">
              <AvatarImage src={contact?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {contact?.fullName?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background transition-all ${contact?.status === 'online' ? 'bg-green-500 animate-pulse' :
                contact?.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{contact?.fullName || 'Unknown User'}</h3>
                <p className="text-xs text-muted-foreground truncate">@{contact?.username || 'user'}</p>
              </div>
              {(conversation?.unreadCount ?? 0) > 0 && (
                <Badge
                  variant="default"
                  className="rounded-full h-5 min-w-5 flex items-center justify-center px-1.5 bg-primary text-primary-foreground font-semibold animate-pulse"
                >
                  {(conversation?.unreadCount ?? 0) > 99 ? '99+' : (conversation?.unreadCount ?? 0)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {conversation?.unreadCount && conversation.unreadCount > 0 ? (
                <p className="text-xs font-bold text-primary truncate flex-1">
                  New Message
                </p>
              ) : conversation.lastMessageData ? (
                <>
                  {isOwnLastMsg && lastMsg?.status && <StatusIcon status={lastMsg.status} />}
                  <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground truncate flex-1">
                    {lastMsg?.type === 'IMAGE' && !decryptedContent ? '📷 Photo' : decryptedContent || 'Message...'}
                  </p>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground italic">No messages yet</p>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
      <div className="w-full border-r border-border flex flex-col bg-background">
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Messages</h2>
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
        <div className="w-full border-r border-border flex flex-col bg-background h-full">
          <div className="p-4 border-b border-border bg-card sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Messages</h2>
                {filteredConversations.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filteredConversations.length}
                  </Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="active:scale-95 transition-transform duration-150"
                onClick={() => setInviteDialogOpen(true)}
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                className="pl-10 bg-secondary border-border focus:border-primary transition-colors"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
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
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No conversations found</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Try a different search term or start a new conversation
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  Start a new conversation to get chatting with your friends
                </p>
                <Button
                  size="sm"
                  className="active:scale-95 transition-transform duration-150 hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>
            )}
          </div>
        </div>
      </ComponentErrorBoundary>

      {/* Invite Friend Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Invite a Friend
            </DialogTitle>
            <DialogDescription>
              Enter your friend's email address to send them an invitation to join ChatFusion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  className="pl-10"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isInviting && handleInviteFriend()}
                  disabled={isInviting}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleInviteFriend}
              disabled={!inviteEmail.trim() || isInviting}
              className="active:scale-95 transition-transform duration-150"
            >
              {isInviting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ContactList
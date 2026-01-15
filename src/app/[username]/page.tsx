'use client';

import React, { useState } from 'react';
import { useGetUserByUsername, useCreateConversation, useGetUserFriends, useSendFriendRequest, useCancelFriendRequest, useGetMe } from '@/lib/react-query/queries';
import { usePresenceStore } from '@/store/usePresenceStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, MessageSquare, ArrowLeft, Users, Search, UserPlus, UserMinus, UserCheck, UserX } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { User } from '@/types/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UserProfilePage = () => {
    const params = useParams();
    const router = useRouter();
    const username = params?.username as string;

    const { data: currentUser } = useGetMe();
    const { data: user, isLoading, error } = useGetUserByUsername(username);
    const { data: friends, isLoading: friendsLoading } = useGetUserFriends(user?.id || '');
    const { mutateAsync: createConvoMutate } = useCreateConversation();
    const sendRequestMutation = useSendFriendRequest();

    const cancelRequestMutation = useCancelFriendRequest();
    const { onlineUsers } = usePresenceStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [isUnfriendOpen, setIsUnfriendOpen] = useState(false);

    const handleMessage = async () => {
        if (!user) return;
        try {
            const conversation = await createConvoMutate({
                recipientId: user.id
            });
            if (conversation && conversation.id) {
                router.push(`/chat/${conversation.id}`);
            } else if (conversation && conversation.conversation && conversation.conversation.id) {
                router.push(`/chat/${conversation.conversation.id}`);
            }
        } catch (e) {
            console.error("Failed to message", e);
        }
    };

    const handleAddFriend = () => {
        if (user) {
            sendRequestMutation.mutate(user.id);
        }
    };

    const handleUnfriend = () => {
        if (user) {
            cancelRequestMutation.mutate(
                { targetUserId: user.id },
                {
                    onSuccess: () => {
                        setIsUnfriendOpen(false);
                    }
                }
            );
        }
    };

    const handleCancelRequest = () => {
        if (user) {
            cancelRequestMutation.mutate({ targetUserId: user.id });
        }
    };

    const handleFriendClick = (friend: User) => {
        router.push(`/${friend.username}`);
    };

    const handleSendFriendRequest = (friendId: string) => {
        sendRequestMutation.mutate(friendId);
    };

    const filteredFriends = friends?.filter((friend: User) =>
        friend.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground animate-pulse">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 text-center bg-gradient-to-br from-background via-background to-destructive/5 p-6">
                <div className="space-y-4 max-w-md">
                    <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                        <UserX className="w-10 h-10 text-destructive" />
                    </div>
                    <h1 className="text-3xl font-bold">User not found</h1>
                    <p className="text-muted-foreground text-lg">The user @{username} does not exist or could not be loaded.</p>
                    <Button onClick={() => router.back()} variant="outline" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const isSelf = user.friendshipStatus === 'SELF';

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Back Button */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
                <div className="container mx-auto max-w-6xl px-4 py-3">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="gap-2 hover:bg-primary/10 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl p-4 md:p-8 space-y-6 animate-in fade-in duration-700">
                {/* Profile Header Card */}
                <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl relative">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-gradient-x opacity-50"></div>

                    {/* Cover Image */}
                    <div className="h-40 md:h-48 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                    </div>

                    <CardContent className="relative pt-0 pb-8 px-6 md:px-10">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                                <Avatar className="relative h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-2xl ring-4 ring-primary/20">
                                    <AvatarImage src={user.avatar} className="object-cover" />
                                    <AvatarFallback className="text-5xl bg-gradient-to-br from-primary/20 to-primary/5">
                                        {user.fullName?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-background shadow-lg ${onlineUsers.has(user.id) ? 'bg-green-500' :
                                    user.status?.toLowerCase() === 'away' ? 'bg-yellow-500' :
                                        'bg-gray-400'
                                    } ${onlineUsers.has(user.id) ? 'animate-pulse' : ''}`} />
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-left space-y-3 mb-2">
                                <div className="space-y-1">
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                        {user.fullName}
                                    </h1>
                                    <p className="text-lg text-muted-foreground font-medium">@{user.username}</p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                                    <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                                        <Mail className="w-3.5 h-3.5" />
                                        {user.email}
                                    </Badge>
                                    {friends && (
                                        <Badge variant="outline" className="gap-1.5 px-3 py-1 border-primary/30 text-primary">
                                            <Users className="w-3.5 h-3.5" />
                                            {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                                {!isSelf && (
                                    <>
                                        {user.friendshipStatus === 'FRIEND' && (
                                            <>
                                                <Button
                                                    onClick={handleMessage}
                                                    className="gap-2 shadow-lg hover:shadow-xl transition-all"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    Message
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsUnfriendOpen(true)}
                                                    className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                    Unfriend
                                                </Button>
                                            </>
                                        )}

                                        {user.friendshipStatus === 'NONE' && (
                                            <Button
                                                onClick={handleAddFriend}
                                                disabled={sendRequestMutation.isPending}
                                                className="gap-2 shadow-lg hover:shadow-xl transition-all"
                                            >
                                                {sendRequestMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <UserPlus className="w-4 h-4" />
                                                )}
                                                Add Friend
                                            </Button>
                                        )}

                                        {user.friendshipStatus === 'REQUEST_SENT' && (
                                            <Button
                                                variant="secondary"
                                                onClick={handleCancelRequest}
                                                disabled={cancelRequestMutation.isPending}
                                                className="gap-2"
                                            >
                                                {cancelRequestMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <UserX className="w-4 h-4" />
                                                )}
                                                Cancel Request
                                            </Button>
                                        )}

                                        {user.friendshipStatus === 'REQUEST_RECEIVED' && (
                                            <Button variant="outline" disabled className="gap-2">
                                                <UserCheck className="w-4 h-4" />
                                                Request Received
                                            </Button>
                                        )}
                                    </>
                                )}

                                {isSelf && (
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push('/profile')}
                                        className="gap-2 shadow-lg"
                                    >
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Bio Section */}
                        {user.bio && (
                            <div className="mt-8 p-5 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 backdrop-blur-sm">
                                <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                                    About
                                </h3>
                                <p className="text-base leading-relaxed text-foreground/90">{user.bio}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Friends Section */}
                <Card className="border-none shadow-xl bg-card/95 backdrop-blur-xl">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                                    <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                                    Friends
                                    {friends && (
                                        <Badge variant="secondary" className="text-base px-3 py-1">
                                            {friends.length}
                                        </Badge>
                                    )}
                                </h2>
                                <p className="text-muted-foreground ml-4">
                                    {isSelf ? 'Your connections' : `${user.fullName}'s connections`}
                                </p>
                            </div>

                            {friends && friends.length > 0 && (
                                <div className="relative w-full sm:w-80">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search friends..."
                                        className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {friendsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-xl"></div>
                                ))}
                            </div>
                        ) : filteredFriends && filteredFriends.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredFriends.map((friend: User) => {
                                    const isFriendOfCurrentUser = friend.friendshipStatus === 'FRIEND';
                                    const hasRequestSent = friend.friendshipStatus === 'REQUEST_SENT';
                                    const canSendRequest = friend.friendshipStatus === 'NONE' && !isSelf;

                                    return (
                                        <Card
                                            key={friend.id}
                                            className="group hover:shadow-lg transition-all duration-300 border-muted-foreground/10 hover:border-primary/30 cursor-pointer overflow-hidden relative"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <CardContent className="p-4 relative">
                                                <div
                                                    className="flex items-center gap-3 mb-3"
                                                    onClick={() => handleFriendClick(friend)}
                                                >
                                                    <div className="relative">
                                                        <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                                            <AvatarImage src={friend.avatar} />
                                                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5">
                                                                {friend.fullName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span
                                                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${onlineUsers.has(friend.id) ? 'bg-green-500' :
                                                                friend.status?.toLowerCase() === 'away' ? 'bg-yellow-500' :
                                                                    'bg-gray-400'
                                                                }`}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                                                            {friend.fullName}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            @{friend.username}
                                                        </p>
                                                    </div>
                                                </div>

                                                {canSendRequest && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full gap-2 hover:bg-primary/10 hover:border-primary/50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSendFriendRequest(friend.id);
                                                        }}
                                                        disabled={sendRequestMutation.isPending}
                                                    >
                                                        {sendRequestMutation.isPending ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <UserPlus className="w-3.5 h-3.5" />
                                                        )}
                                                        Add Friend
                                                    </Button>
                                                )}

                                                {hasRequestSent && (
                                                    <Badge variant="secondary" className="w-full justify-center">
                                                        <UserCheck className="w-3 h-3 mr-1" />
                                                        Request Sent
                                                    </Badge>
                                                )}

                                                {isFriendOfCurrentUser && (
                                                    <Badge variant="outline" className="w-full justify-center border-primary/30 text-primary">
                                                        <UserCheck className="w-3 h-3 mr-1" />
                                                        Friend
                                                    </Badge>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : friends && friends.length === 0 ? (
                            <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl border border-dashed border-border/50">
                                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8 text-muted-foreground opacity-50" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">No friends yet</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    {isSelf ? "Connect with other users to see them here." : `${user.fullName} hasn't added any friends yet.`}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl">
                                <Search className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-4" />
                                <h3 className="font-semibold text-lg mb-2">No results found</h3>
                                <p className="text-sm text-muted-foreground">
                                    Try adjusting your search terms.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Unfriend Confirmation Dialog */}
            <AlertDialog open={isUnfriendOpen} onOpenChange={setIsUnfriendOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unfriend {user.fullName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove {user.fullName} from your friends list?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleUnfriend}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Yes, Unfriend
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default UserProfilePage;

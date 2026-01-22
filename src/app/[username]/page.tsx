'use client';

import React, { useState } from 'react';
import { useGetUserByUsername, useCreateConversation, useGetUserFriends, useSendFriendRequest, useCancelFriendRequest, useGetMe } from '@/lib/react-query/queries';
import { usePresenceStore } from '@/store/usePresenceStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
            <div className="flex h-screen items-center justify-center bg-[#0a0a0b]">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-500 mx-auto" />
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 text-center bg-[#0a0a0b] p-6">
                <div className="space-y-4 max-w-md">
                    <div className="w-16 h-16 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto">
                        <UserX className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">User not found</h1>
                    <p className="text-gray-500">The user @{username} does not exist or could not be loaded.</p>
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 h-10 px-4 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const isSelf = user.friendshipStatus === 'SELF';

    return (
        <div className="min-h-screen bg-[#0a0a0b]">
            {/* Back Button */}
            <div className="sticky top-0 z-10 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto max-w-5xl px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 h-9 px-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>
            </div>

            <div className="container mx-auto max-w-5xl p-4 md:p-8 space-y-6">
                {/* Profile Header */}
                <div className="overflow-hidden rounded-2xl bg-[#0f0f11] border border-white/5">
                    {/* Cover */}
                    <div className="h-32 md:h-40 bg-gradient-to-r from-violet-600/20 via-violet-500/10 to-indigo-600/20 relative">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
                    </div>

                    <div className="relative px-6 pb-6">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-14 md:-mt-16">
                            {/* Avatar */}
                            <div className="relative">
                                <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-[#0f0f11] ring-2 ring-violet-500/20">
                                    <AvatarImage src={user.avatar} className="object-cover" />
                                    <AvatarFallback className="text-4xl bg-violet-500/20 text-violet-400">
                                        {user.fullName?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-3 border-[#0f0f11] ${onlineUsers.has(user.id) ? 'bg-green-500' :
                                    user.status?.toLowerCase() === 'away' ? 'bg-yellow-500' : 'bg-gray-600'
                                    }`} />
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-left space-y-2 mb-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    {user.fullName}
                                </h1>
                                <p className="text-gray-500">@{user.username}</p>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 text-gray-300 text-sm rounded-lg">
                                        <Mail className="w-3.5 h-3.5" />
                                        {user.email}
                                    </span>
                                    {friends && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 text-violet-400 text-sm rounded-lg">
                                            <Users className="w-3.5 h-3.5" />
                                            {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                                {!isSelf && (
                                    <>
                                        {user.friendshipStatus === 'FRIEND' && (
                                            <>
                                                <button
                                                    onClick={handleMessage}
                                                    className="inline-flex items-center gap-2 h-10 px-4 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    Message
                                                </button>
                                                <button
                                                    onClick={() => setIsUnfriendOpen(true)}
                                                    className="inline-flex items-center gap-2 h-10 px-4 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-gray-300 hover:text-red-400 font-medium rounded-lg transition-colors"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                    Unfriend
                                                </button>
                                            </>
                                        )}

                                        {user.friendshipStatus === 'NONE' && (
                                            <button
                                                onClick={handleAddFriend}
                                                disabled={sendRequestMutation.isPending}
                                                className="inline-flex items-center gap-2 h-10 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                                            >
                                                {sendRequestMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <UserPlus className="w-4 h-4" />
                                                )}
                                                Add Friend
                                            </button>
                                        )}

                                        {user.friendshipStatus === 'REQUEST_SENT' && (
                                            <button
                                                onClick={handleCancelRequest}
                                                disabled={cancelRequestMutation.isPending}
                                                className="inline-flex items-center gap-2 h-10 px-4 bg-white/10 hover:bg-white/20 text-gray-300 font-medium rounded-lg transition-colors"
                                            >
                                                {cancelRequestMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <UserX className="w-4 h-4" />
                                                )}
                                                Cancel Request
                                            </button>
                                        )}

                                        {user.friendshipStatus === 'REQUEST_RECEIVED' && (
                                            <span className="inline-flex items-center gap-2 h-10 px-4 bg-violet-500/10 text-violet-400 font-medium rounded-lg">
                                                <UserCheck className="w-4 h-4" />
                                                Request Received
                                            </span>
                                        )}
                                    </>
                                )}

                                {isSelf && (
                                    <button
                                        onClick={() => router.push('/profile')}
                                        className="inline-flex items-center gap-2 h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium rounded-lg transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bio Section */}
                        {user.bio && (
                            <div className="mt-6 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                <h3 className="font-medium text-gray-400 text-sm mb-2">About</h3>
                                <p className="text-gray-300">{user.bio}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Friends Section */}
                <div className="rounded-2xl bg-[#0f0f11] border border-white/5 p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                Friends
                                {friends && (
                                    <span className="text-sm px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-lg">
                                        {friends.length}
                                    </span>
                                )}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {isSelf ? 'Your connections' : `${user.fullName}'s connections`}
                            </p>
                        </div>

                        {friends && friends.length > 0 && (
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    placeholder="Search friends..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {friendsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-white/[0.02] animate-pulse rounded-xl border border-white/5"></div>
                            ))}
                        </div>
                    ) : filteredFriends && filteredFriends.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredFriends.map((friend: User) => {
                                const isFriendOfCurrentUser = friend.friendshipStatus === 'FRIEND';
                                const hasRequestSent = friend.friendshipStatus === 'REQUEST_SENT';
                                const canSendRequest = friend.friendshipStatus === 'NONE' && !isSelf;

                                return (
                                    <div
                                        key={friend.id}
                                        className="group p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                                    >
                                        <div
                                            className="flex items-center gap-3 mb-3"
                                            onClick={() => handleFriendClick(friend)}
                                        >
                                            <div className="relative">
                                                <Avatar className="h-11 w-11 ring-1 ring-white/10">
                                                    <AvatarImage src={friend.avatar} />
                                                    <AvatarFallback className="bg-violet-500/20 text-violet-400">
                                                        {friend.fullName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span
                                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f0f11] ${onlineUsers.has(friend.id) ? 'bg-green-500' :
                                                        friend.status?.toLowerCase() === 'away' ? 'bg-yellow-500' : 'bg-gray-600'
                                                        }`}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-white truncate group-hover:text-violet-400 transition-colors">
                                                    {friend.fullName}
                                                </h3>
                                                <p className="text-sm text-gray-500 truncate">
                                                    @{friend.username}
                                                </p>
                                            </div>
                                        </div>

                                        {canSendRequest && (
                                            <button
                                                className="w-full h-8 flex items-center justify-center gap-2 bg-white/5 hover:bg-violet-500/20 text-gray-400 hover:text-violet-400 text-sm rounded-lg transition-colors"
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
                                            </button>
                                        )}

                                        {hasRequestSent && (
                                            <div className="w-full h-8 flex items-center justify-center gap-1 bg-white/5 text-gray-500 text-sm rounded-lg">
                                                <UserCheck className="w-3 h-3" />
                                                Request Sent
                                            </div>
                                        )}

                                        {isFriendOfCurrentUser && (
                                            <div className="w-full h-8 flex items-center justify-center gap-1 bg-violet-500/10 text-violet-400 text-sm rounded-lg">
                                                <UserCheck className="w-3 h-3" />
                                                Friend
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : friends && friends.length === 0 ? (
                        <div className="text-center py-12 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <Users className="w-7 h-7 text-gray-600" />
                            </div>
                            <h3 className="font-medium text-white mb-2">No friends yet</h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                {isSelf ? "Connect with other users to see them here." : `${user.fullName} hasn't added any friends yet.`}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-12 rounded-xl bg-white/[0.02] border border-white/5">
                            <Search className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                            <h3 className="font-medium text-white mb-2">No results found</h3>
                            <p className="text-sm text-gray-500">Try adjusting your search terms.</p>
                        </div>
                    )}
                </div>
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
                            className="bg-red-600 text-white hover:bg-red-500"
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

'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetUserById, useGetUserFriends, useSendFriendRequest, useCancelFriendRequest } from '@/lib/react-query/queries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserPlus, UserMinus, Search, UserCheck, UserX, MessageSquare } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Loading from '@/components/Loading';

export default function UserProfilePage() {
    const params = useParams();
    const userId = params?.userId as string;
    const router = useRouter();

    const { data: user, isLoading: userLoading } = useGetUserById(userId);
    const { data: friends, isLoading: friendsLoading } = useGetUserFriends(userId);

    const [searchTerm, setSearchTerm] = useState('');

    const sendRequestMutation = useSendFriendRequest();
    const cancelRequestMutation = useCancelFriendRequest();

    if (userLoading || friendsLoading) return <Loading />;
    if (!user) return <div className="p-8 text-center text-muted-foreground">User not found</div>;

    const handleAddFriend = () => {
        sendRequestMutation.mutate(userId);
    };

    const handleUnfriend = () => {
        cancelRequestMutation.mutate({ targetUserId: userId });
    };

    const handleCancelRequest = () => {
        cancelRequestMutation.mutate({ targetUserId: userId });
    };

    const filteredFriends = friends?.filter((friend: any) =>
        friend.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500`}>
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                    <AvatarImage src={user.avatar} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                        {user.fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left space-y-3">
                    <h1 className="text-3xl font-bold">{user.fullName}</h1>
                    <p className="text-lg text-muted-foreground">@{user.username}</p>
                    {user.bio && <p className="text-foreground/80 max-w-lg">{user.bio}</p>}

                    <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                        {user.friendshipStatus === 'NONE' && (
                            <Button onClick={handleAddFriend} disabled={sendRequestMutation.isPending}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Friend
                            </Button>
                        )}

                        {user.friendshipStatus === 'REQUEST_SENT' && (
                            <Button variant="secondary" onClick={handleCancelRequest} disabled={cancelRequestMutation.isPending}>
                                <UserX className="w-4 h-4 mr-2" />
                                Cancel Request
                            </Button>
                        )}

                        {user.friendshipStatus === 'REQUEST_RECEIVED' && (
                            <Button disabled variant="outline">
                                <UserCheck className="w-4 h-4 mr-2" />
                                Request Received
                            </Button>
                        )}

                        {user.friendshipStatus === 'FRIEND' && (
                            <>
                                <Button variant="default" onClick={() => router.push(`/chat`)}>
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Message
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 hover:border-destructive/30 border">
                                            <UserMinus className="w-4 h-4 mr-2" />
                                            Unfriend
                                        </Button>
                                    </AlertDialogTrigger>
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
                                            <AlertDialogAction onClick={handleUnfriend} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Yes, Unfriend
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}

                        {user.friendshipStatus === 'SELF' && (
                            <Button variant="outline" onClick={() => router.push('/profile')}>
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-border my-8" />

            {/* Friends Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h2 className="text-2xl font-semibold">Friends ({friends?.length || 0})</h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search friends..."
                            className="pl-9 bg-secondary/50 border-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {filteredFriends?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredFriends.map((friend: any) => (
                            <Card
                                key={friend.id}
                                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => router.push(`/users/${friend.id}`)}
                            >
                                <Avatar>
                                    <AvatarImage src={friend.avatar} />
                                    <AvatarFallback>{friend.fullName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{friend.fullName}</p>
                                    <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No friends found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetUsers, useSendFriendRequest, useCancelFriendRequest } from '@/lib/react-query/queries';

import { useRouter } from 'next/navigation';

const UsersPage = () => {
    const router = useRouter();
    const { user } = useAuthStore();
    const { data: users, isLoading, isError } = useGetUsers();
    const { mutate: sendFriendRequest, isPending: isSending } = useSendFriendRequest();
    const { mutate: cancelFriendRequest, isPending: isCancelling } = useCancelFriendRequest();

    const handleAddFriend = (receiverId: string) => {
        sendFriendRequest(receiverId);
    };
    //                          Requested User       Friendship ID
    const handleCancelRequest = (receiverId: string, requestId?: string) => {
        cancelFriendRequest({ targetUserId: receiverId, requestId });
    };

    const contacts = users || [];

    if (isLoading) return <div className="p-8 text-center">Loading users...</div>;

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Find Friends</h2>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search users..." className="pl-10 bg-secondary" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {contacts.map((contact) => (
                    <Card
                        key={contact.id}
                        className="rounded-xl border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="relative">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={contact.avatar} />
                                        <AvatarFallback>{contact?.fullName[0] || "A"}</AvatarFallback>
                                    </Avatar>
                                    <span
                                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${contact.status?.toLowerCase() === 'online' ? 'bg-green-500' : contact.status?.toLowerCase() === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-center flex-col items-start">
                                        <h3 className="font-medium truncate">{contact.username}</h3>
                                        <span className="text-xs text-muted-foreground">{contact.fullName}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 flex justify-end gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                    onClick={() => router.push(`/${contact.username}`)}
                                >
                                    View Profile
                                </Button>

                                {contact.friendshipStatus === 'FRIEND' ? (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="text-xs bg-green-100 text-green-700 hover:bg-green-200 border-green-200 cursor-default"
                                    >
                                        Already Friends
                                    </Button>
                                ) : contact.friendshipStatus === 'REQUEST_SENT' ? (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="text-xs"
                                        onClick={() => handleCancelRequest(contact.id, contact.friendshipId)}
                                        disabled={isCancelling}
                                    >
                                        Cancel Request
                                    </Button>
                                ) : contact.friendshipStatus === 'REQUEST_RECEIVED' ? (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="text-xs cursor-default"
                                    >
                                        Request Received
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                                        onClick={() => handleAddFriend(contact.id)}
                                        disabled={isSending}
                                    >
                                        Add Friend
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default UsersPage
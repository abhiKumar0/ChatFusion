'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetUsers, useSendFriendRequest } from '@/lib/react-query/queries';

const UsersPage = () => {
    const { user } = useAuthStore();
    const { data: users, isLoading, isError } = useGetUsers();
    const { mutate: sendFriendRequest, isSuccess } = useSendFriendRequest();
    const [friendRequestStatus, setFriendRequestStatus] = useState<{ [key: string]: boolean }>({});

    const handleAddFriend = (receiverId: string) => {
        sendFriendRequest(receiverId, {
            onSuccess: () => {
                setFriendRequestStatus((prev) => ({ ...prev, [receiverId]: true }));
            },
        });
    };

    const contacts = users || [];

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Search</h2>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <PlusCircle className="w-5 h-5" />
                    </Button>
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
                                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${contact.status === 'online' ? 'bg-green-500' : contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}
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
                                    className="text-xs active:scale-95 transition-transform duration-150 hover:scale-105"
                                >
                                    View Profile
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={`text-xs active:scale-95 transition-all duration-150 hover:scale-105 disabled:cursor-not-allowed ${
                                        friendRequestStatus[contact.id] 
                                            ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                                            : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
                                    }`}
                                    onClick={() => handleAddFriend(contact.id)}
                                    disabled={friendRequestStatus[contact.id] || isSuccess}
                                >
                                    {friendRequestStatus[contact.id] ? "Request Sent" : "Add Friend"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default UsersPage
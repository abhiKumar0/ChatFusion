'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Check, X, ArrowLeft, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGetUsers, useSendFriendRequest, useCancelFriendRequest } from '@/lib/react-query/queries';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const UsersPage = () => {
    const router = useRouter();
    const { data: users, isLoading, isError } = useGetUsers();
    const { mutate: sendFriendRequest, isPending: isSending } = useSendFriendRequest();
    const { mutate: cancelFriendRequest, isPending: isCancelling } = useCancelFriendRequest();
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddFriend = (receiverId: string) => {
        sendFriendRequest(receiverId);
    };

    const handleCancelRequest = (receiverId: string, requestId?: string) => {
        cancelFriendRequest({ targetUserId: receiverId, requestId });
    };

    const contacts = users || [];
    const filteredContacts = contacts.filter((contact: any) =>
        contact.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0a0a0b]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => router.back()}
                            className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-white">Find Friends</h1>
                            <p className="text-sm text-gray-500">Discover and connect with people</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <Input
                            placeholder="Search by name or username..."
                            className="pl-10 h-11 bg-white/5 border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto p-4">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                            <Users className="w-7 h-7 text-violet-400" />
                        </div>
                        <h3 className="font-medium text-white mb-1">No users found</h3>
                        <p className="text-sm text-gray-500">
                            {searchTerm ? 'Try a different search term' : 'No users to display'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredContacts.map((contact: any) => (
                            <div
                                key={contact.id}
                                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-12 w-12 border border-white/10">
                                            <AvatarImage src={contact.avatar} />
                                            <AvatarFallback className="bg-violet-500/20 text-violet-400 font-medium">
                                                {contact?.fullName?.[0] || "A"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span
                                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a0b] ${contact.status?.toLowerCase() === 'online' ? 'bg-green-500' :
                                                contact.status?.toLowerCase() === 'away' ? 'bg-yellow-500' : 'bg-gray-600'
                                                }`}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm text-white truncate">{contact.fullName}</h3>
                                        <p className="text-xs text-gray-500 truncate">@{contact.username}</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <Link
                                        href={`/${contact.username}`}
                                        className="flex-1 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 font-medium flex items-center justify-center transition-colors"
                                    >
                                        View
                                    </Link>

                                    {contact.friendshipStatus === 'FRIEND' ? (
                                        <button className="flex-1 h-8 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium flex items-center justify-center gap-1.5 cursor-default">
                                            <Check className="w-3 h-3" />
                                            Friends
                                        </button>
                                    ) : contact.friendshipStatus === 'REQUEST_SENT' ? (
                                        <button
                                            className="flex-1 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                            onClick={() => handleCancelRequest(contact.id, contact.friendshipId)}
                                            disabled={isCancelling}
                                        >
                                            <X className="w-3 h-3" />
                                            Cancel
                                        </button>
                                    ) : contact.friendshipStatus === 'REQUEST_RECEIVED' ? (
                                        <button className="flex-1 h-8 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs font-medium flex items-center justify-center cursor-default">
                                            Pending
                                        </button>
                                    ) : (
                                        <button
                                            className="flex-1 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                            onClick={() => handleAddFriend(contact.id)}
                                            disabled={isSending}
                                        >
                                            <UserPlus className="w-3 h-3" />
                                            Add
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersPage;
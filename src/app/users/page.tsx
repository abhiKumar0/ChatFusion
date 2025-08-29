'use client';

import React, { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';

const UsersPage = () => {
    const { user } = useAuthStore();
    const { users, fetchUsers } = useUserStore();

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    const contacts = users || [];
    console.log(contacts);

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
                    <div
                        key={contact.id}
                        className="p-4 bg-card rounded-xl border border-border hover:border-primary transition-colors cursor-pointer"
                    >
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
                                <div className="mt-2 flex justify-end">
                                    <Button size="sm" variant="outline" className="text-xs">
                                        View Profile
                                    </Button>
                                </div>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    )
}

export default UsersPage
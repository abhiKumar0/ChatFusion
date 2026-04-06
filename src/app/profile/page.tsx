'use client';

import React, { useState, useEffect } from 'react';
import { useGetMe, useGetFriends, useUpdateUser, useUploadAvatar, useCheckUsername, useCreateConversation, useLogOut } from '@/lib/react-query/queries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Loader2, Mail, User as UserIcon, Edit, Camera, Upload, ArrowLeft, Users, Search, MessageSquare, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/types';

const ProfilePage = () => {
    const router = useRouter();
    const { data: user, isLoading: isUserLoading } = useGetMe();
    const { data: friends, isLoading: isFriendsLoading } = useGetFriends();
    const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
    const { mutateAsync: uploadAvatar, isPending: isUploading } = useUploadAvatar();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        avatar: '',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const { refetch: checkUsernameUnique } = useCheckUsername(formData.username);

    const { mutate: logout, } = useLogOut();
    
      const toggleLogout = () => {
        logout(undefined, {
          onSuccess: () => {
            window.location.href = '/auth';
          }
        });
      };


    useEffect(() => {
        const check = async () => {
            if (formData.username && formData.username !== user?.username) {
                setIsCheckingUsername(true);
                setUsernameError(null);
                try {
                    const { data: isAvailable } = await checkUsernameUnique();
                    if (isAvailable === false) {
                        setUsernameError("Username is already taken");
                    }
                } catch {
                } finally {
                    setIsCheckingUsername(false);
                }
            } else {
                setUsernameError(null);
            }
        };

        const timeoutId = setTimeout(check, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.username, user?.username, checkUsernameUnique]);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                username: user.username || '',
                avatar: user.avatar || '',
            });
            setPreviewUrl(user.avatar || '');
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async () => {
        if (usernameError || isCheckingUsername) return;

        let avatarUrl = formData.avatar;

        if (selectedFile) {
            try {
                avatarUrl = await uploadAvatar(selectedFile);
            } catch (error) {
                console.error("Failed to upload avatar:", error);
                return;
            }
        }

        updateUser({
            fullName: formData.fullName,
            username: formData.username,
            avatar: avatarUrl
        }, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedFile(null);
            }
        });
    };

    const { mutateAsync: createConvoMutate } = useCreateConversation();

    const handleFriendClick = (friend: User) => {
        router.push(`/${friend.username}`);
    };

    const handleMessage = async (friend: User, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const conversation = await createConvoMutate({
                recipientId: friend.id
            });
            if (conversation && conversation.id) {
                router.push(`/chat/${conversation.id}`);
            } else if (conversation && conversation.conversation && conversation.conversation.id) {
                router.push(`/chat/${conversation.conversation.id}`);
            }
        } catch (error) {
            console.error("Failed to create conversation", error);
        }
    };

    const filteredFriends = friends?.filter((friend: User) =>
        friend.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isUserLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-violet-600 mb-4">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="w-7 h-7 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white mb-2">Not Logged In</h1>
                    <p className="text-gray-500 mb-6">Please log in to view your profile.</p>
                    <button
                        onClick={() => router.push('/auth')}
                        className="h-10 px-6 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <span className="text-sm text-gray-500">Profile</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {/* Profile Card */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                    {/* Cover */}
                    <div className="h-32 md:h-40 bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-violet-600/20 relative">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-6 relative">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-12 md:-mt-16">
                            {/* Avatar */}
                            <div className="relative">
                                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-[#0a0a0b] ring-2 ring-violet-500/30">
                                    <AvatarImage src={user.avatar} className="object-cover" />
                                    <AvatarFallback className="text-3xl bg-violet-500/20 text-violet-400">
                                        {user.fullName?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-3 border-[#0a0a0b] ${user.status?.toLowerCase() === 'online' ? 'bg-green-500' :
                                    user.status?.toLowerCase() === 'away' ? 'bg-yellow-500' : 'bg-gray-600'
                                    }`} />
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-left py-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                                    {user.fullName}
                                </h1>
                                <p className="text-gray-500 mb-3">@{user.username}</p>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400">
                                        <Mail className="w-3 h-3" />
                                        {user.email}
                                    </span>
                                    {friends && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-xs text-violet-400">
                                            <Users className="w-3 h-3" />
                                            {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className='flex space-x-2'>

                            <button className="h-10 px-4 bg-red-500/10 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 hover:text-red-300 transition-all flex items-center gap-2" onClick={toggleLogout}>
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>

                            {/* Edit Button */}
                            <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                                <SheetTrigger asChild>
                                    <button className="h-10 px-4 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2">
                                        <Edit className="w-4 h-4" />
                                        Edit Profile
                                    </button>
                                </SheetTrigger>
                                <SheetContent className="overflow-y-auto w-full sm:max-w-md bg-[#0f0f11] border-white/5 p-4">
                                    <SheetHeader>
                                        <SheetTitle className="text-white">Edit Profile</SheetTitle>
                                        <SheetDescription className="text-gray-500">
                                            Make changes to your profile here.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="grid gap-6 py-6">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative group cursor-pointer w-24 h-24">
                                                <Avatar className="h-full w-full border-2 border-white/10 group-hover:border-violet-500/50 transition-colors">
                                                    <AvatarImage src={previewUrl || ""} className="object-cover" />
                                                    <AvatarFallback className="text-xl bg-violet-500/20 text-violet-400">
                                                        {formData.fullName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Camera className="w-8 h-8 text-white" />
                                                </div>
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                            </div>
                                            <button className="h-9 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors relative">
                                                <Upload className="w-4 h-4" />
                                                Change Avatar
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">
                                                    Full Name
                                                </label>
                                                <Input
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    placeholder="John Doe"
                                                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500/50"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300">
                                                    Username
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        value={formData.username}
                                                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                                        placeholder="johndoe"
                                                        className={`h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500/50 ${usernameError ? "border-red-500" : ""}`}
                                                    />
                                                    {isCheckingUsername && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                {usernameError && (
                                                    <p className="text-xs text-red-400">{usernameError}</p>
                                                )}
                                                <p className="text-xs text-gray-600">
                                                    Lowercase letters, numbers, and underscores only.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <SheetFooter className="gap-2">
                                        <SheetClose asChild>
                                            <button className="h-10 px-4 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-lg transition-colors">
                                                Cancel
                                            </button>
                                        </SheetClose>
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={isUpdating || isUploading || isCheckingUsername || !!usernameError || !formData.username}
                                            className="h-10 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2 justify-center"
                                        >
                                            {(isUpdating || isUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Save Changes
                                        </button>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>

                            
                            </div>
                        </div>
                    </div>
                </div>

                {/* Friends Section */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                Friends
                                {friends && (
                                    <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-sm text-violet-400">
                                        {friends.length}
                                    </span>
                                )}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Your connections</p>
                        </div>

                        {friends && friends.length > 0 && (
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    placeholder="Search friends..."
                                    className="pl-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {isFriendsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : filteredFriends && filteredFriends.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredFriends.map((friend: User) => (
                                <div
                                    key={friend.id}
                                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="relative">
                                            <Avatar className="h-11 w-11 border border-white/10">
                                                <AvatarImage src={friend.avatar} />
                                                <AvatarFallback className="bg-violet-500/20 text-violet-400 text-sm">
                                                    {friend.fullName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span
                                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a0b] ${friend.status?.toLowerCase() === 'online' ? 'bg-green-500' :
                                                    friend.status?.toLowerCase() === 'away' ? 'bg-yellow-500' : 'bg-gray-600'
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm text-white truncate">
                                                {friend.fullName}
                                            </h3>
                                            <p className="text-xs text-gray-500 truncate">
                                                @{friend.username}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="flex-1 h-8 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                                            onClick={(e) => handleMessage(friend, e)}
                                        >
                                            <MessageSquare className="w-3 h-3" />
                                            Message
                                        </button>
                                        <button
                                            className="flex-1 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium flex items-center justify-center transition-colors"
                                            onClick={() => handleFriendClick(friend)}
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : friends && friends.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <Users className="w-6 h-6 text-gray-500" />
                            </div>
                            <h3 className="font-medium text-white mb-1">No friends yet</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Connect with other users to see them here.
                            </p>
                            <button
                                onClick={() => router.push('/users')}
                                className="h-9 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Find Friends
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="h-14 w-14 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <Search className="w-6 h-6 text-gray-500" />
                            </div>
                            <h3 className="font-medium text-white mb-1">No results found</h3>
                            <p className="text-sm text-gray-500">
                                Try adjusting your search terms.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

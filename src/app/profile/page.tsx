'use client';

import React, { useState, useEffect } from 'react';
import { useGetMe, useGetFriends, useUpdateUser, useUploadAvatar, useCheckUsername, useCreateConversation } from '@/lib/react-query/queries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Loader2, Mail, User as UserIcon, Edit, Camera, Upload, ArrowLeft, Users, Search, MessageSquare } from 'lucide-react';
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

    // Debounce username check
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
                    // Ignore error on check failure
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
        e.stopPropagation(); // Prevent card click
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
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground animate-pulse">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 text-center bg-gradient-to-br from-background via-background to-destructive/5 p-6">
                <div className="space-y-4 max-w-md">
                    <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                        <UserIcon className="w-10 h-10 text-destructive" />
                    </div>
                    <h1 className="text-3xl font-bold">Not Logged In</h1>
                    <p className="text-muted-foreground text-lg">Please log in to view your profile.</p>
                    <Button onClick={() => router.push('/auth/login')} variant="outline" className="gap-2">
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

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
                                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-background shadow-lg ${user.status?.toLowerCase() === 'online' ? 'bg-green-500' :
                                    user.status?.toLowerCase() === 'away' ? 'bg-yellow-500' :
                                        'bg-gray-400'
                                    } animate-pulse`} />
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

                            {/* Edit Button */}
                            <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                                <SheetTrigger asChild>
                                    <Button className="gap-2 shadow-lg hover:shadow-xl transition-all">
                                        <Edit className="w-4 h-4" />
                                        Edit Profile
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="overflow-y-auto w-full sm:max-w-md">
                                    <SheetHeader>
                                        <SheetTitle>Edit Profile</SheetTitle>
                                        <SheetDescription>
                                            Make changes to your profile here. Click save when you're done.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="grid gap-6 py-6">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative group cursor-pointer w-24 h-24">
                                                <Avatar className="h-full w-full border-2 border-border group-hover:border-primary transition-colors">
                                                    <AvatarImage src={previewUrl || ""} className="object-cover" />
                                                    <AvatarFallback className="text-xl">{formData.fullName?.[0]}</AvatarFallback>
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
                                            <Button variant="outline" size="sm" className="relative cursor-pointer" type="button">
                                                <span className="flex items-center">
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Change Avatar
                                                </span>
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label htmlFor="fullName" className="text-sm font-medium leading-none">
                                                    Full Name
                                                </label>
                                                <Input
                                                    id="fullName"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    placeholder="John Doe"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="username" className="text-sm font-medium leading-none">
                                                    Username
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        id="username"
                                                        value={formData.username}
                                                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                                        placeholder="johndoe"
                                                        className={usernameError ? "border-red-500 pr-10" : "pr-10"}
                                                    />
                                                    {isCheckingUsername && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                {usernameError && (
                                                    <p className="text-xs text-red-500 font-medium">{usernameError}</p>
                                                )}
                                                <p className="text-[0.8rem] text-muted-foreground">
                                                    Usernames can only contain lowercase letters, numbers, and underscores.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <SheetFooter>
                                        <SheetClose asChild>
                                            <Button variant="outline" type="button">Cancel</Button>
                                        </SheetClose>
                                        <Button
                                            onClick={handleUpdateProfile}
                                            disabled={isUpdating || isUploading || isCheckingUsername || !!usernameError || !formData.username}
                                            className="gap-2"
                                        >
                                            {(isUpdating || isUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>
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
                                    Your connections
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

                        {isFriendsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-xl"></div>
                                ))}
                            </div>
                        ) : filteredFriends && filteredFriends.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredFriends.map((friend: User) => (
                                    <Card
                                        key={friend.id}
                                        className="group hover:shadow-lg transition-all duration-300 border-muted-foreground/10 hover:border-primary/30 overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <CardContent className="p-4 relative space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar className="h-14 w-14 border-2 border-background ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                                        <AvatarImage src={friend.avatar} />
                                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5">
                                                            {friend.fullName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span
                                                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background ${friend.status?.toLowerCase() === 'online' ? 'bg-green-500' :
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
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="w-full gap-2 hover:bg-primary/20 transition-colors"
                                                    onClick={(e) => handleMessage(friend, e)}
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    Message
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full gap-2 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                                                    onClick={() => handleFriendClick(friend)}
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : friends && friends.length === 0 ? (
                            <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl border border-dashed border-border/50">
                                <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8 text-muted-foreground opacity-50" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">No friends yet</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                                    Connect with other users to see them here.
                                </p>
                                <Button variant="outline" onClick={() => router.push('/users')}>
                                    Find Friends
                                </Button>
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
        </div>
    );
};

export default ProfilePage;

'use client';

import React, { useState, useEffect } from 'react';
import { useGetMe, useGetFriends, useUpdateUser, useUploadAvatar, useCheckUsername } from '@/lib/react-query/queries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
// Used standard HTML tags instead
// import { Label } from '@/components/ui/label'; 
// import { Textarea } from '@/components/ui/textarea'; 
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Loader2, Mail, User as UserIcon, Calendar, Edit, MessageSquare, Save, Camera, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton'; // Assuming skeleton exists or I'll implementation fallback

// If Textarea/Label don't exist, I'll use standard inputs or divs.
// Since I haven't checked Textarea/Label, I'll assume standard HTML or check first.
// I'll stick to Input for bio for now if Textarea not confirmed, but Textarea is better.
// Actually, let's just use standard HTML textarea with tailwind classes if component missing.

import { useRouter } from 'next/navigation';

const ProfilePage = () => {
    const router = useRouter();
    const { data: user, isLoading: isUserLoading } = useGetMe();
    const { data: friends, isLoading: isFriendsLoading } = useGetFriends();
    const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
    const { mutateAsync: uploadAvatar, isPending: isUploading } = useUploadAvatar();

    const [isEditOpen, setIsEditOpen] = useState(false);
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
                    if (isAvailable === false) { // Assuming api returns true if available
                        setUsernameError("Username is already taken");
                    }
                } catch {
                    // Ignore error on check failure (treat as inconclusive or let backend fail)
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
                // Optionally show toast error here
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

    if (isUserLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <div className="p-8 text-center">User not found. Please log in.</div>;
    }

    return (
        <div className="container mx-auto max-w-5xl p-6 space-y-8">
            {/* Profile Header */}
            <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
                <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 w-full"></div>
                <CardContent className="relative pt-0 pb-8 px-8">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
                        <div className="relative group">
                            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                                <AvatarImage src={user.avatar} className="object-cover" />
                                <AvatarFallback className="text-4xl">{user.fullName?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-background ${(user.status?.toLowerCase() === 'online') ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-2 mb-2">
                            <h1 className="text-3xl font-bold tracking-tight">{user.fullName}</h1>
                            <p className="text-muted-foreground font-medium">@{user.username}</p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {user.email}
                                </span>
                            </div>
                        </div>

                        <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
                            <SheetTrigger asChild>
                                <Button className="gap-2 shadow-sm">
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

                    {user.bio && (
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
                            <h3 className="font-semibold mb-1 text-sm uppercase tracking-wider text-muted-foreground">About</h3>
                            <p className="text-base leading-relaxed">{user.bio}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Friends Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Friends</h2>
                        <p className="text-muted-foreground">
                            You have {friends?.length || 0} friends connected.
                        </p>
                    </div>
                </div>

                {isFriendsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-xl" />
                        ))}
                    </div>
                ) : friends && friends.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {friends.map((friend) => (
                            <Card key={friend.id} className="group hover:shadow-lg transition-all duration-300 border-muted-foreground/10 hover:border-primary/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-14 w-14 border-2 border-background">
                                                <AvatarImage src={friend.avatar} />
                                                <AvatarFallback>{friend.fullName?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <span
                                                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background ${(friend.status?.toLowerCase() === 'online') ? 'bg-green-500' :
                                                    (friend.status?.toLowerCase() === 'away') ? 'bg-yellow-500' : 'bg-gray-400'
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
                                    <div className="mt-4 flex gap-2">
                                        <Button className="w-full gap-2 text-xs" variant="secondary" size="sm">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Message
                                        </Button>
                                        <Button className="w-full gap-2 text-xs" variant="outline" size="sm">
                                            View
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed text-muted-foreground">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <UserIcon className="w-6 h-6 opacity-50" />
                        </div>
                        <h3 className="font-semibold mb-1">No friends yet</h3>
                        <p className="text-sm">Connect with other users to see them here.</p>
                        <Button variant="link" className="mt-2" onClick={() => router.push('/users')}>
                            Find Friends
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;

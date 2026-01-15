'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Search, Loader2, KeyRound, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGetUserByEmail, useRequestPasswordReset, useConfirmPasswordReset } from '@/lib/react-query/queries';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [user, setUser] = useState<any>(null);
    const [step, setStep] = useState<'search' | 'confirm' | 'otp-verification' | 'success'>('search');

    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const router = useRouter();

    const { isLoading: searchLoading, error, refetch: getUserByEmail } = useGetUserByEmail(email);
    const { mutateAsync: requestReset, isPending: requestLoading, error: requestError } = useRequestPasswordReset();
    const { mutateAsync: confirmReset, isPending: confirmLoading, error: confirmError } = useConfirmPasswordReset();

    const handleSearch = async (e: FormEvent) => {
        e.preventDefault();

        try {
            const { data } = await getUserByEmail();
            if (data?.user) {
                setUser(data?.user);
                setStep('confirm');
            }
        } catch (err) {
            console.log("Error", err)
        }
    };

    const handleRequestReset = async () => {
        try {
            await requestReset(email);
            setStep('otp-verification');
        } catch (err: any) {
            console.error(err);
        }
    };

    const handleConfirmReset = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await confirmReset({ email, otp, newPassword });
            setStep('success');
        } catch (err) {
            console.error(err);
        }
    }

    const handleTryAgain = () => {
        setStep('search');
        setUser(null);
        setEmail('');
    };

    const loading = searchLoading || requestLoading || confirmLoading;
    const currentError = error || requestError || confirmError;

    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4 text-foreground">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-[10%] top-[-20%] h-96 w-96 animate-[blob_8s_infinite] rounded-full bg-blue-300/50 opacity-50 blur-3xl filter"></div>
                <div className="absolute right-[-10%] top-[10%] h-96 w-96 animate-[blob_10s_infinite_2s] rounded-full bg-primary/30 opacity-50 blur-3xl filter"></div>
                <div className="absolute bottom-[-10%] left-[20%] h-80 w-80 animate-[blob_12s_infinite_4s] rounded-full bg-purple-300/40 opacity-60 blur-3xl filter"></div>
            </div>

            <Link href="/auth" className="absolute left-10 top-10 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to login
            </Link>

            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card/60 shadow-2xl backdrop-blur-md p-8">
                <h1 className="text-3xl font-bold text-center mb-2">
                    {step === 'otp-verification' ? 'Reset Password' : 'Forgot Password'}
                </h1>
                <p className="text-sm text-muted-foreground text-center mb-8">
                    {step === 'otp-verification' ? 'Enter the code sent to your email' : 'Enter your email to find your account'}
                </p>

                {currentError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                        {currentError.message}
                    </div>
                )}

                {step === 'search' ? (
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border-none bg-secondary p-3"
                                required
                                disabled={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full transform rounded-full cursor-pointer px-12 py-3 text-xs font-bold uppercase tracking-wider transition-transform duration-75 ease-in hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Search Account
                                </>
                            )}
                        </Button>
                    </form>
                ) : step === 'confirm' ? (
                    <div className="space-y-6">
                        <div className="p-6 bg-secondary/50 rounded-xl border border-border/50">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="h-16 w-16 border-2 border-primary/20">
                                    <AvatarImage src={user?.avatar || ''} />
                                    <AvatarFallback className="bg-primary/20 text-2xl">
                                        {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{user?.fullName || 'User'}</h3>
                                    <p className="text-sm text-muted-foreground">@{user?.username || 'username'}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="font-medium">{user?.email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4">Is this your account?</p>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={handleTryAgain} className="flex-1 rounded-full" disabled={loading}>
                                    No, try again
                                </Button>
                                <Button onClick={handleRequestReset} className="flex-1 rounded-full cursor-pointer bg-primary hover:bg-primary/80" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yes, send code'}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : step === 'otp-verification' ? (
                    <form onSubmit={handleConfirmReset} className="space-y-4">
                        <Input
                            type="text"
                            placeholder="Verification Code"
                            className="border-none bg-secondary p-3 text-center tracking-widest text-lg"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            disabled={loading}
                            required
                            maxLength={6}
                        />
                        <Input
                            type="password"
                            placeholder="New Password"
                            className="border-none bg-secondary p-3"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                            required
                            minLength={6}
                        />

                        <Button
                            type="submit"
                            disabled={loading || !otp || !newPassword}
                            className="w-full transform rounded-full px-12 py-3 text-xs font-bold uppercase tracking-wider hover:scale-105"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <> <KeyRound className="mr-2 h-4 w-4" /> Reset Password </>}
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-6 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Password Reset!</h2>
                            <p className="text-sm text-muted-foreground">Your password has been successfully updated.</p>
                        </div>
                        <Button onClick={() => router.push('/auth')} className="w-full rounded-full" variant="outline">
                            Back to Login
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

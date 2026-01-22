'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Search, Loader2, KeyRound, CheckCircle, Mail, MessageSquare } from 'lucide-react';
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
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] p-4">
            {/* Subtle background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            <Link href="/auth" className="absolute left-6 top-6 flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to login
            </Link>

            <div className="relative w-full max-w-md rounded-2xl bg-[#0f0f11] border border-white/10 p-8">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="h-12 w-12 bg-violet-600 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center text-white mb-2">
                    {step === 'otp-verification' ? 'Reset Password' : 'Forgot Password'}
                </h1>
                <p className="text-sm text-gray-500 text-center mb-8">
                    {step === 'otp-verification' ? 'Enter the code sent to your email' : 'Enter your email to find your account'}
                </p>

                {currentError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {currentError.message}
                    </div>
                )}

                {step === 'search' ? (
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-11"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full h-11 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4" />
                                    Search Account
                                </>
                            )}
                        </button>
                    </form>
                ) : step === 'confirm' ? (
                    <div className="space-y-6">
                        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="h-14 w-14 ring-1 ring-white/10">
                                    <AvatarImage src={user?.avatar || ''} />
                                    <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xl">
                                        {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white">{user?.fullName || 'User'}</h3>
                                    <p className="text-sm text-gray-500">@{user?.username || 'username'}</p>
                                </div>
                            </div>
                            <div className="text-sm flex items-center gap-2">
                                <span className="text-gray-500">Email:</span>
                                <span className="text-gray-300">{user?.email}</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-4">Is this your account?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleTryAgain}
                                    className="flex-1 h-10 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-lg transition-colors"
                                    disabled={loading}
                                >
                                    No, try again
                                </button>
                                <button
                                    onClick={handleRequestReset}
                                    className="flex-1 h-10 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, send code'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : step === 'otp-verification' ? (
                    <form onSubmit={handleConfirmReset} className="space-y-4">
                        <Input
                            type="text"
                            placeholder="Verification Code"
                            className="h-11 text-center tracking-widest text-lg"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            disabled={loading}
                            required
                            maxLength={6}
                        />
                        <Input
                            type="password"
                            placeholder="New Password"
                            className="h-11"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                            required
                            minLength={6}
                        />

                        <button
                            type="submit"
                            disabled={loading || !otp || !newPassword}
                            className="w-full h-11 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <KeyRound className="h-4 w-4" />
                                    Reset Password
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-green-500/10">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-white">Password Reset!</h2>
                            <p className="text-sm text-gray-500">Your password has been successfully updated.</p>
                        </div>
                        <button
                            onClick={() => router.push('/auth')}
                            className="w-full h-10 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-lg transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

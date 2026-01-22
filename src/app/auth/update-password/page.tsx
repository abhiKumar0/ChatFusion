'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, MessageSquare, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function UpdatePasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const supabase = createClient();


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {

            //Update password

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            // On success, redirect to login
            if (!error) {
                router.push('/auth');
            }

        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const passwordLengthValid = newPassword.length >= 6;
    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] p-4">
            {/* Subtle background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            {/* Back button */}
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

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/10">
                        <Lock className="h-7 w-7 text-violet-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Update Password</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Enter your new password below
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* New Password Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                            New Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-11 pr-12"
                                required
                                disabled={loading}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                tabIndex={-1}
                            >
                                {showNewPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-11 pr-12"
                                required
                                disabled={loading}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5 space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Password requirements:</p>
                        <ul className="space-y-1.5">
                            <li className={`flex items-center gap-2 text-xs ${passwordLengthValid ? 'text-green-400' : 'text-gray-500'}`}>
                                <Check className={`w-3.5 h-3.5 ${passwordLengthValid ? 'opacity-100' : 'opacity-30'}`} />
                                At least 6 characters long
                            </li>
                            <li className={`flex items-center gap-2 text-xs ${passwordsMatch ? 'text-green-400' : 'text-gray-500'}`}>
                                <Check className={`w-3.5 h-3.5 ${passwordsMatch ? 'opacity-100' : 'opacity-30'}`} />
                                Passwords match
                            </li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !newPassword || !confirmPassword}
                        className="w-full h-11 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Lock className="h-4 w-4" />
                                Update Password
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
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
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {

            //Update password

            const {error} = await supabase.auth.updateUser({
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

    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4 text-foreground">
            {/* Background blobs */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-[10%] top-[-20%] h-96 w-96 animate-[blob_8s_infinite] rounded-full bg-blue-300/50 opacity-50 blur-3xl filter"></div>
                <div className="absolute right-[-10%] top-[10%] h-96 w-96 animate-[blob_10s_infinite_2s] rounded-full bg-primary/30 opacity-50 blur-3xl filter"></div>
                <div className="absolute bottom-[-10%] left-[20%] h-80 w-80 animate-[blob_12s_infinite_4s] rounded-full bg-purple-300/40 opacity-60 blur-3xl filter"></div>
            </div>

            {/* Back button */}
            <Link href="/auth" className="absolute left-10 top-10 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to login
            </Link>

            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card/60 shadow-2xl backdrop-blur-md p-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Update Password</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter your new password below
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* New Password Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80">
                            New Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="border-none bg-secondary pr-12 p-3"
                                required
                                disabled={loading}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                        <label className="text-sm font-medium text-foreground/80">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="border-none bg-secondary pr-12 p-3"
                                required
                                disabled={loading}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>Password must:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                            <li className={newPassword.length >= 6 ? 'text-green-500' : ''}>
                                Be at least 6 characters long
                            </li>
                            <li className={newPassword === confirmPassword && newPassword ? 'text-green-500' : ''}>
                                Match the confirmation password
                            </li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={loading || !newPassword || !confirmPassword}
                        className="w-full transform rounded-full px-12 py-3 text-xs font-bold uppercase tracking-wider transition-transform duration-75 ease-in hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Lock className="mr-2 h-4 w-4" />
                                Update Password
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}

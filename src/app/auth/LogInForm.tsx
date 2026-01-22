'use client';

import { Loader2, Mail, Lock } from "lucide-react";
import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useLogIn } from "@/lib/react-query/queries";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const { mutateAsync: login, isPending: loading, error } = useLogIn();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const handleInstagramLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: 'instagram_basic',
      },
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    try {
      await login({ email, password });
      router.push("/chat");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-1">Welcome back</h2>
        <p className="text-gray-500 text-sm">Enter your credentials to continue</p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error.message || "Login failed. Please try again."}
        </div>
      )}

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-2 h-11 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-sm text-gray-300">Google</span>
        </button>

        <button
          type="button"
          onClick={handleInstagramLogin}
          className="flex items-center justify-center gap-2 h-11 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FCAF45" />
                <stop offset="50%" stopColor="#E1306C" />
                <stop offset="100%" stopColor="#833AB4" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig)" strokeWidth="2" />
            <circle cx="12" cy="12" r="4" stroke="url(#ig)" strokeWidth="2" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig)" />
          </svg>
          <span className="text-sm text-gray-300">Instagram</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs text-gray-600 bg-[#0a0a0b]">or</span>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
          <Input
            type="email"
            placeholder="Email"
            className="pl-10 h-11 bg-white/5 border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
          <Input
            type="password"
            placeholder="Password"
            className="pl-10 h-11 bg-white/5 border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      {/* Forgot password */}
      <div className="text-right">
        <Link href="/auth/forgot-password" className="text-sm text-gray-500 hover:text-white transition-colors">
          Forgot password?
        </Link>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
};

export default LoginForm;
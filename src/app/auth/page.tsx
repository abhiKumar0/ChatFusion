'use client';

import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import SignUpForm from './SignUpForm';
import LoginForm from './LogInForm';
import { useGetMe } from "@/lib/react-query/queries.ts";
import { useRouter } from "next/navigation";
import Link from 'next/link';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const { data: user } = useGetMe();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/chat");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-foreground overflow-hidden relative">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Main gradient blobs - MUCH MORE VISIBLE */}
        <div className="absolute left-[5%] top-[-15%] h-[600px] w-[600px] animate-[blob_8s_infinite] rounded-full bg-blue-500/60 blur-3xl filter"></div>
        <div className="absolute right-[-5%] top-[5%] h-[700px] w-[700px] animate-[blob_10s_infinite_2s] rounded-full bg-purple-600/70 blur-3xl filter"></div>
        <div className="absolute bottom-[-10%] left-[15%] h-[550px] w-[550px] animate-[blob_12s_infinite_4s] rounded-full bg-violet-500/65 blur-3xl filter"></div>

        {/* Additional floating blobs - BIGGER AND BRIGHTER */}
        <div className="absolute top-[35%] right-[15%] h-96 w-96 animate-[float_6s_ease-in-out_infinite] rounded-full bg-cyan-500/50 blur-2xl filter"></div>
        <div className="absolute bottom-[25%] right-[5%] h-[450px] w-[450px] animate-[float-reverse_8s_ease-in-out_infinite] rounded-full bg-pink-500/55 blur-2xl filter"></div>
        <div className="absolute top-[60%] left-[35%] h-80 w-80 animate-[float_7s_ease-in-out_infinite_1s] rounded-full bg-indigo-500/45 blur-2xl filter"></div>

        {/* Rotating gradient rings - MORE VISIBLE */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] animate-[rotate-slow_20s_linear_infinite] opacity-40">
          <div className="h-full w-full rounded-full border-4 border-primary/50 shadow-[0_0_50px_rgba(124,58,237,0.3)]"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[900px] w-[900px] animate-[rotate-slow_30s_linear_infinite_reverse] opacity-30">
          <div className="h-full w-full rounded-full border-4 border-blue-400/40 shadow-[0_0_60px_rgba(96,165,250,0.2)]"></div>
        </div>

        {/* Floating particles - MUCH BIGGER AND BRIGHTER */}
        <div className="absolute top-[15%] left-[10%] h-6 w-6 animate-[drift_15s_ease-in-out_infinite] rounded-full bg-primary shadow-[0_0_20px_rgba(124,58,237,0.8)]"></div>
        <div className="absolute top-[55%] left-[75%] h-8 w-8 animate-[drift_20s_ease-in-out_infinite_2s] rounded-full bg-blue-400 shadow-[0_0_25px_rgba(96,165,250,0.8)]"></div>
        <div className="absolute top-[25%] right-[20%] h-5 w-5 animate-[drift_18s_ease-in-out_infinite_1s] rounded-full bg-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.8)]"></div>
        <div className="absolute bottom-[35%] left-[35%] h-6 w-6 animate-[float_10s_ease-in-out_infinite] rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]"></div>
        <div className="absolute top-[65%] right-[55%] h-7 w-7 animate-[float-reverse_12s_ease-in-out_infinite] rounded-full bg-pink-400 shadow-[0_0_22px_rgba(244,114,182,0.8)]"></div>
        <div className="absolute bottom-[15%] right-[40%] h-5 w-5 animate-[drift_16s_ease-in-out_infinite_3s] rounded-full bg-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.8)]"></div>

        {/* Pulsing glow effects - BIGGER AND BRIGHTER */}
        <div className="absolute top-[10%] left-[45%] h-64 w-64 animate-[pulse-glow_3s_ease-in-out_infinite] rounded-full bg-primary/40 blur-3xl"></div>
        <div className="absolute bottom-[15%] right-[25%] h-72 w-72 animate-[pulse-glow_4s_ease-in-out_infinite_1s] rounded-full bg-blue-500/35 blur-3xl"></div>

        {/* Grid overlay for depth */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      </div>

      {/* Back button */}
      <Link href="/" className="absolute left-10 top-10 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors z-50">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-purple-600/20 backdrop-blur-xl p-8 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.1)] z-10">
        {/* Tab Headers */}
        <div className="flex mb-8 gap-2 p-1 bg-secondary/50 rounded-full">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 px-6 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'login'
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2.5 px-6 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'signup'
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Content */}
        <div className="relative">
          {activeTab === 'login' ? <LoginForm /> : <SignUpForm />}
        </div>
      </div>
    </div>
  );
};

export default Auth;

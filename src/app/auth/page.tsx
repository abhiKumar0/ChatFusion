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
    <div className="min-h-screen bg-[#0a0a0b] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-indigo-600/10" />

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-violet-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-white">ChatFusion</span>
          </Link>

          {/* Main message */}
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Where conversations
              <span className="block text-violet-400">come alive</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Join millions of people using ChatFusion for seamless,
              secure communication every day.
            </p>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold text-white">10+</div>
                <div className="text-sm text-gray-500">Active users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-sm text-gray-500">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">E2E</div>
                <div className="text-sm text-gray-500">Encrypted</div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="max-w-sm">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                "ChatFusion has completely changed how our team communicates.
                The video quality is incredible."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                  SK
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Sarah Kim</div>
                  <div className="text-xs text-gray-500">Product Manager</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">ChatFusion</span>
          </Link>
        </div>

        {/* Back to home - desktop */}
        <div className="hidden lg:block p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-sm">
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 mb-8 bg-white/5 rounded-lg">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'login'
                    ? 'bg-white text-gray-900'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'signup'
                    ? 'bg-white text-gray-900'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                Create account
              </button>
            </div>

            {/* Form */}
            {activeTab === 'login' ? <LoginForm /> : <SignUpForm />}

            {/* Terms */}
            <p className="mt-8 text-center text-xs text-gray-600">
              By continuing, you agree to our{' '}
              <a href="#" className="text-gray-400 hover:text-white">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

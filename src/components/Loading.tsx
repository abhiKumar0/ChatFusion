'use client';

import React from 'react'
import { MessageSquare } from 'lucide-react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullscreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text = 'Loading...',
  fullscreen = true
}) => {
  const containerClasses = fullscreen
    ? 'flex flex-col items-center justify-center min-h-screen bg-[#0a0a0b]'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      {/* Subtle background gradient */}
      {fullscreen && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />
        </div>
      )}

      {/* Logo with pulse animation */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-xl animate-pulse" />
        <div className="relative h-16 w-16 bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/25">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Brand name and loading text */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">ChatFusion</h1>
        <p className="text-sm text-gray-500">{text}</p>
      </div>

      {/* Animated loading dots */}
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

// Skeleton loader for chat messages
export const MessageSkeleton = () => (
  <div className="space-y-4 p-6">
    {[...Array(5)].map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[70%] p-3 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-white/[0.02] border border-white/5' : 'bg-violet-600/20'
          }`}>
          <div className="h-4 bg-white/5 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-white/5 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// Skeleton loader for conversation list
export const ConversationSkeleton = () => (
  <div className="space-y-1 p-2">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="p-3 flex items-center gap-3 animate-pulse">
        <div className="w-11 h-11 bg-white/5 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-white/5 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-white/5 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 bg-white/5 rounded-full"></div>
      <div className="flex-1">
        <div className="h-6 bg-white/5 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-white/5 rounded w-1/4"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-12 bg-white/5 rounded-xl"></div>
      <div className="h-12 bg-white/5 rounded-xl"></div>
    </div>
  </div>
);

// Card skeleton
export const CardSkeleton = () => (
  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-white/5 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-white/5 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-white/5 rounded w-1/3"></div>
      </div>
    </div>
    <div className="h-8 bg-white/5 rounded-lg"></div>
  </div>
);

export default Loading

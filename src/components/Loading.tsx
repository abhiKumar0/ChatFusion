import React from 'react'
import { Loader2 } from 'lucide-react'

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
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const containerClasses = fullscreen 
    ? 'flex flex-col items-center justify-center min-h-screen bg-background'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-4 border-muted rounded-full animate-pulse`}></div>
        {/* Inner spinning loader */}
        <Loader2 className={`${sizeClasses[size]} text-primary animate-spin absolute inset-0`} />
      </div>
      
      {text && (
        <div className="mt-6 text-center">
          <p className="text-lg font-medium text-foreground mb-2">ChatFusion</p>
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        </div>
      )}
      
      {/* Loading dots animation */}
      <div className="flex space-x-2 mt-4">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
      </div>
    </div>
  )
}

// Skeleton loader for chat messages
export const MessageSkeleton = () => (
  <div className="space-y-4 p-6">
    {[...Array(5)].map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[70%] p-3 rounded-2xl animate-pulse ${
          i % 2 === 0 ? 'bg-secondary' : 'bg-primary/20'
        }`}>
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
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
        <div className="w-12 h-12 bg-muted rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

export default Loading

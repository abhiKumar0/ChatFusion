'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles, Zap } from 'lucide-react';

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1706005024051-25bf89ab9d41?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxwYXJ0aWNsZXMlMjBhYnN0cmFjdCUyMGdlb21ldHJpYyUyMGdyYWRpZW50fGVufDB8MHx8Ymx1ZXwxNzU1Nzk0NDU5fDA&ixlib=rb-4.1.0&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 hero-gradient opacity-10 animate-gradient-shift" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-32 w-24 h-24 bg-accent/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-secondary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-primary/20 rounded-full blur-xl animate-blob" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-effect rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Welcome to the Future of Chat</span>
          </div>

          {/* Main Heading */}
          <h1 className="heading-xl text-center mb-6 max-w-4xl mx-auto">
            Connect, Chat, and
            <span className="text-gradient block mt-2">Collaborate Seamlessly</span>
          </h1>

          {/* Subheading */}
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Experience the next generation of messaging with real-time conversations, 
            crystal-clear voice calls, and seamless file sharing—all in one beautiful interface.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button variant="gradient" size="xl" className="min-w-[200px]">
              <MessageSquare className="w-5 h-5" />
              Start Chatting Now
            </Button>
            <Button variant="glass" size="xl" className="min-w-[200px]">
              <Zap className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="glass-effect rounded-lg p-6">
              <div className="text-3xl font-bold text-primary mb-2">10M+</div>
              <div className="text-sm text-muted-foreground">Messages Sent</div>
            </div>
            <div className="glass-effect rounded-lg p-6">
              <div className="text-3xl font-bold text-accent mb-2">500K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="glass-effect rounded-lg p-6">
              <div className="text-3xl font-bold text-secondary-foreground mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
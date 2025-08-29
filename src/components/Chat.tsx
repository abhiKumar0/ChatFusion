'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Send, MoreHorizontal, Phone, Video } from 'lucide-react';

const demoMessages = [
  {
    id: 1,
    sender: 'Alex',
    avatar: 'https://i.pravatar.cc/150?img=1',
    message: 'Hey! Have you tried ChatFusion yet? 🚀',
    time: '2:30 PM',
    isOwn: false,
  },
  {
    id: 2,
    sender: 'You',
    avatar: 'https://i.pravatar.cc/150?img=2',
    message: 'Just signed up! This interface is incredible ✨',
    time: '2:32 PM',
    isOwn: true,
  },
  {
    id: 3,
    sender: 'Sarah',
    avatar: 'https://i.pravatar.cc/150?img=3',
    message: 'The real-time sync is so smooth across all my devices',
    time: '2:33 PM',
    isOwn: false,
  },
  {
    id: 4,
    sender: 'You',
    avatar: 'https://i.pravatar.cc/150?img=2',
    message: 'And the file sharing is lightning fast! 📁⚡',
    time: '2:35 PM',
    isOwn: true,
  },
];

const typingUsers = ['Alex', 'Sarah'];

export function InteractiveChatDemo() {
  const [visibleMessages, setVisibleMessages] = useState<typeof demoMessages>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentMessageIndex < demoMessages.length) {
        setIsTyping(true);
        
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, demoMessages[currentMessageIndex]]);
          setIsTyping(false);
          setCurrentMessageIndex(prev => prev + 1);
        }, 1500);
      } else {
        // Reset animation
        setTimeout(() => {
          setVisibleMessages([]);
          setCurrentMessageIndex(0);
        }, 3000);
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [currentMessageIndex]);

  return (
    <section className="py-24 bg-gradient-to-b from-secondary/20 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="glass" className="mb-4">
            Live Demo
          </Badge>
          <h2 className="heading-lg mb-6">
            See ChatFusion in
            <span className="text-gradient block mt-2">Real Action</span>
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            Watch how seamlessly conversations flow with real-time messaging, 
            typing indicators, and beautiful animations.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Chat Interface */}
            <div className="order-2 lg:order-1">
              <Card className="h-[500px] flex flex-col glass-effect border-2">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="https://i.pravatar.cc/150?img=4" alt="Team Chat" />
                        <AvatarFallback>TC</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Team Chat</h3>
                      <p className="text-xs text-muted-foreground">3 members online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-hidden">
                  {visibleMessages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 animate-fadeInUp ${
                        message.isOwn ? 'justify-end' : 'justify-start'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {!message.isOwn && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.avatar} alt={message.sender} />
                          <AvatarFallback>{message.sender[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[75%] ${message.isOwn ? 'order-first' : ''}`}>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            message.isOwn
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-2">
                          {message.time}
                        </p>
                      </div>
                      {message.isOwn && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.avatar} alt={message.sender} />
                          <AvatarFallback>{message.sender[0]}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-end gap-2 animate-fadeInUp">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="https://i.pravatar.cc/150?img=1" alt="Alex" />
                        <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                      <div className="bg-secondary rounded-2xl px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary rounded-full px-4 py-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="w-full bg-transparent outline-none text-sm"
                        disabled
                      />
                    </div>
                    <button className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Features List */}
            <div className="order-1 lg:order-2 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 glass-effect rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Real-time Delivery</h4>
                    <p className="text-sm text-muted-foreground">Messages appear instantly across all devices</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 glass-effect rounded-lg">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-accent rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Typing Indicators</h4>
                    <p className="text-sm text-muted-foreground">See when others are composing messages</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 glass-effect rounded-lg">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-purple-500 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Smart Sync</h4>
                    <p className="text-sm text-muted-foreground">Seamless synchronization across platforms</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
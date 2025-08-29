'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Users, 
  Shield, 
  FileText, 
  Video, 
  Smartphone,
  Zap,
  Globe
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Real-time Messaging',
    description: 'Lightning-fast message delivery with read receipts and typing indicators.',
    badge: 'Core',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Users,
    title: 'Group Conversations',
    description: 'Create unlimited groups with advanced admin controls and member management.',
    badge: 'Popular',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    icon: Shield,
    title: 'End-to-End Encryption',
    description: 'Military-grade security ensures your conversations remain completely private.',
    badge: 'Security',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: FileText,
    title: 'File Sharing',
    description: 'Share documents, images, and files up to 2GB with drag-and-drop simplicity.',
    badge: 'Productivity',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: Video,
    title: 'Video Calls',
    description: 'Crystal-clear HD video calls with screen sharing and recording capabilities.',
    badge: 'Premium',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Smartphone,
    title: 'Cross-Platform',
    description: 'Seamless sync across all your devices - mobile, desktop, and web.',
    badge: 'Essential',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Zap,
    title: 'Smart Notifications',
    description: 'AI-powered notification management that learns your preferences.',
    badge: 'AI',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Connect with anyone, anywhere with multi-language support.',
    badge: 'Global',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
];

export function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="glass" className="mb-4">
            Features
          </Badge>
          <h2 className="heading-lg mb-6">
            Everything You Need for
            <span className="text-gradient block mt-2">Modern Communication</span>
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            Discover powerful features designed to enhance your conversations and 
            streamline your communication workflow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer group ${
                  hoveredIndex === index ? 'scale-105' : ''
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Animated Background */}
                <div className={`absolute inset-0 ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>

                {/* Hover Effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Ready to experience the future of messaging?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Badge variant="glass" className="px-4 py-2">
              <MessageSquare className="w-4 h-4 mr-2" />
              Free Forever
            </Badge>
            <Badge variant="glass" className="px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Enterprise Ready
            </Badge>
            <Badge variant="glass" className="px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Lightning Fast
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
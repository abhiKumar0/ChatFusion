'use client';

import React from 'react';
import { MessageSquare, Video, Shield, Zap, ArrowRight, Play, Github, Linkedin, Instagram } from 'lucide-react';
import Link from 'next/link';

const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="font-semibold">ChatFusion</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-sm text-gray-400 hover:text-white transition-colors">Home</a>
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#stats" className="text-sm text-gray-400 hover:text-white transition-colors">Stats</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link
              href="/auth"
              className="h-9 px-4 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id='home' className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                <span className="text-xs text-violet-400">Now with HD video calls</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                The better way
                <br />
                to <span className="text-violet-400">stay connected</span>
              </h1>

              {/* Description */}
              <p className="text-lg text-gray-400 max-w-md leading-relaxed">
                Experience crystal-clear video calls and instant messaging.
                Simple, secure, and designed for how you communicate.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/auth"
                  className="h-12 px-6 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button className="h-12 px-6 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Watch demo
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 border-2 border-[#0a0a0b] flex items-center justify-center text-xs font-medium">
                      {['A', 'B', 'C', 'D'][i]}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="text-white font-medium">10,000+</span>
                  <span className="text-gray-500"> people joined this week</span>
                </div>
              </div>
            </div>

            {/* Right content - App preview */}
            <div className="relative lg:pl-8">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-violet-500/20 blur-[100px] rounded-full" />

              {/* Main card */}
              <div className="relative bg-[#111113] rounded-2xl border border-white/10 p-1 shadow-2xl">
                <div className="rounded-xl bg-[#0a0a0b] p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-sm font-medium">
                        JD
                      </div>
                      <div>
                        <div className="font-medium text-sm">John Doe</div>
                        <div className="text-xs text-green-400 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          Online
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Video className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-3 py-4">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex-shrink-0" />
                      <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                        <p className="text-sm text-gray-300">Hey! Are you ready for the meeting?</p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <div className="bg-violet-600 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                        <p className="text-sm">Yes! Give me 5 minutes 👍</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex-shrink-0" />
                      <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                        <p className="text-sm text-gray-300">Perfect, I'll start the call</p>
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 px-4 rounded-lg bg-white/5 border border-white/10 flex items-center text-sm text-gray-500">
                      Type a message...
                    </div>
                    <button className="h-10 w-10 rounded-lg bg-violet-600 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-green-400">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Powerful features designed for seamless communication
            </p>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Video,
                title: "HD Video Calls",
                description: "Crystal-clear quality with low latency",
                color: "blue"
              },
              {
                icon: MessageSquare,
                title: "Instant Chat",
                description: "Real-time messaging with read receipts",
                color: "violet"
              },
              {
                icon: Shield,
                title: "E2E Encrypted",
                description: "Your conversations stay private",
                color: "green"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Built with next-gen WebRTC tech",
                color: "amber"
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className={`h-10 w-10 rounded-lg bg-${feature.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-5 w-5 text-${feature.color}-400`} />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id='stats' className="py-20 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10M+", label: "Active users" },
              { value: "50M+", label: "Messages sent" },
              { value: "99.9%", label: "Uptime" },
              { value: "150+", label: "Countries" }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id='cta' className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-8">
            Join thousands already using ChatFusion. It's free to start.
          </p>
          <Link
            href="/auth"
            className="inline-flex h-12 px-8 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors items-center gap-2"
          >
            Create free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="font-semibold">ChatFusion</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a href="https://github.com/abhiKumar0" className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <Github className="h-4 w-4 text-gray-400" />
              </a>
              <a href="https://www.instagram.com/itsabhisk/" className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <Instagram className="h-4 w-4 text-gray-400" />
              </a>
              <a href="https://www.linkedin.com/in/abhishekk018/" className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <Linkedin className="h-4 w-4 text-gray-400" />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} ChatFusion. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
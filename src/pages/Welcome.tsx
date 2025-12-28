'use client';

import React from 'react';
import { MessageSquare, Video, Shield, Zap, Users, Lock, Github, Twitter, Linkedin, ArrowRight, CheckCircle2, Sparkles, Instagram } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const WelcomePage = () => {
  return (
    <div className="relative min-h-screen bg-black text-gray-200 overflow-x-hidden">
      {/* Animated Background - Same as Auth Page */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Main gradient blobs */}
        <div className="absolute left-[5%] top-[-15%] h-[600px] w-[600px] animate-[blob_8s_infinite] rounded-full bg-blue-500/60 blur-3xl filter"></div>
        <div className="absolute right-[-5%] top-[5%] h-[700px] w-[700px] animate-[blob_10s_infinite_2s] rounded-full bg-purple-600/70 blur-3xl filter"></div>
        <div className="absolute bottom-[-10%] left-[15%] h-[550px] w-[550px] animate-[blob_12s_infinite_4s] rounded-full bg-violet-500/65 blur-3xl filter"></div>

        {/* Additional floating blobs */}
        <div className="absolute top-[35%] right-[15%] h-96 w-96 animate-[float_6s_ease-in-out_infinite] rounded-full bg-cyan-500/50 blur-2xl filter"></div>
        <div className="absolute bottom-[25%] right-[5%] h-[450px] w-[450px] animate-[float-reverse_8s_ease-in-out_infinite] rounded-full bg-pink-500/55 blur-2xl filter"></div>

        {/* Rotating gradient rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] animate-[rotate-slow_20s_linear_infinite] opacity-40">
          <div className="h-full w-full rounded-full border-4 border-primary/50 shadow-[0_0_50px_rgba(124,58,237,0.3)]"></div>
        </div>

        {/* Floating particles */}
        <div className="absolute top-[15%] left-[10%] h-6 w-6 animate-[drift_15s_ease-in-out_infinite] rounded-full bg-primary shadow-[0_0_20px_rgba(124,58,237,0.8)]"></div>
        <div className="absolute top-[55%] left-[75%] h-8 w-8 animate-[drift_20s_ease-in-out_infinite_2s] rounded-full bg-blue-400 shadow-[0_0_25px_rgba(96,165,250,0.8)]"></div>
        <div className="absolute bottom-[35%] left-[35%] h-6 w-6 animate-[float_10s_ease-in-out_infinite] rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="backdrop-blur-xl bg-black/70 border-b border-white/10 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                ChatFusion
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-gray-100 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-gray-100 transition-colors">How It Works</a>
              <a href="#tech" className="text-gray-300 hover:text-gray-100 transition-colors">Technology</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth">
                <Button variant="ghost" className="hidden hover:bg-gray-700 cursor-pointer md:inline-flex text-gray-200 hover:text-gray-100">Sign In</Button>
              </Link>
              <Link href="/auth">
                <Button className="rounded-full bg-gradient-to-r cursor-pointer from-primary to-purple-600 hover:opacity-90">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Real-Time Connection, Redefined</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight text-gray-300">
                Experience{' '}
                <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Seamless
                </span>{' '}
                Communication
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Lag-free HD video calls and instant messaging with your friends, powered by next-gen WebRTC technology. Connect like never before.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button size="lg" className="rounded-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-lg px-8 cursor-pointer">
                    Get Started for Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                  <Button size="lg" variant="outline" className="rounded-full border-white/20 backdrop-blur-sm text-gray-200 cursor-pointer bg-gray-700 hover:bg-white/10">
                    <Video className="mr-2 h-5 w-5" />
                    Watch Demo
                </Button>
              </div>

              {/* Live Stats */}
              {/* <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-white/80">124 Users Online</span>
                </div>
                <div className="h-4 w-px bg-white/20"></div>
                <span className="text-sm text-white/80">5,000+ Connections Made</span>
              </div> */}
            </div>

            <div className="relative">
              <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-purple-600/20 backdrop-blur-xl p-8 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl"></div>
                <div className="relative z-10 flex items-center justify-center h-full">
                  <MessageSquare className="h-48 w-48 text-primary/30" />
                </div>
                {/* Floating UI elements */}
                <div className="absolute top-8 right-8 px-4 py-2 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-500/30">
                  <span className="text-xs font-medium text-green-400">●  Connected</span>
                </div>
                <div className="absolute bottom-8 left-8 px-4 py-2 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-500/30">
                  <span className="text-xs font-medium text-blue-400">HD Quality</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Why ChatFusion?</h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Built with cutting-edge technology for the best communication experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative rounded-2xl bg-black/70 backdrop-blur-xl p-8 border border-white/10 hover:border-primary/50 transition-all duration-300 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Video className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Peer-to-Peer Calling</h3>
              <p className="text-white/80 leading-relaxed">
                High-quality, low-latency video and audio calls powered by WebRTC. Experience crystal-clear communication.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-2xl bg-black/70 backdrop-blur-xl p-8 border border-white/10 hover:border-primary/50 transition-all duration-300 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Instant Messaging</h3>
              <p className="text-white/80 leading-relaxed">
                Real-time chat with "seen" states, typing indicators, and lightning-fast message delivery.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-2xl bg-black/70 backdrop-blur-xl p-8 border border-white/10 hover:border-primary/50 transition-all duration-300 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Secure & Private</h3>
              <p className="text-white/80 leading-relaxed">
                End-to-end encrypted messaging and secure P2P connections. Your privacy is our priority.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">How It Works</h2>
            <p className="text-xl text-white/90">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/50">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold text-white">Create an Account</h3>
              <p className="text-white/80">Quick auth via email. No credit card required.</p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center border-2 border-purple-500/50">
                <span className="text-3xl font-bold text-purple-500">2</span>
              </div>
              <h3 className="text-xl font-bold text-white">Add Your Friends</h3>
              <p className="text-white/80">Search by username and send a friend request.</p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-pink-500/20 to-pink-500/10 flex items-center justify-center border-2 border-pink-500/50">
                <span className="text-3xl font-bold text-pink-500">3</span>
              </div>
              <h3 className="text-xl font-bold text-white">Start the Fusion</h3>
              <p className="text-white/80">One click to start a HD video call or chat.</p>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section id="tech" className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Powered By Modern Tech</h2>
            <p className="text-xl text-white/90">Built on a cutting-edge technology stack</p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 max-w-4xl mx-auto">
            <div className="px-8 py-4 rounded-full bg-black/70 backdrop-blur-xl border border-white/10">
              <span className="font-semibold text-white">Next.js</span>
            </div>
            <div className="px-8 py-4 rounded-full bg-black/70 backdrop-blur-xl border border-white/10">
              <span className="font-semibold text-white">Supabase</span>
            </div>
            <div className="px-8 py-4 rounded-full bg-black/70 backdrop-blur-xl border border-white/10">
              <span className="font-semibold text-white">WebRTC</span>
            </div>
            <div className="px-8 py-4 rounded-full bg-black/70 backdrop-blur-xl border border-white/10">
              <span className="font-semibold text-white">Tailwind CSS</span>
            </div>
            <div className="px-8 py-4 rounded-full bg-black/70 backdrop-blur-xl border border-white/10">
              <span className="font-semibold text-white">TypeScript</span>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary/20 to-purple-600/20 backdrop-blur-xl p-12 md:p-20 border border-white/10 text-center shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready to Connect?</h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of users already experiencing the future of communication
              </p>
              <Link href="/auth">
                <Button size="lg" className="rounded-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-lg px-12">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 backdrop-blur-xl bg-black/70">
          <div className="container mx-auto px-6 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">ChatFusion</span>
                </div>
                <p className="text-sm text-white/70">
                  Real-time communication platform built with modern technology.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-white">Product</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#tech" className="hover:text-white transition-colors">Technology</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-white">Legal</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-white">Connect</h4>
                <div className="flex gap-4">
                  <a href="https://github.com/abhiKumar0" className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Github className="h-5 w-5 text-white" />
                  </a>
                  <a href="https://www.instagram.com/itsabhisk/" className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Instagram className="h-5 w-5 text-white" />
                  </a>
                  <a href="https://www.linkedin.com/in/abhishekk018/" className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Linkedin className="h-5 w-5 text-white" />
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-white/70">
              <p>© {new Date().getFullYear()} ChatFusion. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default WelcomePage;
import React from 'react';
import { MessageSquare, Users, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const WelcomePage = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="p-4 flex justify-between items-center">
        <div className="text-2xl font-bold">ChatFusion</div>
        <div className="flex items-center space-x-4">
          <Link href="/auth" className="hover:text-gray-300">Log In</Link>
          <Link href="/auth" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in-down">
          Welcome to ChatFusion
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-8 animate-fade-in-up">
          The future of real-time communication. Connect, collaborate, and chat like never before.
        </p>
        <Link href="/auth" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg transform hover:scale-105 transition-transform duration-300">
            Get Started
        </Link>
      </main>

      {/* Features Section */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="feature-card bg-gray-700 p-6 rounded-lg text-center transform hover:-translate-y-2 transition-transform duration-300">
              <MessageSquare size={48} className="mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl font-bold mb-2">Real-time Chat</h3>
              <p className="text-gray-400">Instantly message anyone in your network.</p>
            </div>
            <div className="feature-card bg-gray-700 p-6 rounded-lg text-center transform hover:-translate-y-2 transition-transform duration-300">
              <Users size={48} className="mx-auto mb-4 text-green-400" />
              <h3 className="text-xl font-bold mb-2">Group Conversations</h3>
              <p className="text-gray-400">Create groups and chat with multiple people.</p>
            </div>
            <div className="feature-card bg-gray-700 p-6 rounded-lg text-center transform hover:-translate-y-2 transition-transform duration-300">
              <Zap size={48} className="mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
              <p className="text-gray-400">Powered by modern technology for a lag-free experience.</p>
            </div>
            <div className="feature-card bg-gray-700 p-6 rounded-lg text-center transform hover:-translate-y-2 transition-transform duration-300">
              <ShieldCheck size={48} className="mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-bold mb-2">Secure</h3>
              <p className="text-gray-400">Your conversations are private and secure.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 p-4 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} ChatFusion. All rights reserved.</p>
      </footer>

      <style jsx>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
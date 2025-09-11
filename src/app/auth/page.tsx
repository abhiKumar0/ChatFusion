'use client';

import { CircleSlash } from 'lucide-react';
import { useState } from 'react';
import SignUpForm from './SignUpForm';
import LoginForm from './LogInForm';



const Auth = () => {
  const [isSignUpActive, setIsSignUpActive] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[-20%] h-96 w-96 animate-[blob_8s_infinite] rounded-full bg-blue-300/50 opacity-50 blur-3xl filter"></div>
        <div className="absolute right-[-10%] top-[10%] h-96 w-96 animate-[blob_10s_infinite_2s] rounded-full bg-primary/30 opacity-50 blur-3xl filter"></div>
        <div className="absolute bottom-[-10%] left-[20%] h-80 w-80 animate-[blob_12s_infinite_4s] rounded-full bg-purple-300/40 opacity-60 blur-3xl filter"></div>
      </div>

      <div className="relative w-full max-w-4xl min-h-[500px] overflow-hidden rounded-2xl bg-card/60 shadow-2xl backdrop-blur-md">
        <div className={`absolute top-0 z-10 h-full w-1/2 opacity-0 transition-all duration-700 ease-in-out ${isSignUpActive ? 'translate-x-full opacity-100 z-50 animate-show' : ''}`}>
          <SignUpForm />
        </div>

        <div className={`absolute top-0 z-20 h-full w-1/2 transition-all duration-700 ease-in-out ${isSignUpActive ? 'translate-x-full hidden' : ''}`}>
          <LoginForm />
        </div>

        <div className={`absolute left-1/2 top-0 z-40 h-full w-1/2 overflow-hidden transition-transform duration-700 ease-in-out ${isSignUpActive ? '-translate-x-full' : ''}`}>
          <div className={`relative -left-full h-full w-[200%] bg-gradient-to-r from-primary to-blue-400 text-primary-foreground transition-transform duration-700 ease-in-out ${isSignUpActive ? 'translate-x-1/2' : 'translate-x-0'}`}>
            <div className={`absolute top-0 flex h-full w-1/2 transform flex-col items-center justify-center px-10 text-center transition-transform duration-700 ease-in-out ${isSignUpActive ? 'translate-x-0' : '-translate-x-[20%]'}`}>
              <h1 className="mb-4 text-3xl font-bold">Welcome Back!</h1>
              <p className="mb-6 text-sm">To keep connected with us please login with your personal info</p>
              <button onClick={() => setIsSignUpActive(false)} className="transform rounded-full border border-primary-foreground bg-transparent px-12 py-3 text-xs font-bold uppercase tracking-wider transition-transform duration-75 ease-in hover:scale-105">Sign In</button>
            </div>
            <div className={`absolute right-0 top-0 flex h-full w-1/2 transform flex-col items-center justify-center px-10 text-center transition-transform duration-700 ease-in-out ${isSignUpActive ? 'translate-x-[20%]' : 'translate-x-0'}`}>
              <h1 className="mb-4 text-3xl font-bold">Hello, Friend!</h1>
              <p className="mb-6 text-sm">Enter your personal details and start your journey with us</p>
              <button onClick={() => setIsSignUpActive(true)} className="transform rounded-full border border-primary-foreground bg-transparent px-12 py-3 text-xs font-bold uppercase tracking-wider transition-transform duration-75 ease-in hover:scale-105">Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

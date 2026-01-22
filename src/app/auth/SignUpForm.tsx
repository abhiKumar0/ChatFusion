'use client';

import { Loader2, User, Mail, Lock } from "lucide-react";
import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useRequestOtp, useCompleteSignUp, useLogIn } from "@/lib/react-query/queries";

const SignUpForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<'details' | 'otp'>('details');

  const router = useRouter();

  const { mutateAsync: requestOtp, isPending: requestOtpLoading, error: requestOtpError } = useRequestOtp();
  const { mutateAsync: completeSignUp, isPending: completeSignUpLoading, error: completeSignUpError } = useCompleteSignUp();
  const { mutateAsync: login, isPending: loginLoading } = useLogIn();

  const loading = requestOtpLoading || completeSignUpLoading || loginLoading;
  const error = step === 'details' ? requestOtpError : completeSignUpError;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (step === 'details') {
        if (!email || !password || !fullName) return;
        await requestOtp({ fullName, email });
        setStep('otp');
      } else {
        if (!otp) return;
        await completeSignUp({ fullName, email, password, otp });
        await login({ email, password });
        router.push("/chat");
      }
    } catch (err) {
      console.error("Sign up failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-1">
          {step === 'details' ? 'Create your account' : 'Check your email'}
        </h2>
        <p className="text-gray-500 text-sm">
          {step === 'details'
            ? 'Start your journey with ChatFusion'
            : `We sent a code to ${email}`}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error.message || "Something went wrong. Please try again."}
        </div>
      )}

      {/* Inputs */}
      <div className="space-y-3">
        {step === 'details' ? (
          <>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              <Input
                type="text"
                placeholder="Full name"
                className="pl-10 h-11 bg-white/5 border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              <Input
                type="email"
                placeholder="Email"
                className="pl-10 h-11 bg-white/5 border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              <Input
                type="password"
                placeholder="Password (min 6 characters)"
                className="pl-10 h-11 bg-white/5 border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
              />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              className="h-12 bg-white/5 border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 text-center tracking-[0.5em] text-lg font-mono"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              required
              maxLength={6}
            />
            <p className="text-center text-xs text-gray-600">
              Didn't receive it?{' '}
              <button type="button" className="text-violet-400 hover:text-violet-300">
                Resend code
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {step === 'details' ? "Sending code..." : "Verifying..."}
          </>
        ) : (
          step === 'details' ? "Continue" : "Verify & create account"
        )}
      </button>

      {/* Back button */}
      {step === 'otp' && (
        <button
          type="button"
          onClick={() => setStep('details')}
          className="w-full text-sm text-gray-500 hover:text-white transition-colors"
        >
          ← Back to details
        </button>
      )}
    </form>
  );
};

export default SignUpForm;
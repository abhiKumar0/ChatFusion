'use client';

import { UserPlus, Loader2, KeyRound } from "lucide-react";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-100">
          {step === 'details' ? 'Create Account' : 'Verify Email'}
        </h1>
        <p className="text-sm text-gray-300">
          {step === 'details' ? 'Join ChatFusion and start connecting' : `Enter the code sent to ${email}`}
        </p>
      </div>

      {/* Error message display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          {error.message || "An error occurred. Please try again."}
        </div>
      )}

      <div className="space-y-3">
        {step === 'details' ? (
          <>
            <Input
              type="text"
              placeholder="Full Name"
              className="border-none bg-secondary p-3"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              className="border-none bg-secondary p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <Input
              type="password"
              placeholder="Password (min 6 characters)"
              className="border-none bg-secondary p-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
            />
          </>
        ) : (
          <Input
            type="text"
            placeholder="Enter Verification Code"
            className="border-none bg-secondary p-3 text-center tracking-widest text-lg"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={loading}
            required
            maxLength={6}
          />
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full transform rounded-full px-12 py-3 text-xs font-bold uppercase tracking-wider transition-transform duration-75 ease-in hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {step === 'details' ? "Sending code..." : (loginLoading ? "Logging in..." : "Verifying...")}
          </>
        ) : (
          <>
            {step === 'details' ? (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Sign Up
              </>
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                Verify & Create Account
              </>
            )}
          </>
        )}
      </Button>

      {step === 'otp' && (
        <button
          type="button"
          onClick={() => setStep('details')}
          className="w-full text-xs text-gray-400 hover:text-white mt-2"
        >
          Wrong email? Go back
        </button>
      )}
    </form>
  );
};

export default SignUpForm;
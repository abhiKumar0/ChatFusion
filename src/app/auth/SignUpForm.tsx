'use client';

import { UserPlus, Loader2 } from "lucide-react";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useSignUp, useLogIn } from "@/lib/react-query/queries";

const SignUpForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const router = useRouter();

  const { mutateAsync: signup, isPending: signupLoading, error: signupError } = useSignUp();
  const { mutateAsync: login, isPending: loginLoading } = useLogIn();

  const loading = signupLoading || loginLoading;
  const error = signupError;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password || !fullName) {
      return;
    }

    try {
      // Sign up the user
      await signup({ email, password, fullName });
      // Auto-login after signup
      await login({ email, password });
      // Redirect to chat
      router.push("/chat");
    } catch (err) {
      // Error is already handled by react-query and displayed below
      console.error("Sign up failed:", err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-100">Create Account</h1>
        <p className="text-sm text-gray-300">
          Join ChatFusion and start connecting
        </p>
      </div>

      {/* Error message display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          {error.message || "Sign up failed. Please try again."}
        </div>
      )}

      <div className="space-y-3">
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
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full transform rounded-full px-12 py-3 text-xs font-bold uppercase tracking-wider transition-transform duration-75 ease-in hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {signupLoading ? "Creating account..." : "Signing in..."}
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Sign Up
          </>
        )}
      </Button>
    </form>
  );
};

export default SignUpForm;
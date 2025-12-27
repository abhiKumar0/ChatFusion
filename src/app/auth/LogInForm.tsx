'use client';

import { LogIn, Loader2 } from "lucide-react";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useLogIn } from "@/lib/react-query/queries";
import Link from "next/link";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const { mutateAsync: login, isPending: loading, error } = useLogIn();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    try {
      await login({ email, password });
      // Redirect to chat on successful login
      router.push("/chat");
    } catch (err) {
      // Error is already handled by react-query and displayed below
      console.error("Login failed:", err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-100">Welcome Back</h1>
        <p className="text-sm text-gray-300">
          Sign in to continue to ChatFusion
        </p>
      </div>

      {/* Error message display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          {error.message || "Login failed. Please try again."}
        </div>
      )}

      <div className="space-y-3">
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
          placeholder="Password"
          className="border-none bg-secondary p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <Link
        href="/auth/forgot-password"
        className="block text-xs text-primary hover:underline text-right"
      >
        Forgot your password?
      </Link>

      <Button
        type="submit"
        disabled={loading}
        className="w-full transform rounded-full px-12 py-3 text-xs font-bold uppercase tracking-wider transition-transform duration-75 ease-in hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </>
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
'use client';

import { CircleSlash } from "lucide-react";
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
      className="bg-card/0 flex h-full flex-col items-center justify-center px-10 text-center"
    >
      <h1 className="mb-4 text-3xl font-bold">Create Account</h1>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="mb-4 h-12 w-12 rounded-full p-3"
      >
        <CircleSlash />
      </Button>
      <span className="mb-4 text-sm">or use your email for registration</span>

      {/* Error message display */}
      {error && (
        <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          {error.message || "Sign up failed. Please try again."}
        </div>
      )}

      <Input
        type="text"
        placeholder="Full Name"
        className="my-2 w-full border-none bg-secondary p-3"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        disabled={loading}
        required
      />
      <Input
        type="email"
        placeholder="Email"
        className="my-2 w-full border-none bg-secondary p-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        required
      />
      <Input
        type="password"
        placeholder="Password (min 6 characters)"
        className="my-2 w-full border-none bg-secondary p-3"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
        minLength={6}
      />
      <Button
        type="submit"
        disabled={loading}
        className="mt-4 transform rounded-full bg-primary px-12 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-transform duration-75 ease-in hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Signing Up..." : "Sign Up"}
      </Button>
    </form>
  );
};

export default SignUpForm;
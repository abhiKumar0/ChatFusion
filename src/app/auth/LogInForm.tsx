'use client';

import { CircleSlash } from "lucide-react";
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
      className="bg-card/0 flex h-full flex-col items-center justify-center px-10 text-center"
    >
      <h1 className="mb-4 text-3xl font-bold">Sign In</h1>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="mb-4 h-12 w-12 rounded-full p-3"
      >
        <CircleSlash />
      </Button>
      <span className="mb-4 text-sm">or use your account</span>

      {/* Error message display */}
      {error && (
        <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          {error.message || "Login failed. Please try again."}
        </div>
      )}

      <Input
        type="email"
        placeholder="Email"
        className="my-2 border-none bg-secondary p-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        className="my-2 border-none bg-secondary p-3"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
      />
      <Link href="/auth/forgot-password" className="my-4 text-xs text-foreground hover:underline">
        Forgot your password?
      </Link>
      <Button
        type="submit"
        disabled={loading}
        className="mt-4 transform rounded-full px-12 py-3 text-xs font-bold uppercase tracking-wider transition-transform duration-75 ease-in hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
};

export default LoginForm;
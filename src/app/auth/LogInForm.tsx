import { useAuthStore } from "@/store/useAuthStore";
import { CircleSlash } from "lucide-react";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const { login, user } = useAuthStore();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(email, password);
    if (user) router.push("/");
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
      <Input
        type="email"
        placeholder="Email"
        className="my-2 border-none bg-secondary p-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        className="my-2 border-none bg-secondary p-3"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        variant="link"
        className="my-4 h-auto p-0 text-xs text-foreground hover:underline"
      >
        Forgot your password?
      </Button>
      <Button
        type="submit"
        className="mt-4 transform rounded-full px-12 py-3 text-xs font-bold uppercase tracking-wider transition-transform duration-75 ease-in hover:scale-105"
      >
        Sign In
      </Button>
    </form>
  );
};

export default LoginForm;
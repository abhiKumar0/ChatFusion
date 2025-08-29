import { useAuthStore } from "@/store/useAuthStore";
import { CircleSlash } from "lucide-react";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SignUpForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { signup, user, loading } = useAuthStore();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await signup(email, password, name);
    console.log("Registered user:", user);
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
      <Input
        type="text"
        placeholder="Name"
        className="my-2 w-full border-none bg-secondary p-3"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        type="email"
        placeholder="Email"
        className="my-2 w-full border-none bg-secondary p-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        className="my-2 w-full border-none bg-secondary p-3"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        type="submit"
        className="mt-4 transform rounded-full bg-primary px-12 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-transform duration-75 ease-in hover:scale-105"
      >
        {loading ? "Signing Up..." : "Sign Up"}
      </Button>
    </form>
  );
};

export default SignUpForm;
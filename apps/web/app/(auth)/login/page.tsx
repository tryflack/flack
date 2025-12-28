import { Logo } from "@flack/ui/components/logo";
import { LoginForm } from "./components/login-form";

export default async function LoginPage() {
  return (
    <div className="flex flex-col items-center w-full">
      <Logo className="h-10 w-auto mb-8" />
      <div className="w-full">
        <LoginForm />
      </div>
    </div>
  );
}

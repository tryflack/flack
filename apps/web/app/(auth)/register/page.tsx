import { Logo } from "@flack/ui/components/logo";
import { RegisterForm } from "./components/register-form";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center w-full">
      <Logo className="h-10 w-auto mb-8" />
      <div className="w-full">
        <RegisterForm />
      </div>
    </div>
  )
}
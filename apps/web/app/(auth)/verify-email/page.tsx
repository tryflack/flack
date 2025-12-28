
import { headers } from "next/headers";
import { auth } from "@flack/auth";
import { VerifyEmailForm } from "./components/verify-email-form";
import { redirect } from "next/navigation";

export default async function VerifyEmailPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <VerifyEmailForm email={session.user.email} />
    </div>
  )
}
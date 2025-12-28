import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@flack/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // If user has an active organization, redirect to their organization page
  if (session.session.activeOrganizationId) {
    const activeOrg = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (activeOrg?.slug) {
      redirect(`/${activeOrg.slug}`);
    }
  }

  redirect("/setup");
}
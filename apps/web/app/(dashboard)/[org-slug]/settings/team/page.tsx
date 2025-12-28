import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@flack/auth";
import { TeamManagement } from "./components/team-management";

export default async function OrganizationTeamPage({
  params,
}: {
  params: Promise<{ "org-slug": string }>;
}) {
  const { "org-slug": orgSlug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  const organization = organizations?.find((org) => org.slug === orgSlug);

  if (!organization) {
    notFound();
  }

  // Set this organization as active if it's not already
  if (session.session.activeOrganizationId !== organization.id) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: {
        organizationId: organization.id,
      },
    });
  }

  return (
    <TeamManagement 
      organizationName={organization.name}
      currentUserId={session.user.id}
    />
  );
}

import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@flack/auth";
import { OrganizationSettingsForm } from "./components/organization-settings-form";

export default async function OrganizationSettingsPage({
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

  // Set the organization as active to get full details
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

  // Get full organization with members to check role
  const fullOrganization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!fullOrganization) {
    notFound();
  }

  // Find the current user's membership
  const currentMember = fullOrganization.members.find(
    (member) => member.userId === session.user.id,
  );

  const isOwner = currentMember?.role === "owner";

  return (
    <OrganizationSettingsForm
      organization={{
        id: fullOrganization.id,
        name: fullOrganization.name,
        slug: fullOrganization.slug,
        metadata: fullOrganization.metadata,
      }}
      isOwner={isOwner}
    />
  );
}

import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@flack/auth";
import { SidebarProvider } from "@flack/ui/components/sidebar";
import { OrganizationSidebar } from "@/app/components/org-sidebar";
import { SetActiveOrg } from "@/app/components/set-active-org";
import { PresenceProvider } from "./components/presence-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  // Extract domain from website in metadata
  let domain: string | undefined;
  if (organization.metadata) {
    try {
      const metadata =
        typeof organization.metadata === "string"
          ? JSON.parse(organization.metadata)
          : organization.metadata;
      if (metadata.website) {
        const url = new URL(metadata.website);
        domain = url.hostname.replace(/^www\./, "");
      }
    } catch {
      // Invalid metadata or URL, use default
    }
  }

  return (
    <NuqsAdapter>
      <PresenceProvider organizationId={organization.id}>
        <SidebarProvider className="h-dvh bg-secondary">
          <SetActiveOrg
            organizationId={organization.id}
            currentActiveOrgId={session.session.activeOrganizationId}
          />
          <OrganizationSidebar
            organization={{
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              domain,
            }}
          />
          <main className="flex-1 overflow-hidden md:p-2 md:pl-0">
            <div className="flex h-full min-h-0 w-full flex-col bg-background md:rounded-lg md:border md:border-sidebar-border md:shadow-sm">
              {children}
            </div>
          </main>
        </SidebarProvider>
      </PresenceProvider>
    </NuqsAdapter>
  );
}

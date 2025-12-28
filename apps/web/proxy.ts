import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@flack/auth";

const auth_routes = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
];

// Routes that unauthenticated users can access (prefix matching)
const public_route_prefixes = ["/accept-invitation"];

function isPublicRoute(pathname: string) {
  if (auth_routes.includes(pathname)) return true;
  return public_route_prefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users to login (except auth/public routes)
  if (!session && !isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect unverified users to verify email
  if (session && !session.user.emailVerified && pathname !== "/verify-email") {
    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  // Redirect verified users away from auth routes (but allow accept-invitation)
  if (session && session.user.emailVerified && auth_routes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow accept-invitation for unverified users too (they can accept, then verify)
  if (
    session &&
    !session.user.emailVerified &&
    pathname.startsWith("/accept-invitation")
  ) {
    return NextResponse.next();
  }

  // Handle root path routing for verified users
  if (session && session.user.emailVerified && pathname === "/") {
    // If user has an active organization, redirect to it
    if (session.session.activeOrganizationId) {
      const activeOrganization = await auth.api.getFullOrganization({
        headers: await headers(),
      });

      if (activeOrganization?.slug) {
        return NextResponse.redirect(
          new URL(`/${activeOrganization.slug}`, request.url),
        );
      }
    }

    // No active organization - check if user has any organizations
    const organizations = await auth.api.listOrganizations({
      headers: await headers(),
    });

    if (organizations && organizations.length > 0) {
      // User has organizations but none active - set the first one as active
      await auth.api.setActiveOrganization({
        headers: await headers(),
        body: {
          organizationId: organizations[0].id,
        },
      });

      return NextResponse.redirect(
        new URL(`/${organizations[0].slug}`, request.url),
      );
    }

    // No organizations at all - redirect to onboarding
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.svg$).*)",
};

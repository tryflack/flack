"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@flack/ui/components/breadcrumb";
import { getBreadcrumbMap } from "@/app/lib/navigation";
import { SidebarTrigger } from "@flack/ui/components/sidebar";

export function DynamicBreadcrumb({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  const breadcrumbMap = getBreadcrumbMap(orgSlug);

  // Find the label by checking the current path, then walking up to parent paths
  const label = findBreadcrumbLabel(pathname, breadcrumbMap);

  return (
    <>
      <SidebarTrigger className="md:hidden -ml-2" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-lg font-semibold">
              {label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}

// Find the breadcrumb label by checking the current path, then walking up parent paths
function findBreadcrumbLabel(
  pathname: string,
  breadcrumbMap: Record<string, string>,
): string {
  // First, check if the exact path exists in the map
  if (breadcrumbMap[pathname]) {
    return breadcrumbMap[pathname];
  }

  // Walk up the path hierarchy to find a matching parent
  const segments = pathname.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const parentPath = "/" + segments.slice(0, i).join("/");
    if (breadcrumbMap[parentPath]) {
      return breadcrumbMap[parentPath];
    }
  }

  // Fallback: format the last segment
  return formatSegment(segments[segments.length - 1] ?? "");
}

// Fallback: format a URL segment into a readable label
function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

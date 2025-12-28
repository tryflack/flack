import type { LucideIcon } from "lucide-react";
import { Settings, Users } from "lucide-react";

export interface SettingsMenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

/**
 * Get settings menu items for the user dropdown
 */
export function getSettingsMenuItems(orgSlug: string): SettingsMenuItem[] {
  return [
    {
      title: "Settings",
      url: `/${orgSlug}/settings`,
      icon: Settings,
    },
    {
      title: "Team",
      url: `/${orgSlug}/settings/team`,
      icon: Users,
    },
  ];
}

// Build a flat map of URL paths to breadcrumb labels
export function getBreadcrumbMap(orgSlug: string): Record<string, string> {
  const settingsItems = getSettingsMenuItems(orgSlug);
  const map: Record<string, string> = {
    [`/${orgSlug}`]: "Chat",
    [`/${orgSlug}/settings`]: "Settings",
    [`/${orgSlug}/settings/team`]: "Team",
  };

  // Add settings menu items
  for (const item of settingsItems) {
    if (item.url) {
      map[item.url] = item.title;
    }
  }

  return map;
}

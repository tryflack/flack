"use client";

import { cn } from "@flack/ui/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flack/ui/components/tooltip";

interface PresenceIndicatorProps {
  status: "online" | "away" | "offline";
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

const statusColors = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  offline: "bg-gray-400",
};

const statusLabels = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

export function PresenceIndicator({
  status,
  size = "md",
  showTooltip = true,
  className,
}: PresenceIndicatorProps) {
  const indicator = (
    <span
      className={cn(
        "block rounded-full ring-2 ring-background",
        sizeClasses[size],
        statusColors[status],
        className
      )}
    />
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{indicator}</TooltipTrigger>
        <TooltipContent>
          <p>{statusLabels[status]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface AvatarWithPresenceProps {
  children: React.ReactNode;
  status?: "online" | "away" | "offline";
  size?: "sm" | "md" | "lg";
  showOffline?: boolean;
  className?: string;
}

/**
 * Wrapper component to add a presence indicator to an Avatar.
 * Position the indicator at the bottom-right corner, overlapping the avatar edge.
 */
export function AvatarWithPresence({
  children,
  status,
  size = "md",
  showOffline = false,
  className,
}: AvatarWithPresenceProps) {
  // Position classes for different avatar sizes
  const positionClasses = {
    sm: "bottom-0 right-0",
    md: "bottom-0 right-0", 
    lg: "-bottom-0.5 -right-0.5",
  };

  // Show dot if: user is online/away, OR showOffline is true and we have a status
  const shouldShowDot = status && (status !== "offline" || showOffline);

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {children}
      {shouldShowDot && (
        <span className={cn("absolute", positionClasses[size])}>
          <PresenceIndicator status={status} size={size} showTooltip={false} />
        </span>
      )}
    </div>
  );
}


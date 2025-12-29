"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@flack/ui/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const presenceIndicatorVariants = cva(
  "block rounded-full ring-2 ring-background",
  {
    variants: {
      size: {
        sm: "size-2",
        md: "size-2.5",
        lg: "size-3",
      },
      status: {
        online: "bg-green-500",
        away: "bg-yellow-500",
        offline: "bg-gray-400",
      },
    },
    defaultVariants: {
      size: "md",
      status: "offline",
    },
  },
);

const statusLabels = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

interface PresenceIndicatorProps extends VariantProps<
  typeof presenceIndicatorVariants
> {
  showTooltip?: boolean;
  className?: string;
}

function PresenceIndicator({
  status = "offline",
  size = "md",
  showTooltip = true,
  className,
}: PresenceIndicatorProps) {
  const indicator = (
    <span
      className={cn(presenceIndicatorVariants({ size, status }), className)}
    />
  );

  if (!showTooltip || !status) {
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

const avatarWithPresencePositionVariants = cva("absolute", {
  variants: {
    size: {
      sm: "bottom-0 right-0",
      md: "bottom-0 right-0",
      lg: "-bottom-0.5 -right-0.5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

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
function AvatarWithPresence({
  children,
  status,
  size = "md",
  showOffline = false,
  className,
}: AvatarWithPresenceProps) {
  // Show dot if: user is online/away, OR showOffline is true and we have a status
  const shouldShowDot = status && (status !== "offline" || showOffline);

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {children}
      {shouldShowDot && (
        <span className={cn(avatarWithPresencePositionVariants({ size }))}>
          <PresenceIndicator status={status} size={size} showTooltip={false} />
        </span>
      )}
    </div>
  );
}

export {
  PresenceIndicator,
  AvatarWithPresence,
  presenceIndicatorVariants,
  avatarWithPresencePositionVariants,
};

import * as React from "react";

import { cn } from "@flack/ui/lib/utils";

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & { variant?: "destructive" }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-md border pt-6 shadow-sm max-w-7xl overflow-hidden",
        variant === "destructive" && "border-destructive",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 last:pb-6", className)}
      {...props}
    />
  );
}

function CardFooter({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & { variant?: "destructive" }) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "bg-muted justify-end flex items-center px-6 py-2.5 [.border-t]:pt-2.5",
        variant === "destructive"
          ? "border-t border-t-destructive!"
          : "border-t",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};

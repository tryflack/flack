import { Loader2Icon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@flack/ui/lib/utils";

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

function Spinner({
  className,
  size,
  ...props
}: React.ComponentProps<"svg"> & VariantProps<typeof spinnerVariants>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  );
}

export { Spinner, spinnerVariants };

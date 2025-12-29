import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@flack/ui/lib/utils";

const textareaVariants = cva(
  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        both: "resize",
      },
      preset: {
        default: "min-h-16",
        chat: "min-h-[40px] max-h-[200px] resize-none",
        compact: "min-h-[60px] max-h-[120px] resize-none",
      },
    },
    defaultVariants: {
      preset: "default",
    },
  },
);

function Textarea({
  className,
  resize,
  preset,
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ resize, preset }), className)}
      {...props}
    />
  );
}

export { Textarea, textareaVariants };

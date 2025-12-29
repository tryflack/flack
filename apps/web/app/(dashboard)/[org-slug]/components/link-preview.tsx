"use client";

import { ExternalLink } from "lucide-react";
import { useLinkPreview } from "@/app/lib/hooks/use-link-preview";
import { Skeleton } from "@flack/ui/components/skeleton";
import { cn } from "@flack/ui/lib/utils";

interface LinkPreviewProps {
  url: string;
  className?: string;
}

export function LinkPreview({ url, className }: LinkPreviewProps) {
  const { preview, isLoading, error } = useLinkPreview(url);

  // Don't render anything if there's an error or no preview data
  if (error || (!isLoading && !preview)) {
    return null;
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={cn(
          "mt-2 overflow-hidden rounded-lg border border-border bg-muted/30",
          className,
        )}
      >
        <div className="flex">
          <Skeleton className="h-[120px] w-[120px] shrink-0 rounded-none" />
          <div className="flex flex-1 flex-col gap-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!preview) return null;

  // Don't show preview if there's no meaningful content
  if (!preview.title && !preview.description && !preview.image) {
    return null;
  }

  const hasImage = !!preview.image;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group mt-2 block overflow-hidden rounded-lg border border-border bg-muted/30 transition-all hover:border-primary/50 hover:bg-muted/50",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={cn("flex", hasImage ? "flex-row" : "flex-col")}>
        {/* OG Image */}
        {hasImage && (
          <div className="relative h-[120px] w-[200px] shrink-0 overflow-hidden bg-muted">
            <img
              src={preview.image!}
              alt={preview.title || "Link preview"}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                // Hide the image container if it fails to load
                (e.target as HTMLImageElement).parentElement!.style.display =
                  "none";
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3">
          {/* Site name & favicon */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {preview.favicon && (
              <img
                src={preview.favicon}
                alt=""
                className="h-3.5 w-3.5 rounded-sm"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="truncate">{preview.siteName}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          {/* Title */}
          {preview.title && (
            <h4 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {preview.title}
            </h4>
          )}

          {/* Description */}
          {preview.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {preview.description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

interface LinkPreviewsProps {
  urls: string[];
  className?: string;
  maxPreviews?: number;
}

/**
 * Renders link previews for multiple URLs
 */
export function LinkPreviews({
  urls,
  className,
  maxPreviews = 1,
}: LinkPreviewsProps) {
  // Dedupe and limit URLs
  const uniqueUrls = [...new Set(urls)].slice(0, maxPreviews);

  if (uniqueUrls.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {uniqueUrls.map((url) => (
        <LinkPreview key={url} url={url} />
      ))}
    </div>
  );
}

import { Skeleton } from "@flack/ui/components/skeleton";

export function PageLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full bg-muted" />
      <Skeleton className="h-12 w-full bg-muted" />
      <Skeleton className="h-12 w-full bg-muted" />
      <Skeleton className="h-12 w-full bg-muted" />
    </div>
  );
}

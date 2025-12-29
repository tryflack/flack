import useSWR from "swr";
import type { LinkPreviewData } from "@/app/api/link-preview/route";

const fetcher = async (url: string): Promise<LinkPreviewData | null> => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export function useLinkPreview(url: string | null) {
  const { data, error, isLoading } = useSWR<LinkPreviewData | null>(
    url ? `/api/link-preview?url=${encodeURIComponent(url)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // 1 hour
      errorRetryCount: 1, // Only retry once on error
    },
  );

  return {
    preview: data,
    isLoading,
    error,
  };
}

// URL regex that matches common URL patterns
export const URL_REGEX =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*/g;

/**
 * Extract the first URL from a message content
 */
export function extractFirstUrl(content: string): string | null {
  const matches = content.match(URL_REGEX);
  return matches ? matches[0] : null;
}

/**
 * Extract all URLs from a message content
 */
export function extractAllUrls(content: string): string[] {
  const matches = content.match(URL_REGEX);
  return matches || [];
}


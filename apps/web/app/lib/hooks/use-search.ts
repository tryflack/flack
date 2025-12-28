import useSWR from "swr";
import { useState, useCallback, useMemo } from "react";
import type {
  SearchResponse,
  SearchResultMessage,
  SearchResultChannel,
  SearchResultMember,
} from "@/app/api/search/route";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 200;

export interface UseSearchOptions {
  type?: "messages" | "channels" | "members";
}

export interface UseSearchResult {
  query: string;
  setQuery: (query: string) => void;
  debouncedQuery: string;
  messages: SearchResultMessage[];
  channels: SearchResultChannel[];
  members: SearchResultMember[];
  isLoading: boolean;
  isEmpty: boolean;
  hasResults: boolean;
  clear: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchResult {
  const [query, setQueryState] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Set query with debouncing
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new timer for debounced query
      const timer = setTimeout(() => {
        setDebouncedQuery(newQuery.trim());
      }, DEBOUNCE_DELAY);

      setDebounceTimer(timer);
    },
    [debounceTimer],
  );

  // Build search URL
  const searchUrl = useMemo(() => {
    if (!debouncedQuery) return null;

    const params = new URLSearchParams({ q: debouncedQuery });
    if (options.type) {
      params.set("type", options.type);
    }

    return `/api/search?${params.toString()}`;
  }, [debouncedQuery, options.type]);

  // Fetch search results
  const { data, isLoading } = useSWR<SearchResponse>(searchUrl, fetcher, {
    // Keep previous data while loading new results
    keepPreviousData: true,
    // Don't revalidate on focus for search
    revalidateOnFocus: false,
    // Dedupe rapid requests
    dedupingInterval: 100,
  });

  // Clear search
  const clear = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    setQueryState("");
    setDebouncedQuery("");
  }, [debounceTimer]);

  // Result arrays with defaults
  const messages = data?.messages ?? [];
  const channels = data?.channels ?? [];
  const members = data?.members ?? [];

  // Computed states
  const isEmpty = !debouncedQuery;
  const hasResults = messages.length > 0 || channels.length > 0 || members.length > 0;

  return {
    query,
    setQuery,
    debouncedQuery,
    messages,
    channels,
    members,
    isLoading: isLoading && !!debouncedQuery,
    isEmpty,
    hasResults,
    clear,
  };
}

// Re-export types for convenience
export type { SearchResultMessage, SearchResultChannel, SearchResultMember };


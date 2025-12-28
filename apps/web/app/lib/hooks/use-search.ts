import useSWR from "swr";
import { useState, useCallback, useMemo, useRef } from "react";
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
  isSearching: boolean; // True when pending or loading
  isEmpty: boolean;
  hasResults: boolean;
  clear: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchResult {
  const [query, setQueryState] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isPending, setIsPending] = useState(false);

  // Use ref for timer to avoid stale closure issues
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set query with debouncing
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      const trimmedQuery = newQuery.trim();

      // If query is empty, immediately clear debounced query
      if (!trimmedQuery) {
        setDebouncedQuery("");
        setIsPending(false);
        return;
      }

      // Mark as pending while debouncing
      setIsPending(true);

      // Set new timer for debounced query
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedQuery(trimmedQuery);
        setIsPending(false);
        debounceTimerRef.current = null;
      }, DEBOUNCE_DELAY);
    },
    [], // No dependencies - refs don't cause stale closures
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
    // Don't keep previous data - we'll manage display logic ourselves
    keepPreviousData: false,
    // Don't revalidate on focus for search
    revalidateOnFocus: false,
    // Dedupe rapid requests
    dedupingInterval: 100,
  });

  // Clear search
  const clear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setQueryState("");
    setDebouncedQuery("");
    setIsPending(false);
  }, []); // No dependencies - refs don't cause stale closures

  // Only show results if they match the current debounced query
  const resultsMatchQuery =
    data?.query === debouncedQuery && debouncedQuery !== "";

  // Result arrays - only return results if they match current query
  const messages = resultsMatchQuery ? (data?.messages ?? []) : [];
  const channels = resultsMatchQuery ? (data?.channels ?? []) : [];
  const members = resultsMatchQuery ? (data?.members ?? []) : [];

  // Computed states - use raw query for isEmpty check
  const isEmpty = !query.trim();
  const isSearching = isPending || (isLoading && !!debouncedQuery);
  const hasResults =
    messages.length > 0 || channels.length > 0 || members.length > 0;

  return {
    query,
    setQuery,
    debouncedQuery,
    messages,
    channels,
    members,
    isLoading: isLoading && !!debouncedQuery,
    isSearching,
    isEmpty,
    hasResults,
    clear,
  };
}

// Re-export types for convenience
export type { SearchResultMessage, SearchResultChannel, SearchResultMember };

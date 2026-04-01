"use client";

import { useState, useEffect, useRef } from "react";
import type { BggSearchResult } from "@/types/bgg";

export function useBggSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BggSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        // Try BGG directly from browser (bypasses Cloudflare), fall back to server proxy
        let results: BggSearchResult[] = [];
        try {
          const bggRes = await fetch(
            `https://boardgamegeek.com/search/boardgame?nosession=1&q=${encodeURIComponent(query)}&showcount=20`,
            { signal: controller.signal }
          );
          if (bggRes.ok) {
            const data = await bggRes.json();
            results = (data.items || []).map(
              (item: { objectid: string; name: string; yearpublished?: number }) => ({
                id: Number(item.objectid),
                name: item.name,
                yearPublished: item.yearpublished || undefined,
              })
            );
          }
        } catch (bggErr) {
          if (bggErr instanceof DOMException && bggErr.name === "AbortError") throw bggErr;
          // CORS or network error — fall back to server proxy
          const res = await fetch(`/api/bgg/search?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          });
          if (res.ok) {
            results = await res.json();
          }
        }
        setResults(results);
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, isLoading };
}

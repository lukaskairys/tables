"use client";

import { useState } from "react";
import { useBggSearch } from "@/hooks/use-bgg-search";
import type { BggGameDetails } from "@/types/bgg";

interface GameSearchProps {
  onSelect: (game: BggGameDetails) => void;
}

export function GameSearch({ onSelect }: GameSearchProps) {
  const { query, setQuery, results, isLoading } = useBggSearch();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleSelect(id: number) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/bgg/game/${id}`);
      if (res.ok) {
        const details: BggGameDetails = await res.json();
        onSelect(details);
        setQuery("");
        setShowDropdown(false);
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="relative">
      <label htmlFor="game-search" className="block text-sm font-medium text-gray-700 mb-1">
        Choose board game
      </label>
      <input
        id="game-search"
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder="Search for a board game..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {results.map((game) => (
              <li key={game.id}>
                <button
                  onClick={() => handleSelect(game.id)}
                  disabled={loadingId === game.id}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="font-medium text-gray-900">{game.name}</span>
                  <span className="text-xs text-gray-400">
                    {loadingId === game.id
                      ? "Loading..."
                      : game.yearPublished || ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

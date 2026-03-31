"use client";

import { useState } from "react";
import { GameSearch } from "./game-search";
import { createTable } from "@/actions/table";
import type { BggGameDetails } from "@/types/bgg";
import Image from "next/image";

interface CreateTableDialogProps {
  eventId: string;
  onClose: () => void;
}

export function CreateTableDialog({ eventId, onClose }: CreateTableDialogProps) {
  const [selectedGame, setSelectedGame] = useState<BggGameDetails | null>(null);
  const [comment, setComment] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!selectedGame) return;
    setIsCreating(true);
    setError(null);

    const result = await createTable({
      eventId,
      boardGameBggId: selectedGame.id,
      boardGameName: selectedGame.name,
      boardGameImage: selectedGame.image || selectedGame.thumbnail,
      maxPlayers: selectedGame.maxPlayers,
      comment: comment.trim() || null,
    });

    if (!result.success) {
      setError(result.error || "Failed to create table");
      setIsCreating(false);
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create a Table</h2>

        <GameSearch onSelect={setSelectedGame} />

        {selectedGame && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex gap-4">
              {(selectedGame.image || selectedGame.thumbnail) ? (
                <Image
                  src={selectedGame.image || selectedGame.thumbnail || ""}
                  alt={selectedGame.name}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {selectedGame.name[0]}
                </div>
              )}
              <div>
                <h3 className="font-medium text-gray-900">{selectedGame.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedGame.minPlayers}-{selectedGame.maxPlayers} players
                </p>
                {selectedGame.yearPublished && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedGame.yearPublished}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedGame && (
          <div className="mt-4">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g., Beginners welcome, teaching game..."
              maxLength={1000}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedGame || isCreating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Table"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { GameSearch } from "./game-search";
import { updateTable } from "@/actions/table";
import type { BggGameDetails } from "@/types/bgg";

interface TableSettingsDialogProps {
  table: {
    id: string;
    boardGameBggId: number;
    boardGameName: string;
    boardGameImage: string | null;
    maxPlayers: number;
    comment: string | null;
  };
  onClose: () => void;
}

export function TableSettingsDialog({ table, onClose }: TableSettingsDialogProps) {
  const [game, setGame] = useState<{
    bggId: number;
    name: string;
    image: string | null;
    maxPlayers: number;
  }>({
    bggId: table.boardGameBggId,
    name: table.boardGameName,
    image: table.boardGameImage,
    maxPlayers: table.maxPlayers,
  });
  const [comment, setComment] = useState(table.comment || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleGameSelect(details: BggGameDetails) {
    setGame({
      bggId: details.id,
      name: details.name,
      image: details.image || details.thumbnail || null,
      maxPlayers: details.maxPlayers,
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    const result = await updateTable({
      tableId: table.id,
      boardGameBggId: game.bggId,
      boardGameName: game.name,
      boardGameImage: game.image,
      maxPlayers: game.maxPlayers,
      comment: comment.trim() || null,
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Failed to update table");
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Table Settings</h2>

        <div className="space-y-4">
          {/* Current game display */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-3">
              {game.image ? (
                <Image
                  src={game.image}
                  alt={game.name}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {game.name[0]}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 text-sm">{game.name}</p>
                <p className="text-xs text-gray-500">{game.maxPlayers} players max</p>
              </div>
            </div>
          </div>

          {/* Change game */}
          <GameSearch onSelect={handleGameSelect} />

          {/* Comment */}
          <div>
            <label htmlFor="settings-comment" className="block text-sm font-medium text-gray-700 mb-1">
              Comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="settings-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g., Beginners welcome, teaching game..."
              maxLength={1000}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

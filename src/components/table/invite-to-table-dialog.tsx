"use client";

import { useState } from "react";
import Image from "next/image";
import { addMemberToTable } from "@/actions/table";

interface PartyMember {
  id: string;
  name: string | null;
  image: string | null;
}

interface InviteToTableDialogProps {
  tableId: string;
  availableMembers: PartyMember[];
  onClose: () => void;
}

export function InviteToTableDialog({
  tableId,
  availableMembers,
  onClose,
}: InviteToTableDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    if (!selectedUserId) return;
    setIsPending(true);
    setError(null);

    const result = await addMemberToTable(tableId, selectedUserId);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Failed to add member");
      setIsPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Add a Member to Table
        </h2>

        {availableMembers.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            All party members are already at this table.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedUserId(member.id)}
                className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${
                  selectedUserId === member.id
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                }`}
              >
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name || ""}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                    {member.name?.[0] || "?"}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900">
                  {member.name || "Unknown"}
                </span>
              </button>
            ))}
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
          {availableMembers.length > 0 && (
            <button
              onClick={handleInvite}
              disabled={!selectedUserId || isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add to Table"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

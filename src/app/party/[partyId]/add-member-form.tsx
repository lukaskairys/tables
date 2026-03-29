"use client";

import { useState } from "react";
import { addMemberByEmail } from "@/actions/member";

export function AddMemberForm({ partyId }: { partyId: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setMessage(null);

    const result = await addMemberByEmail(partyId, email);

    if (result.success) {
      setMessage({ type: "success", text: "Member added!" });
      setEmail("");
    } else {
      setMessage({ type: "error", text: result.error || "Failed to add member" });
    }
    setIsPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Add member by email..."
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={isPending || !email}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Adding..." : "Add"}
      </button>
      {message && (
        <span
          className={`self-center text-sm ${
            message.type === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {message.text}
        </span>
      )}
    </form>
  );
}

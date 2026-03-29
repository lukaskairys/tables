"use client";

import { useState } from "react";
import { regenerateInviteCode } from "@/actions/party";

interface InviteSectionProps {
  partyId: string;
  inviteCode: string;
  isAdmin: boolean;
}

export function InviteSection({ partyId, inviteCode, isAdmin }: InviteSectionProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/party/join?code=${inviteCode}`
    : "";

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Invite Link</h3>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono text-gray-800 border border-gray-200 truncate">
          {inviteCode}
        </code>
        <button
          onClick={copyLink}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
        {isAdmin && (
          <button
            onClick={() => regenerateInviteCode(partyId)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 whitespace-nowrap"
          >
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
}

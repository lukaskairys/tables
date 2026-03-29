"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { joinPartyByCode } from "@/actions/party";
import { Suspense } from "react";

function JoinForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  const [error, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      const result = await joinPartyByCode(formData);
      return result?.error ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="inviteCode"
          className="block text-sm font-medium text-gray-700"
        >
          Invite Code
        </label>
        <input
          id="inviteCode"
          name="inviteCode"
          type="text"
          required
          defaultValue={code}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
          placeholder="abc12345"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Joining..." : "Join Party"}
      </button>
    </form>
  );
}

export default function JoinPartyPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Join a Party</h1>
      <Suspense>
        <JoinForm />
      </Suspense>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { createEvent } from "@/actions/event";

interface EventFormProps {
  partyId: string;
}

export function EventForm({ partyId }: EventFormProps) {
  const [error, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      const result = await createEvent(formData);
      return result?.error ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="partyId" value={partyId} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Event name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Saturday Game Night"
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="datetime-local"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
}

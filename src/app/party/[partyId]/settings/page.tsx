"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { updateParty, deleteParty } from "@/actions/party";

export default function PartySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const partyId = params.partyId as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/auth/session`).then(() => {
      // Party data would be loaded here in a more complete implementation
      // For now the form starts empty and user fills in new values
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    await updateParty(partyId, formData);
    setIsSaving(false);
    router.push(`/party/${partyId}`);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this party? This cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    await deleteParty(partyId);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Party Settings</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Party name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div className="mt-12 rounded-lg border border-red-200 bg-red-50 p-4">
        <h2 className="text-sm font-semibold text-red-800">Danger Zone</h2>
        <p className="mt-1 text-sm text-red-600">
          Deleting this party will remove all events, tables, and member data.
        </p>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete Party"}
        </button>
      </div>
    </div>
  );
}

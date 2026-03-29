import Link from "next/link";
import { getPartiesForUser } from "@/actions/party";
import { PartyCard } from "@/components/party/party-card";

export default async function DashboardPage() {
  const memberships = await getPartiesForUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Parties</h1>
        <div className="flex gap-3">
          <Link
            href="/party/join"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Join Party
          </Link>
          <Link
            href="/party/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Party
          </Link>
        </div>
      </div>

      {memberships.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-lg font-medium text-gray-900">No parties yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Create a new party or join an existing one with an invite code.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((m) => (
            <PartyCard key={m.id} party={m.party} role={m.role} />
          ))}
        </div>
      )}
    </div>
  );
}

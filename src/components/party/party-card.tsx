import Link from "next/link";

interface PartyCardProps {
  party: {
    id: string;
    name: string;
    description: string | null;
    _count: { members: number; events: number };
  };
  role: string;
}

export function PartyCard({ party, role }: PartyCardProps) {
  return (
    <Link
      href={`/party/${party.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-gray-300"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{party.name}</h3>
        {role === "ADMIN" && (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            Admin
          </span>
        )}
      </div>
      {party.description && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{party.description}</p>
      )}
      <div className="mt-4 flex gap-4 text-xs text-gray-400">
        <span>{party._count.members} members</span>
        <span>{party._count.events} events</span>
      </div>
    </Link>
  );
}

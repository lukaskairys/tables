import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEventById } from "@/actions/event";
import { GameTable } from "@/components/table/game-table";
import { AutoRefresh } from "@/components/table/auto-refresh";
import { CreateTableButton } from "./create-table-button";

export default async function EventPage({
  params,
}: {
  params: Promise<{ partyId: string; eventId: string }>;
}) {
  const { partyId, eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  let event;
  try {
    event = await getEventById(eventId);
  } catch {
    notFound();
  }

  // Fetch party members and check if user is admin
  const members = await import("@/lib/prisma").then((m) =>
    m.prisma.partyMember.findMany({
      where: { partyId },
      include: { user: { select: { id: true, name: true, image: true } } },
    })
  );
  const membership = members.find((m) => m.user.id === session.user!.id);
  const isAdmin = membership?.role === "ADMIN";
  const partyMembers = members.map((m) => m.user);

  const date = new Date(event.date);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AutoRefresh interval={5000} />
      <div className="mb-6">
        <Link
          href={`/party/${partyId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to party
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <p className="mt-1 text-gray-500">
            {date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>

        <CreateTableButton eventId={eventId} />
      </div>

      {event.tables.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-lg font-medium text-gray-900">No tables yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Create a table by searching for a board game.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {event.tables.map((table) => (
            <GameTable
              key={table.id}
              table={table}
              currentUser={{
                id: session.user!.id!,
                name: session.user!.name || null,
                image: session.user!.image || null,
              }}
              isAdmin={isAdmin}
              partyMembers={partyMembers}
            />
          ))}
        </div>
      )}
    </div>
  );
}

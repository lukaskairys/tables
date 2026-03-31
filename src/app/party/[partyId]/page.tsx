import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { InviteSection } from "@/components/party/invite-section";
import { MemberList } from "@/components/party/member-list";
import { EventCard } from "@/components/event/event-card";
import { AddMemberForm } from "./add-member-form";

export default async function PartyPage({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const party = await prisma.party.findUnique({
    where: { id: partyId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
      events: {
        include: { _count: { select: { tables: true } } },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!party) notFound();

  const membership = party.members.find((m) => m.user.id === session.user!.id);
  if (!membership) notFound();

  const isAdmin = membership.role === "ADMIN";
  const isCreator = party.createdById === session.user!.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{party.name}</h1>
          {party.description && (
            <p className="mt-1 text-gray-500">{party.description}</p>
          )}
        </div>
        {isAdmin && (
          <Link
            href={`/party/${partyId}/settings`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Settings
          </Link>
        )}
      </div>

      <InviteSection partyId={partyId} inviteCode={party.inviteCode} isAdmin={isAdmin} />

      {/* Events */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Events</h2>
          {isAdmin && (
            <Link
              href={`/party/${partyId}/event/new`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create Event
            </Link>
          )}
        </div>

        {party.events.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            No events yet.{isAdmin ? " Create one to get started!" : ""}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {party.events.map((event) => (
              <EventCard key={event.id} event={event} partyId={partyId} />
            ))}
          </div>
        )}
      </section>

      {/* Members */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Members ({party.members.length})
          </h2>
        </div>

        {isAdmin && <AddMemberForm partyId={partyId} />}

        <div className="mt-4">
          <MemberList
            partyId={partyId}
            members={party.members}
            currentUserId={session.user!.id}
            isCreator={isCreator}
            isAdmin={isAdmin}
          />
        </div>
      </section>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await prisma.partyMember.findMany({
    where: { userId: session.user.id },
    include: { party: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="text-center">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || ""}
            width={96}
            height={96}
            className="mx-auto rounded-full"
          />
        ) : (
          <div className="mx-auto h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
            {session.user.name?.[0] || "?"}
          </div>
        )}
        <h1 className="mt-4 text-xl font-bold text-gray-900">{session.user.name}</h1>
        <p className="text-sm text-gray-500">{session.user.email}</p>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">My Parties</h2>
        {memberships.length === 0 ? (
          <p className="text-sm text-gray-500">Not in any parties yet.</p>
        ) : (
          <ul className="space-y-2">
            {memberships.map((m: (typeof memberships)[number]) => (
              <li key={m.id}>
                <Link
                  href={`/party/${m.party.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
                >
                  {m.party.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

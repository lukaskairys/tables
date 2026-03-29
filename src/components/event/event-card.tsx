import Link from "next/link";

interface EventCardProps {
  event: {
    id: string;
    name: string;
    date: Date;
    _count: { tables: number };
  };
  partyId: string;
}

export function EventCard({ event, partyId }: EventCardProps) {
  const date = new Date(event.date);

  return (
    <Link
      href={`/party/${partyId}/event/${event.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-gray-300"
    >
      <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
      <p className="mt-1 text-sm text-gray-500">
        {date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
      <p className="mt-3 text-xs text-gray-400">
        {event._count.tables} {event._count.tables === 1 ? "table" : "tables"}
      </p>
    </Link>
  );
}

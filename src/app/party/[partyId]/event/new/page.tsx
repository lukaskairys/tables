import { EventForm } from "@/components/event/event-form";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = await params;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create an Event</h1>
      <EventForm partyId={partyId} />
    </div>
  );
}

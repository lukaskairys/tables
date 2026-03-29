"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePartyAdmin, requirePartyMembership } from "@/lib/auth";
import { createEventSchema } from "@/lib/validators";

export async function createEvent(formData: FormData) {
  const session = await requireAuth();
  const partyId = formData.get("partyId") as string;

  await requirePartyAdmin(partyId);

  const parsed = createEventSchema.safeParse({
    name: formData.get("name"),
    date: formData.get("date"),
    partyId,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const event = await prisma.event.create({
    data: {
      name: parsed.data.name,
      date: parsed.data.date,
      partyId: parsed.data.partyId,
      createdById: session.user.id,
    },
  });

  redirect(`/party/${partyId}/event/${event.id}`);
}

export async function getEventsForParty(partyId: string) {
  await requirePartyMembership(partyId);

  return prisma.event.findMany({
    where: { partyId },
    include: { _count: { select: { tables: true } } },
    orderBy: { date: "asc" },
  });
}

export async function getEventById(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      party: true,
      tables: {
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
          seats: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
            orderBy: { seatNumber: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) throw new Error("Event not found");

  await requirePartyMembership(event.partyId);
  return event;
}

export async function updateEvent(eventId: string, formData: FormData) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { success: false, error: "Event not found" };

  await requirePartyAdmin(event.partyId);

  const name = formData.get("name") as string;
  const date = formData.get("date") as string;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(name && { name }),
      ...(date && { date: new Date(date) }),
    },
  });

  revalidatePath(`/party/${event.partyId}/event/${eventId}`);
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { success: false, error: "Event not found" };

  const { session: _session } = await requirePartyAdmin(event.partyId);
  const partyId = event.partyId;

  await prisma.event.delete({ where: { id: eventId } });
  redirect(`/party/${partyId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePartyMembership, requirePartyAdmin } from "@/lib/auth";
import { createTableSchema } from "@/lib/validators";

export async function createTable(data: {
  eventId: string;
  boardGameBggId: number;
  boardGameName: string;
  boardGameImage: string | null;
  maxPlayers: number;
}) {
  const session = await requireAuth();

  const parsed = createTableSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
  });
  if (!event) return { success: false, error: "Event not found" };

  await requirePartyMembership(event.partyId);

  const table = await prisma.$transaction(async (tx) => {
    const table = await tx.gameTable.create({
      data: {
        eventId: parsed.data.eventId,
        boardGameBggId: parsed.data.boardGameBggId,
        boardGameName: parsed.data.boardGameName,
        boardGameImage: parsed.data.boardGameImage,
        maxPlayers: parsed.data.maxPlayers,
        createdById: session.user.id,
      },
    });

    // Create all seats
    const seatData = Array.from({ length: parsed.data.maxPlayers }, (_, i) => ({
      tableId: table.id,
      seatNumber: i + 1,
      userId: i === 0 ? session.user.id : null, // Creator sits at seat 1
    }));

    await tx.tableSeat.createMany({ data: seatData });

    return table;
  });

  revalidatePath(`/party/${event.partyId}/event/${event.id}`);
  return { success: true, tableId: table.id };
}

export async function joinTable(tableId: string) {
  const session = await requireAuth();

  const table = await prisma.gameTable.findUnique({
    where: { id: tableId },
    include: { event: true },
  });
  if (!table) return { success: false, error: "Table not found" };

  await requirePartyMembership(table.event.partyId);

  // Check if user already seated at this table
  const existingSeat = await prisma.tableSeat.findFirst({
    where: { tableId, userId: session.user.id },
  });
  if (existingSeat) {
    return { success: false, error: "Already seated at this table" };
  }

  // Find lowest empty seat
  const emptySeat = await prisma.tableSeat.findFirst({
    where: { tableId, userId: null },
    orderBy: { seatNumber: "asc" },
  });

  if (!emptySeat) {
    return { success: false, error: "No empty seats available" };
  }

  try {
    await prisma.tableSeat.update({
      where: { id: emptySeat.id },
      data: { userId: session.user.id },
    });
  } catch {
    return { success: false, error: "Seat was just taken, try again" };
  }

  revalidatePath(`/party/${table.event.partyId}/event/${table.eventId}`);
  return { success: true };
}

export async function leaveTable(tableId: string) {
  const session = await requireAuth();

  const table = await prisma.gameTable.findUnique({
    where: { id: tableId },
    include: { event: true },
  });
  if (!table) return { success: false, error: "Table not found" };

  const seat = await prisma.tableSeat.findFirst({
    where: { tableId, userId: session.user.id },
  });

  if (!seat) {
    return { success: false, error: "Not seated at this table" };
  }

  await prisma.tableSeat.update({
    where: { id: seat.id },
    data: { userId: null },
  });

  revalidatePath(`/party/${table.event.partyId}/event/${table.eventId}`);
  return { success: true };
}

export async function removeMemberFromTable(tableId: string, userId: string) {
  await requireAuth();

  const table = await prisma.gameTable.findUnique({
    where: { id: tableId },
    include: { event: true },
  });
  if (!table) return { success: false, error: "Table not found" };

  await requirePartyMembership(table.event.partyId);

  const seat = await prisma.tableSeat.findFirst({
    where: { tableId, userId },
  });
  if (!seat) {
    return { success: false, error: "User is not seated at this table" };
  }

  await prisma.tableSeat.update({
    where: { id: seat.id },
    data: { userId: null },
  });

  revalidatePath(`/party/${table.event.partyId}/event/${table.eventId}`);
  return { success: true };
}

export async function addMemberToTable(tableId: string, userId: string) {
  await requireAuth();

  const table = await prisma.gameTable.findUnique({
    where: { id: tableId },
    include: { event: true },
  });
  if (!table) return { success: false, error: "Table not found" };

  await requirePartyMembership(table.event.partyId);

  // Verify target user is a party member
  const targetMembership = await prisma.partyMember.findUnique({
    where: { userId_partyId: { userId, partyId: table.event.partyId } },
  });
  if (!targetMembership) {
    return { success: false, error: "User is not a member of this party" };
  }

  // Check if target user already seated
  const existingSeat = await prisma.tableSeat.findFirst({
    where: { tableId, userId },
  });
  if (existingSeat) {
    return { success: false, error: "User is already seated at this table" };
  }

  const emptySeat = await prisma.tableSeat.findFirst({
    where: { tableId, userId: null },
    orderBy: { seatNumber: "asc" },
  });
  if (!emptySeat) {
    return { success: false, error: "No empty seats available" };
  }

  try {
    await prisma.tableSeat.update({
      where: { id: emptySeat.id },
      data: { userId },
    });
  } catch {
    return { success: false, error: "Seat was just taken, try again" };
  }

  revalidatePath(`/party/${table.event.partyId}/event/${table.eventId}`);
  return { success: true };
}

export async function deleteTable(tableId: string) {
  const session = await requireAuth();

  const table = await prisma.gameTable.findUnique({
    where: { id: tableId },
    include: { event: true },
  });
  if (!table) return { success: false, error: "Table not found" };

  // Allow table creator or party admin
  if (table.createdById !== session.user.id) {
    await requirePartyAdmin(table.event.partyId);
  }

  await prisma.gameTable.delete({ where: { id: tableId } });

  revalidatePath(`/party/${table.event.partyId}/event/${table.eventId}`);
  return { success: true };
}

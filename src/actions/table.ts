"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePartyMembership, requirePartyAdmin } from "@/lib/auth";
import { createTableSchema, updateTableSchema } from "@/lib/validators";

export async function createTable(data: {
  eventId: string;
  boardGameBggId: number;
  boardGameName: string;
  boardGameImage: string | null;
  maxPlayers: number;
  comment?: string | null;
}) {
  const session = await requireAuth();

  const parsed = createTableSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
  });
  if (!event) return { success: false, error: "Event not found" };

  await requirePartyMembership(event.partyId);

  const table = await prisma.gameTable.create({
    data: {
      eventId: parsed.data.eventId,
      boardGameBggId: parsed.data.boardGameBggId,
      boardGameName: parsed.data.boardGameName,
      boardGameImage: parsed.data.boardGameImage,
      maxPlayers: parsed.data.maxPlayers,
      comment: parsed.data.comment,
      createdById: session.user.id,
    },
  });

  // Create all seats
  const seatData = Array.from({ length: parsed.data.maxPlayers }, (_, i) => ({
    tableId: table.id,
    seatNumber: i + 1,
    userId: i === 0 ? session.user.id : null, // Creator sits at seat 1
  }));

  await prisma.tableSeat.createMany({ data: seatData });

  revalidatePath(`/party/${event.partyId}/event/${event.id}`);
  return { success: true, tableId: table.id };
}

export async function updateTable(data: {
  tableId: string;
  boardGameBggId: number;
  boardGameName: string;
  boardGameImage: string | null;
  maxPlayers: number;
  comment?: string | null;
}) {
  const session = await requireAuth();

  const parsed = updateTableSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const table = await prisma.gameTable.findUnique({
    where: { id: parsed.data.tableId },
    include: { event: true, seats: { orderBy: { seatNumber: "asc" } } },
  });
  if (!table) return { success: false, error: "Table not found" };

  // Allow table creator or party admin
  if (table.createdById !== session.user.id) {
    await requirePartyAdmin(table.event.partyId);
  }

  const oldMax = table.maxPlayers;
  const newMax = parsed.data.maxPlayers;

  await prisma.gameTable.update({
    where: { id: parsed.data.tableId },
    data: {
      boardGameBggId: parsed.data.boardGameBggId,
      boardGameName: parsed.data.boardGameName,
      boardGameImage: parsed.data.boardGameImage,
      maxPlayers: parsed.data.maxPlayers,
      comment: parsed.data.comment,
    },
  });

  if (newMax > oldMax) {
    const newSeats = Array.from({ length: newMax - oldMax }, (_, i) => ({
      tableId: parsed.data.tableId,
      seatNumber: oldMax + i + 1,
      userId: null as string | null,
    }));
    await prisma.tableSeat.createMany({ data: newSeats });
  } else if (newMax < oldMax) {
    const seatsToRemove = table.seats.slice(newMax).map((s) => s.id);
    if (seatsToRemove.length > 0) {
      await prisma.tableSeat.deleteMany({ where: { id: { in: seatsToRemove } } });
    }
  }

  revalidatePath(`/party/${table.event.partyId}/event/${table.eventId}`);
  return { success: true };
}

export async function joinTable(tableId: string, seatId: string) {
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

  try {
    const updated = await prisma.tableSeat.updateMany({
      where: { id: seatId, tableId, userId: null },
      data: { userId: session.user.id },
    });
    if (updated.count === 0) {
      return { success: false, error: "Seat is already taken, try another" };
    }
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

export async function addMemberToTable(tableId: string, userId: string, seatId?: string) {
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

  let targetSeatId = seatId;
  if (!targetSeatId) {
    const emptySeat = await prisma.tableSeat.findFirst({
      where: { tableId, userId: null },
      orderBy: { seatNumber: "asc" },
    });
    if (!emptySeat) {
      return { success: false, error: "No empty seats available" };
    }
    targetSeatId = emptySeat.id;
  }

  try {
    const updated = await prisma.tableSeat.updateMany({
      where: { id: targetSeatId, tableId, userId: null },
      data: { userId },
    });
    if (updated.count === 0) {
      return { success: false, error: "Seat is already taken, try another" };
    }
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

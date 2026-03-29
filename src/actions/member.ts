"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePartyAdmin } from "@/lib/auth";

export async function addMemberByEmail(partyId: string, email: string) {
  await requirePartyAdmin(partyId);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "No user found with that email" };
  }

  const existing = await prisma.partyMember.findUnique({
    where: { userId_partyId: { userId: user.id, partyId } },
  });

  if (existing) {
    return { success: false, error: "User is already a member" };
  }

  await prisma.partyMember.create({
    data: { userId: user.id, partyId, role: "MEMBER" },
  });

  revalidatePath(`/party/${partyId}`);
  return { success: true };
}

export async function removeMember(partyId: string, userId: string) {
  const { session } = await requirePartyAdmin(partyId);

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (party?.createdById === userId) {
    return { success: false, error: "Cannot remove the party creator" };
  }

  if (userId === session.user.id) {
    return { success: false, error: "Cannot remove yourself" };
  }

  // Clean up their seats in this party's events
  await prisma.tableSeat.updateMany({
    where: {
      userId,
      table: { event: { partyId } },
    },
    data: { userId: null },
  });

  await prisma.partyMember.delete({
    where: { userId_partyId: { userId, partyId } },
  });

  revalidatePath(`/party/${partyId}`);
  return { success: true };
}

export async function updateMemberRole(
  partyId: string,
  userId: string,
  role: "ADMIN" | "MEMBER"
) {
  const { session } = await requirePartyAdmin(partyId);

  const party = await prisma.party.findUnique({ where: { id: partyId } });

  // Only creator can promote/demote
  if (party?.createdById !== session.user.id) {
    return { success: false, error: "Only the party creator can change roles" };
  }

  if (userId === party.createdById) {
    return { success: false, error: "Cannot change the creator's role" };
  }

  await prisma.partyMember.update({
    where: { userId_partyId: { userId, partyId } },
    data: { role },
  });

  revalidatePath(`/party/${partyId}`);
  return { success: true };
}

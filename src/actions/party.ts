"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePartyAdmin } from "@/lib/auth";
import { createPartySchema } from "@/lib/validators";

export async function createParty(formData: FormData) {
  const session = await requireAuth();
  const parsed = createPartySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const party = await prisma.party.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      inviteCode: nanoid(8),
      createdById: session.user.id,
    },
  });

  await prisma.partyMember.create({
    data: {
      userId: session.user.id,
      partyId: party.id,
      role: "ADMIN",
    },
  });

  redirect(`/party/${party.id}`);
}

export async function joinPartyByCode(formData: FormData) {
  const session = await requireAuth();
  const inviteCode = formData.get("inviteCode") as string;

  if (!inviteCode) {
    return { success: false, error: "Invite code is required" };
  }

  const party = await prisma.party.findUnique({
    where: { inviteCode },
  });

  if (!party) {
    return { success: false, error: "Invalid invite code" };
  }

  const existing = await prisma.partyMember.findUnique({
    where: { userId_partyId: { userId: session.user.id, partyId: party.id } },
  });

  if (existing) {
    redirect(`/party/${party.id}`);
  }

  await prisma.partyMember.create({
    data: {
      userId: session.user.id,
      partyId: party.id,
      role: "MEMBER",
    },
  });

  redirect(`/party/${party.id}`);
}

export async function getPartiesForUser() {
  const session = await requireAuth();

  return prisma.partyMember.findMany({
    where: { userId: session.user.id },
    include: {
      party: {
        include: {
          _count: { select: { members: true, events: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
}

export async function regenerateInviteCode(partyId: string) {
  await requirePartyAdmin(partyId);

  await prisma.party.update({
    where: { id: partyId },
    data: { inviteCode: nanoid(8) },
  });

  revalidatePath(`/party/${partyId}`);
}

export async function updateParty(partyId: string, formData: FormData) {
  await requirePartyAdmin(partyId);

  const parsed = createPartySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.party.update({
    where: { id: partyId },
    data: { name: parsed.data.name, description: parsed.data.description },
  });

  revalidatePath(`/party/${partyId}`);
  return { success: true };
}

export async function deleteParty(partyId: string) {
  const { session } = await requirePartyAdmin(partyId);

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (party?.createdById !== session.user.id) {
    return { success: false, error: "Only the party creator can delete it" };
  }

  await prisma.party.delete({ where: { id: partyId } });
  redirect("/dashboard");
}

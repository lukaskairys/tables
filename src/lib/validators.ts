import { z } from "zod";

export const createPartySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

export const createEventSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  date: z.coerce.date(),
  partyId: z.string().cuid(),
});

export const createTableSchema = z.object({
  eventId: z.string().cuid(),
  boardGameBggId: z.number().int().positive(),
  boardGameName: z.string().min(1),
  boardGameImage: z.string().url().optional().nullable(),
  maxPlayers: z.number().int().min(1).max(20),
});

export const joinPartySchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

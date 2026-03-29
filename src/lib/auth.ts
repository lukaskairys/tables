import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requirePartyMembership(partyId: string) {
  const session = await requireAuth();
  const membership = await prisma.partyMember.findUnique({
    where: { userId_partyId: { userId: session.user.id, partyId } },
  });
  if (!membership) {
    throw new Error("Not a member of this party");
  }
  return { session, membership };
}

export async function requirePartyAdmin(partyId: string) {
  const { session, membership } = await requirePartyMembership(partyId);
  if (membership.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  return { session, membership };
}

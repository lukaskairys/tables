"use client";

import Image from "next/image";
import { removeMember, updateMemberRole } from "@/actions/member";

interface Member {
  id: string;
  role: "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface MemberListProps {
  partyId: string;
  members: Member[];
  currentUserId: string;
  isCreator: boolean;
  isAdmin: boolean;
}

export function MemberList({
  partyId,
  members,
  currentUserId,
  isCreator,
  isAdmin,
}: MemberListProps) {
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
        >
          <div className="flex items-center gap-3">
            {member.user.image ? (
              <Image
                src={member.user.image}
                alt={member.user.name || ""}
                width={36}
                height={36}
                className="rounded-full"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                {member.user.name?.[0] || "?"}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {member.user.name}
                {member.user.id === currentUserId && (
                  <span className="text-gray-400 ml-1">(you)</span>
                )}
              </p>
              <p className="text-xs text-gray-500">{member.user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                member.role === "ADMIN"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {member.role}
            </span>

            {isCreator && member.user.id !== currentUserId && (
              <select
                value={member.role}
                onChange={(e) =>
                  updateMemberRole(
                    partyId,
                    member.user.id,
                    e.target.value as "ADMIN" | "MEMBER"
                  )
                }
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            )}

            {isAdmin && member.user.id !== currentUserId && (
              <button
                onClick={() => removeMember(partyId, member.user.id)}
                className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

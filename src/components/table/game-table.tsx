"use client";

import { useState, useOptimistic, useTransition } from "react";
import Image from "next/image";
import { TableSeat } from "./table-seat";
import { InviteToTableDialog } from "./invite-to-table-dialog";
import { joinTable, leaveTable, deleteTable, removeMemberFromTable } from "@/actions/table";

interface Seat {
  id: string;
  seatNumber: number;
  user: { id: string; name: string | null; image: string | null } | null;
}

interface PartyMember {
  id: string;
  name: string | null;
  image: string | null;
}

interface GameTableProps {
  table: {
    id: string;
    boardGameName: string;
    boardGameImage: string | null;
    maxPlayers: number;
    createdBy: { id: string; name: string | null };
    seats: Seat[];
  };
  currentUser: { id: string; name: string | null; image: string | null };
  isAdmin: boolean;
  partyMembers: PartyMember[];
}

export function GameTable({ table, currentUser, isAdmin, partyMembers }: GameTableProps) {
  const [isPending, startTransition] = useTransition();
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const [optimisticSeats, addOptimistic] = useOptimistic(
    table.seats,
    (seats: Seat[], action: { type: "join" | "leave"; userId: string }) => {
      if (action.type === "join") {
        const emptySeat = seats.find((s) => !s.user);
        if (!emptySeat) return seats;
        return seats.map((s) =>
          s.id === emptySeat.id
            ? { ...s, user: { id: action.userId, name: currentUser.name, image: currentUser.image } }
            : s
        );
      }
      return seats.map((s) =>
        s.user?.id === action.userId ? { ...s, user: null } : s
      );
    }
  );

  const occupiedCount = optimisticSeats.filter((s) => s.user).length;
  const isSeated = optimisticSeats.some((s) => s.user?.id === currentUser.id);
  const canDelete = table.createdBy.id === currentUser.id || isAdmin;

  // Members not already seated at this table
  const seatedUserIds = new Set(optimisticSeats.map((s) => s.user?.id).filter(Boolean));
  const availableMembers = partyMembers.filter((m) => !seatedUserIds.has(m.id));

  function handleJoin() {
    if (isSeated) {
      setShowInviteDialog(true);
      return;
    }
    startTransition(async () => {
      addOptimistic({ type: "join", userId: currentUser.id });
      await joinTable(table.id);
    });
  }

  function handleLeave() {
    startTransition(async () => {
      addOptimistic({ type: "leave", userId: currentUser.id });
      await leaveTable(table.id);
    });
  }

  function handleRemove(userId: string, userName: string | null) {
    if (!confirm(`Remove ${userName || "this player"} from the table?`)) return;
    startTransition(async () => {
      addOptimistic({ type: "leave", userId });
      await removeMemberFromTable(table.id, userId);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete the ${table.boardGameName} table?`)) return;
    startTransition(async () => {
      await deleteTable(table.id);
    });
  }

  // Layout calculations
  const totalSeats = table.maxPlayers;
  const containerSize = Math.max(240, Math.min(320, 200 + totalSeats * 12));
  const centerSize = Math.max(80, containerSize * 0.35);
  const seatRadius = containerSize * 0.42;
  const seatOverflow = 20; // space for seat avatar + label overflow

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Table visualization */}
      <div
        className="relative mx-auto"
        style={{
          width: containerSize,
          height: containerSize,
          padding: seatOverflow,
          boxSizing: "content-box",
        }}
      >
        {/* Center - board game image */}
        <div
          className="absolute rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 shadow-inner"
          style={{
            width: centerSize,
            height: centerSize,
            left: seatOverflow + containerSize / 2 - centerSize / 2,
            top: seatOverflow + containerSize / 2 - centerSize / 2,
          }}
        >
          {table.boardGameImage ? (
            <Image
              src={table.boardGameImage}
              alt={table.boardGameName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-center px-2 text-sm leading-tight">
              {table.boardGameName}
            </div>
          )}
        </div>

        {/* Table surface ring */}
        <div
          className="absolute rounded-full border-2 border-gray-100"
          style={{
            width: seatRadius * 1.6,
            height: seatRadius * 1.6,
            left: seatOverflow + containerSize / 2 - seatRadius * 0.8,
            top: seatOverflow + containerSize / 2 - seatRadius * 0.8,
            background: "radial-gradient(circle, transparent 60%, rgba(0,0,0,0.02) 100%)",
          }}
        />

        {/* Seats */}
        {optimisticSeats.map((seat, i) => {
          const angle = (i / totalSeats) * 2 * Math.PI - Math.PI / 2;
          const x = seatOverflow + containerSize / 2 + seatRadius * Math.cos(angle);
          const y = seatOverflow + containerSize / 2 + seatRadius * Math.sin(angle);

          return (
            <TableSeat
              key={seat.id}
              seat={seat}
              isCurrentUser={seat.user?.id === currentUser.id}
              style={{ left: x, top: y }}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onInvite={isSeated && !seat.user ? () => setShowInviteDialog(true) : undefined}
              onRemove={seat.user && seat.user.id !== currentUser.id && (table.createdBy.id === currentUser.id || isAdmin) ? () => handleRemove(seat.user!.id, seat.user!.name) : undefined}
            />
          );
        })}
      </div>

      {/* Info bar */}
      <div className="mt-3 text-center">
        <h4 className="font-semibold text-gray-900 text-sm">{table.boardGameName}</h4>
        <p className="text-xs text-gray-500 mt-0.5">
          {occupiedCount}/{table.maxPlayers} seated
          {isPending && " ..."}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          by {table.createdBy.name || "Unknown"}
        </span>
        <div className="flex gap-2">
          {!isSeated && occupiedCount < table.maxPlayers && (
            <button
              onClick={handleJoin}
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Join
            </button>
          )}
          {isSeated && occupiedCount < table.maxPlayers && (
            <button
              onClick={() => setShowInviteDialog(true)}
              disabled={isPending}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Add Member
            </button>
          )}
          {isSeated && (
            <button
              onClick={handleLeave}
              disabled={isPending}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Leave
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Invite dialog */}
      {showInviteDialog && (
        <InviteToTableDialog
          tableId={table.id}
          availableMembers={availableMembers}
          onClose={() => setShowInviteDialog(false)}
        />
      )}
    </div>
  );
}

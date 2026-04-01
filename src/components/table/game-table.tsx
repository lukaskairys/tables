"use client";

import { useState, useOptimistic, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { TableSeat } from "./table-seat";
import { InviteToTableDialog } from "./invite-to-table-dialog";
import { TableSettingsDialog } from "./table-settings-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
    boardGameBggId: number;
    boardGameName: string;
    boardGameImage: string | null;
    maxPlayers: number;
    comment: string | null;
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
  const [inviteSeatId, setInviteSeatId] = useState<string | undefined>(undefined);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const [optimisticSeats, addOptimistic] = useOptimistic(
    table.seats,
    (seats: Seat[], action: { type: "join" | "leave"; userId: string; seatId?: string }) => {
      if (action.type === "join") {
        return seats.map((s) =>
          s.id === action.seatId
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

  function handleJoin(seatId: string) {
    setJoinError(null);
    startTransition(async () => {
      addOptimistic({ type: "join", userId: currentUser.id, seatId });
      const result = await joinTable(table.id, seatId);
      if (!result.success) {
        setJoinError(result.error ?? "Failed to join");
      }
    });
  }

  function handleInvite(seatId: string) {
    setInviteSeatId(seatId);
    setShowInviteDialog(true);
  }

  function handleLeave() {
    startTransition(async () => {
      addOptimistic({ type: "leave", userId: currentUser.id });
      await leaveTable(table.id);
    });
  }

  function handleRemove(userId: string, userName: string | null) {
    setConfirmAction({
      title: "Remove player",
      message: `Remove ${userName || "this player"} from the table?`,
      confirmLabel: "Remove",
      onConfirm: () => {
        setConfirmAction(null);
        startTransition(async () => {
          addOptimistic({ type: "leave", userId });
          await removeMemberFromTable(table.id, userId);
        });
      },
    });
  }

  function handleDelete() {
    setConfirmAction({
      title: "Delete table",
      message: `Delete the ${table.boardGameName} table? This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: () => {
        setConfirmAction(null);
        startTransition(async () => {
          await deleteTable(table.id);
        });
      },
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
              onInvite={isSeated && !seat.user ? handleInvite : undefined}
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
        {table.comment && (
          <p className="text-xs text-gray-400 mt-1 italic">{table.comment}</p>
        )}
        {joinError && (
          <p className="text-xs text-red-500 mt-1">{joinError}</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          by {table.createdBy.name || "Unknown"}
        </span>
        <div className="flex gap-2">
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
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-gray-500 hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-10">
                  {occupiedCount < table.maxPlayers && (
                    <button
                      onClick={() => { setShowMenu(false); setInviteSeatId(undefined); setShowInviteDialog(true); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                        <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2.046 15.253c-.058.468.172.92.57 1.175A9.953 9.953 0 0 0 8 18c1.982 0 3.83-.578 5.384-1.573.398-.254.628-.707.57-1.175a6.001 6.001 0 0 0-11.908 0ZM16.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM14 13.5a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1Z" />
                      </svg>
                      Add Player
                    </button>
                  )}
                  <button
                    onClick={() => { setShowMenu(false); setShowSettingsDialog(true); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                      <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.993 6.993 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                    </svg>
                    Settings
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); handleDelete(); }}
                    disabled={isPending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite dialog */}
      {showInviteDialog && (
        <InviteToTableDialog
          tableId={table.id}
          seatId={inviteSeatId}
          availableMembers={availableMembers}
          onClose={() => setShowInviteDialog(false)}
        />
      )}

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          confirmVariant="danger"
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Settings dialog */}
      {showSettingsDialog && (
        <TableSettingsDialog
          table={{
            id: table.id,
            boardGameBggId: table.boardGameBggId,
            boardGameName: table.boardGameName,
            boardGameImage: table.boardGameImage,
            maxPlayers: table.maxPlayers,
            comment: table.comment,
          }}
          onClose={() => setShowSettingsDialog(false)}
        />
      )}
    </div>
  );
}

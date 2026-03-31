"use client";

import Image from "next/image";

interface TableSeatProps {
  seat: {
    id: string;
    seatNumber: number;
    user: { id: string; name: string | null; image: string | null } | null;
  };
  isCurrentUser: boolean;
  style: React.CSSProperties;
  onJoin: (seatId: string) => void;
  onLeave: () => void;
  onInvite?: (seatId: string) => void;
  onRemove?: () => void;
}

export function TableSeat({ seat, isCurrentUser, style, onJoin, onLeave, onInvite, onRemove }: TableSeatProps) {
  if (seat.user) {
    const isClickable = isCurrentUser || !!onRemove;

    return (
      <div
        className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
        style={style}
      >
        <button
          onClick={isCurrentUser ? onLeave : onRemove}
          className={`group relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border-2 transition ${
            isCurrentUser
              ? "border-blue-500 ring-2 ring-blue-200 cursor-pointer hover:ring-red-200 hover:border-red-400"
              : isClickable
              ? "border-gray-300 cursor-pointer hover:border-red-400 hover:ring-2 hover:ring-red-200"
              : "border-gray-300 cursor-default"
          }`}
          title={
            isCurrentUser
              ? "Click to leave"
              : onRemove
              ? `Click to remove ${seat.user.name || "player"}`
              : seat.user.name || "Player"
          }
        >
          {seat.user.image ? (
            <Image
              src={seat.user.image}
              alt={seat.user.name || ""}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">
              {seat.user.name?.[0] || "?"}
            </div>
          )}
          {isClickable && (
            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/60 flex items-center justify-center transition">
              <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100">
                {isCurrentUser ? "Leave" : "Remove"}
              </span>
            </div>
          )}
        </button>
        <span className="mt-1 text-[10px] text-gray-500 max-w-[56px] truncate text-center">
          {seat.user.name?.split(" ")[0] || "Player"}
        </span>
      </div>
    );
  }

  // Empty seat
  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
      style={style}
    >
      <button
        onClick={() => onInvite ? onInvite(seat.id) : onJoin(seat.id)}
        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 transition hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50"
        title={onInvite ? "Add a member" : "Join this seat"}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <span className="mt-1 text-[10px] text-gray-400">Empty</span>
    </div>
  );
}

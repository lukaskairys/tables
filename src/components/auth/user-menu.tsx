"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!session?.user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full p-1 transition hover:bg-gray-100"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || ""}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {session.user.name?.[0] || "?"}
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

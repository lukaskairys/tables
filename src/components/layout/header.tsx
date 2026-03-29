import Link from "next/link";
import { auth } from "@/lib/auth";
import { UserMenu } from "@/components/auth/user-menu";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">TableTop</span>
        </Link>

        <nav className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <UserMenu />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Plan Your Game Night
        </h1>
        <p className="mt-6 text-lg text-gray-600 leading-8">
          Organize board game parties, create events, and let everyone pick their
          seats at the table. Search from thousands of games and see who&apos;s
          playing what.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

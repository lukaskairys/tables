import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

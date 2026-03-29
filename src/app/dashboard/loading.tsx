export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-3">
          <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

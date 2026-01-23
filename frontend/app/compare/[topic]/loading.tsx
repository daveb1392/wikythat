export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8 animate-pulse">
        <div className="mx-auto h-10 w-3/4 rounded bg-gray-200"></div>
      </div>

      {/* Comparison panels skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Wikipedia skeleton */}
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="h-6 w-32 rounded bg-gray-200"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
          </div>
        </div>

        {/* Grokipedia skeleton */}
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="h-6 w-32 rounded bg-gray-200"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>

      {/* Grok analysis skeleton */}
      <div className="my-8 animate-pulse rounded-lg border-2 border-gray-200 bg-white p-8 shadow-xl">
        <div className="mb-6 space-y-2 text-center">
          <div className="mx-auto h-6 w-48 rounded bg-gray-200"></div>
          <div className="mx-auto h-4 w-32 rounded bg-gray-200"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-gray-200"></div>
          <div className="h-4 w-full rounded bg-gray-200"></div>
          <div className="h-4 w-2/3 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}

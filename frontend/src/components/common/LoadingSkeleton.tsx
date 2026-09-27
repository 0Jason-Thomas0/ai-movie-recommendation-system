export function MovieCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden shrink-0 w-36 md:w-44">
      <div className="skeleton aspect-[2/3] w-full" />
      <div className="mt-2 space-y-1 px-1">
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function MovieGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden">
          <div className="skeleton aspect-[2/3] w-full" />
          <div className="mt-2 space-y-1 px-1">
            <div className="skeleton h-3 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative min-h-[70vh] flex items-end pb-16">
      <div className="skeleton absolute inset-0" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-8 w-full space-y-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-12 w-96 rounded" />
        <div className="skeleton h-4 w-80 rounded" />
        <div className="skeleton h-4 w-64 rounded" />
        <div className="flex gap-3 mt-4">
          <div className="skeleton h-11 w-32 rounded-md" />
          <div className="skeleton h-11 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

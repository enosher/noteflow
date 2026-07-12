import Skeleton from '@/components/skeleton';

// Mirrors the real dashboard's shape: bare KPI strip over a ledger
// rule, then the 7/5 bento row, pill strip, and the 5/7 row - so the
// load doesn't jump when real content arrives.
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8">
      <Skeleton className="h-8 w-72" />

      {/* KPI strip - six bare label + numeral pairs, no card chrome */}
      <div className="mt-8 grid grid-cols-2 gap-y-6 border-b-4 border-double border-line/80 pb-6 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={i > 0 ? 'lg:border-l lg:border-line/70 lg:pl-5' : ''}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-8 w-14" />
          </div>
        ))}
      </div>

      {/* Row 1: recommendation card beside the 7-day chart */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Skeleton className="h-44 lg:col-span-7" />
        <Skeleton className="h-44 lg:col-span-5" />
      </div>

      {/* Weak-topic pill strip */}
      <Skeleton className="mt-4 h-12 w-full" />

      {/* Row 2: mastery breakdown beside the accuracy table */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Skeleton className="h-56 lg:col-span-5" />
        <Skeleton className="h-56 lg:col-span-7" />
      </div>
    </main>
  );
}

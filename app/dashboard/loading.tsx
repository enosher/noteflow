import Skeleton from '@/components/skeleton';

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <section>
        <Skeleton className="mb-3 h-6 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </section>

      <section>
        <Skeleton className="mb-3 h-6 w-40" />
        <Skeleton className="h-32 w-full" />
      </section>

      <section>
        <Skeleton className="mb-3 h-6 w-40" />
        <Skeleton className="h-32 w-full" />
      </section>
    </main>
  );
}
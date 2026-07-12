import Skeleton from '@/components/skeleton';

export default function ModuleDetailLoading() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Skeleton className="mb-4 h-4 w-40" />

      <div className="mt-4 flex items-start justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <Skeleton className="mt-4 h-4 w-3/4" />

      <div className="mb-4 mt-8 flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </main>
  );
}
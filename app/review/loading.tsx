import Skeleton from '@/components/skeleton';

export default function ReviewLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Skeleton className="mb-4 h-8 w-32" />
      <Skeleton className="mb-6 h-4 w-64" />
      <Skeleton className="h-64 w-full" />
    </main>
  );
}
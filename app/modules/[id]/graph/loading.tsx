import Skeleton from '@/components/skeleton';

export default function ConceptGraphLoading() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="mb-2 mt-4 h-8 w-64" />
      
      <div className="mb-6 mt-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      <Skeleton className="h-[600px] w-full" />
    </main>
  );
}
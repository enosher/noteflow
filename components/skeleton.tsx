export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden // purely decorative, so screen readers should skip it
      className={`animate-pulse rounded bg-line/40 ${className}`}
    />
  );
}
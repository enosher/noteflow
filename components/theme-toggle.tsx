'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';

function subscribe() {
  return () => {};
}

function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) return <div className="h-8 w-8" />;

  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-md border border-line bg-card px-2 py-1 text-sm text-ink"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
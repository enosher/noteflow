"use client";

// The row of links in the nav bar (Dashboard, Review, etc.), with the
// current page highlighted and a badge for due reviews.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function NavLinks({ dueCount = 0 }: { dueCount?: number }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const showBadge = item.href === "/review" && dueCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
              isActive
                ? "bg-brand/10 font-medium text-brand"
                : "text-muted hover:text-ink"
            }`}
          >
            {item.label}
            {showBadge && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white shadow-sm dark:text-black tabular-nums">
                {dueCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
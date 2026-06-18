"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              isActive
                ? "bg-[#E4F0EE] font-medium text-[#0F6B66]"
                : "text-[#6B6863] hover:text-[#1C1B1A]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
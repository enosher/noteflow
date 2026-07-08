import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { Zoom } from "./Zoom";
import LogoutButton from "@/app/dashboard/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

export async function NavBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <nav className="flex items-center justify-between border-b border-[#E7E4DF] bg-[#FAFAF9] px-6 py-3">
      <div className="flex items-center gap-6">
        {/* Icon and wordmark live side by side but aren't nested inside
            each other - Zoom is its own button, "NoteFlow" is its own
            link. Buttons inside links get weird across browsers. */}
        <div className="flex items-center gap-2">
          <Zoom />
          <Link
            href="/dashboard"
            className="text-[15px] font-semibold tracking-tight text-[#1C1B1A]"
          >
            NoteFlow
          </Link>
        </div>
        <NavLinks />
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </nav>
  );
}
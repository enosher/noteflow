// The top bar shown on every page once a user is logged in.
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { Zoom } from "./Zoom";
import LogoutButton from "@/app/dashboard/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDueReviewCount } from "@/app/review/actions";

export async function NavBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const dueCount = await getDueReviewCount();

  return (
    <nav className="flex items-center justify-between border-b border-[#E7E4DF] bg-[#FAFAF9] px-6 py-3">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Zoom />
          <Link
            href="/dashboard"
            className="text-[15px] font-semibold tracking-tight text-[#1C1B1A]"
          >
            NoteFlow
          </Link>
        </div>
        <NavLinks dueCount={dueCount} />
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </nav>
  );
}
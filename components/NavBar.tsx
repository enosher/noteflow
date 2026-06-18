import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { FlowMark } from "./FlowMark";
import LogoutButton from "@/app/dashboard/logout-button";

export async function NavBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <nav className="flex items-center justify-between border-b border-[#E7E4DF] bg-[#FAFAF9] px-6 py-3">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <FlowMark />
          <span className="text-[15px] font-semibold tracking-tight text-[#1C1B1A]">
            NoteFlow
          </span>
        </Link>
        <NavLinks />
      </div>
      <LogoutButton />
    </nav>
  );
}
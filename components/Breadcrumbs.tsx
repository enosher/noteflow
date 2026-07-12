// Shows the "Modules / Topic" trail of links at the top of a page.
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function Breadcrumbs({
  moduleId,
  topicId,
}: {
  moduleId?: string;
  topicId?: string;
}) {
  const supabase = await createClient();
  const crumbs: { label: string; href: string }[] = [{ label: "Modules", href: "/modules" }];

  if (moduleId) {
    const { data: mod } = await supabase.from("modules").select("code").eq("id", moduleId).single();
    crumbs.push({ label: mod?.code ?? "Module", href: `/modules/${moduleId}` });
  }

  if (topicId && moduleId) {
    const { data: topic } = await supabase.from("topics").select("name").eq("id", topicId).single();
    crumbs.push({ label: topic?.name ?? "Topic", href: `/modules/${moduleId}/topics/${topicId}` });
  }

  return (
    <nav className="mb-4 text-sm text-muted">
      {crumbs.map((c, i) => (
        <span key={c.href}>
          {i > 0 && <span className="mx-1.5 text-line">/</span>}
          {i === crumbs.length - 1 ? (
            <span className="text-ink">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-brand">{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
// The persistent left sidebar shown on every page once a user is
// logged in - a module -> topic -> (subtopic ->) note tree, so a user
// can always see where they are and jump between notes without going
// back through the topic page. Built in response to an M3 tester who
// named this as "the one change that would make me actually use this."
//
// Rendered from the root layout, above any dynamic route segment, so
// it fetches the whole tree itself rather than receiving ids as props.
// RLS on each table already scopes every query to the signed-in user
// (see the same pattern in app/modules/page.tsx), so no manual
// user_id filters are needed here either.
import { createClient } from "@/lib/supabase/server";
import { SidebarNav, type SidebarModuleData } from "./SidebarNav";

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [modulesRes, topicsRes, subtopicsRes, notesRes] = await Promise.all([
    supabase.from("modules").select("id, code, name").order("code"),
    supabase.from("topics").select("id, module_id, name, order_index").order("order_index"),
    supabase.from("subtopics").select("id, topic_id, name, order_index").order("order_index"),
    supabase.from("notes").select("id, title, topic_id, subtopic_id"),
  ]);

  const modules = modulesRes.data ?? [];
  const topics = topicsRes.data ?? [];
  const subtopics = subtopicsRes.data ?? [];
  const notes = notesRes.data ?? [];

  // Bucket everything by parent id once, up front, so building the
  // tree below is plain lookups instead of repeated array scans - same
  // grouping approach app/modules/[id]/topics/[topicId]/page.tsx
  // already uses for a single topic's subtopic notes.
  const notesByTopic = new Map<string, { id: string; title: string }[]>();
  const notesBySubtopic = new Map<string, { id: string; title: string }[]>();
  for (const n of notes) {
    if (n.subtopic_id) {
      const list = notesBySubtopic.get(n.subtopic_id) ?? [];
      list.push({ id: n.id, title: n.title });
      notesBySubtopic.set(n.subtopic_id, list);
    } else if (n.topic_id) {
      const list = notesByTopic.get(n.topic_id) ?? [];
      list.push({ id: n.id, title: n.title });
      notesByTopic.set(n.topic_id, list);
    }
  }

  const subtopicsByTopic = new Map<string, typeof subtopics>();
  for (const s of subtopics) {
    const list = subtopicsByTopic.get(s.topic_id) ?? [];
    list.push(s);
    subtopicsByTopic.set(s.topic_id, list);
  }

  const topicsByModule = new Map<string, typeof topics>();
  for (const t of topics) {
    const list = topicsByModule.get(t.module_id) ?? [];
    list.push(t);
    topicsByModule.set(t.module_id, list);
  }

  const tree: SidebarModuleData[] = modules.map((m) => ({
    id: m.id,
    code: m.code,
    name: m.name,
    topics: (topicsByModule.get(m.id) ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      notes: notesByTopic.get(t.id) ?? [],
      subtopics: (subtopicsByTopic.get(t.id) ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        notes: notesBySubtopic.get(s.id) ?? [],
      })),
    })),
  }));

  return (
    <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-line bg-card lg:block">
      <SidebarNav modules={tree} />
    </aside>
  );
}

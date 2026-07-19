"use client";

// The interactive part of the persistent left sidebar: an expandable
// module -> topic -> (subtopic ->) note tree, with the current page's
// branch auto-expanded and highlighted. Client component because it
// needs usePathname() - the root layout that renders <Sidebar> sits
// above every dynamic route segment, so there's no `params` prop to
// read the current moduleId/topicId/noteId from directly.
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarNoteData = { id: string; title: string };
export type SidebarSubtopicData = { id: string; name: string; notes: SidebarNoteData[] };
export type SidebarTopicData = {
  id: string;
  name: string;
  notes: SidebarNoteData[];
  subtopics: SidebarSubtopicData[];
};
export type SidebarModuleData = {
  id: string;
  code: string;
  name: string;
  topics: SidebarTopicData[];
};

function parseActiveIds(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  // ["modules", moduleId, "topics", topicId, "notes", noteId, ...]
  const moduleId = parts[0] === "modules" ? parts[1] : undefined;
  const topicId = parts[2] === "topics" ? parts[3] : undefined;
  const noteId = parts[4] === "notes" ? parts[5] : undefined;
  return { moduleId, topicId, noteId };
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-block text-muted transition-transform duration-150 ${open ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      ›
    </span>
  );
}

export function SidebarNav({ modules }: { modules: SidebarModuleData[] }) {
  const pathname = usePathname();
  const { moduleId: activeModuleId, topicId: activeTopicId, noteId: activeNoteId } =
    parseActiveIds(pathname);

  // `flipped` holds ids toggled away from their default open state,
  // rather than tracking "is open" directly - so a node on the active
  // path defaults to open with no effect needed to sync it on
  // navigation, and clicking still toggles it either way (including
  // collapsing the active branch itself, if the user wants to).
  const [flippedModules, setFlippedModules] = useState<Set<string>>(new Set());
  const [flippedTopics, setFlippedTopics] = useState<Set<string>>(new Set());

  function isOpen(id: string, isActive: boolean, flipped: Set<string>) {
    return isActive ? !flipped.has(id) : flipped.has(id);
  }

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSet(next);
  }

  if (modules.length === 0) {
    return (
      <p className="p-4 text-xs text-muted">
        No modules yet -{" "}
        <Link href="/modules/new" className="text-brand hover:underline">
          create one
        </Link>
        .
      </p>
    );
  }

  return (
    <nav className="p-3 text-sm" aria-label="Modules, topics, and notes">
      <ul className="space-y-0.5">
        {modules.map((m) => {
          const moduleActive = m.id === activeModuleId;
          const moduleOpen = isOpen(m.id, moduleActive, flippedModules);
          return (
            <li key={m.id}>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggle(flippedModules, setFlippedModules, m.id)}
                  aria-label={moduleOpen ? `Collapse ${m.code}` : `Expand ${m.code}`}
                  aria-expanded={moduleOpen}
                  className="flex h-5 w-5 shrink-0 items-center justify-center hover:text-ink"
                >
                  <Chevron open={moduleOpen} />
                </button>
                <Link
                  href={`/modules/${m.id}`}
                  title={m.name}
                  className={`min-w-0 flex-1 truncate rounded px-1.5 py-1 font-mono text-xs font-medium transition-colors ${
                    moduleActive ? "bg-brand/10 text-brand" : "text-ink hover:text-brand"
                  }`}
                >
                  {m.code}
                </Link>
              </div>

              {moduleOpen && (
                <ul className="ml-2.5 mt-0.5 space-y-0.5 border-l border-line/60 pl-2.5">
                  {m.topics.length === 0 && (
                    <li className="py-1 text-xs text-muted">No topics yet</li>
                  )}
                  {m.topics.map((t) => {
                    const topicActive = t.id === activeTopicId;
                    const topicOpen = isOpen(t.id, topicActive, flippedTopics);
                    const hasChildren = t.notes.length > 0 || t.subtopics.length > 0;
                    return (
                      <li key={t.id}>
                        <div className="flex items-center gap-1">
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggle(flippedTopics, setFlippedTopics, t.id)}
                              aria-label={topicOpen ? `Collapse ${t.name}` : `Expand ${t.name}`}
                              aria-expanded={topicOpen}
                              className="flex h-5 w-5 shrink-0 items-center justify-center hover:text-ink"
                            >
                              <Chevron open={topicOpen} />
                            </button>
                          ) : (
                            <span className="h-5 w-5 shrink-0" aria-hidden="true" />
                          )}
                          <Link
                            href={`/modules/${m.id}/topics/${t.id}`}
                            title={t.name}
                            className={`min-w-0 flex-1 truncate rounded px-1.5 py-1 transition-colors ${
                              topicActive ? "bg-brand/10 font-medium text-brand" : "text-ink hover:text-brand"
                            }`}
                          >
                            {t.name}
                          </Link>
                        </div>

                        {topicOpen && hasChildren && (
                          <ul className="ml-2.5 mt-0.5 space-y-0.5 border-l border-line/60 pl-2.5">
                            {t.notes.map((n) => (
                              <li key={n.id}>
                                <Link
                                  href={`/modules/${m.id}/topics/${t.id}/notes/${n.id}`}
                                  title={n.title}
                                  className={`block truncate rounded px-1.5 py-1 text-xs transition-colors ${
                                    n.id === activeNoteId
                                      ? "bg-brand/10 font-medium text-brand"
                                      : "text-muted hover:text-brand"
                                  }`}
                                >
                                  {n.title}
                                </Link>
                              </li>
                            ))}
                            {t.subtopics.map((s) => (
                              <li key={s.id}>
                                <Link
                                  href={`/modules/${m.id}/topics/${t.id}/subtopics/${s.id}/edit`}
                                  title={s.name}
                                  className="block truncate rounded px-1.5 py-1 text-xs italic text-muted transition-colors hover:text-brand"
                                >
                                  {s.name}
                                </Link>
                                {s.notes.length > 0 && (
                                  <ul className="ml-2.5 space-y-0.5 border-l border-line/60 pl-2.5">
                                    {s.notes.map((n) => (
                                      <li key={n.id}>
                                        <Link
                                          href={`/modules/${m.id}/topics/${t.id}/notes/${n.id}`}
                                          title={n.title}
                                          className={`block truncate rounded px-1.5 py-1 text-xs transition-colors ${
                                            n.id === activeNoteId
                                              ? "bg-brand/10 font-medium text-brand"
                                              : "text-muted hover:text-brand"
                                          }`}
                                        >
                                          {n.title}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

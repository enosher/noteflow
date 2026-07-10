"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { topologicalLevels, type PrereqEdge } from "@/lib/prereq";
import { masteryTone } from "@/components/mastery-dot";
import { addPrerequisite, removePrerequisite, type GraphTopic, type ModuleGraph } from "./actions";

const NODE_R = 30;
const COL_W = 200;
const ROW_H = 110;
const PAD = 60;
const DRAG_THRESHOLD = 4; // px of movement before a pointer-down counts as a drag, not a click

type Point = { x: number; y: number };

// Column-by-level, row-by-order-within-level: a cheap DAG layout that
// reads left-to-right as "earlier concepts first" without needing a
// physics simulation. Positions are just a starting point; users can
// drag from there.
function initialLayout(topics: GraphTopic[], edges: PrereqEdge[]): Record<string, Point> {
  const levels = topologicalLevels(topics.map((t) => t.id), edges);
  const countAtLevel = new Map<number, number>();
  const positions: Record<string, Point> = {};

  for (const t of topics) {
    const level = levels.get(t.id) ?? 0;
    const row = countAtLevel.get(level) ?? 0;
    countAtLevel.set(level, row + 1);
    positions[t.id] = { x: PAD + level * COL_W, y: PAD + row * ROW_H };
  }
  return positions;
}

export default function GraphView({
  moduleId,
  initialGraph,
}: {
  moduleId: string;
  initialGraph: ModuleGraph;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const svgRef = useRef<SVGSVGElement>(null);

  const [positions, setPositions] = useState<Record<string, Point>>(() =>
    initialLayout(initialGraph.topics, initialGraph.edges)
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const dragStart = useRef<{ pointer: Point; node: Point } | null>(null);
  const didDrag = useRef(false);

  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const blocked = useMemo(() => new Set(initialGraph.blocked), [initialGraph.blocked]);

  const width = useMemo(
    () => Math.max(...Object.values(positions).map((p) => p.x), 0) + PAD + NODE_R,
    [positions]
  );
  const height = useMemo(
    () => Math.max(...Object.values(positions).map((p) => p.y), 0) + PAD + NODE_R,
    [positions]
  );

  function toSvgPoint(clientX: number, clientY: number): Point {
    const rect = svgRef.current!.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function onNodePointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragStart.current = { pointer: toSvgPoint(e.clientX, e.clientY), node: positions[id] };
    didDrag.current = false;
    setDragId(id);
  }

  function onNodePointerMove(e: React.PointerEvent) {
    if (!dragId || !dragStart.current) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    const dx = p.x - dragStart.current.pointer.x;
    const dy = p.y - dragStart.current.pointer.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) didDrag.current = true;
    setPositions((prev) => ({
      ...prev,
      [dragId]: { x: dragStart.current!.node.x + dx, y: dragStart.current!.node.y + dy },
    }));
  }

  function onNodePointerUp(id: string) {
    if (!didDrag.current) handleNodeClick(id);
    setDragId(null);
    dragStart.current = null;
  }

  // Click-to-connect: first click marks a prerequisite candidate, a
  // second click on a different node submits the edge (candidate ->
  // clicked). Clicking the same node again cancels the selection.
  function handleNodeClick(id: string) {
    setError(null);
    if (!selectedSource) {
      setSelectedSource(id);
      return;
    }
    if (selectedSource === id) {
      setSelectedSource(null);
      return;
    }
    const prerequisiteId = selectedSource;
    const topicId = id;
    setSelectedSource(null);
    startTransition(async () => {
      const res = await addPrerequisite(moduleId, topicId, prerequisiteId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  function handleRemoveEdge(edge: PrereqEdge) {
    setError(null);
    startTransition(async () => {
      const res = await removePrerequisite(moduleId, edge.topic_id, edge.prerequisite_topic_id);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-6">
      <style>{`
        @keyframes graph-marching-ants {
          to { stroke-dashoffset: -16; }
        }
        .graph-blocked-ring {
          animation: graph-marching-ants 0.6s linear infinite;
        }
        @keyframes graph-node-pop {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .graph-node {
          animation: graph-node-pop 0.25s ease-out;
          transform-box: fill-box;
          transform-origin: center;
          cursor: grab;
        }
        .graph-node:active { cursor: grabbing; }
      `}</style>

      {error && (
        <p className="mb-3 rounded border border-line bg-card px-3 py-2 text-sm text-[var(--mastery-weak)]">
          {error}
        </p>
      )}

      <div className="overflow-auto rounded-lg border border-line bg-card">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="select-none"
          onPointerMove={onNodePointerMove}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-muted)" />
            </marker>
          </defs>

          {initialGraph.edges.map((edge, i) => {
            const from = positions[edge.prerequisite_topic_id];
            const to = positions[edge.topic_id];
            if (!from || !to) return null;
            // Shorten the line so the arrowhead lands on the node's rim,
            // not its center.
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.hypot(dx, dy) || 1;
            const x2 = to.x - (dx / len) * (NODE_R + 4);
            const y2 = to.y - (dy / len) * (NODE_R + 4);
            return (
              <g key={`${edge.topic_id}-${edge.prerequisite_topic_id}`}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={x2}
                  y2={y2}
                  stroke="var(--color-muted)"
                  strokeWidth={hoveredEdge === i ? 3 : 1.5}
                  markerEnd="url(#arrow)"
                  onPointerEnter={() => setHoveredEdge(i)}
                  onPointerLeave={() => setHoveredEdge(null)}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleRemoveEdge(edge)}
                />
                {hoveredEdge === i && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--mastery-weak)"
                  >
                    click to remove
                  </text>
                )}
              </g>
            );
          })}

          {initialGraph.topics.map((t) => {
            const p = positions[t.id];
            if (!p) return null;
            const tone = masteryTone(t.accuracy, t.attempts);
            const isBlocked = blocked.has(t.id);
            const isSelected = selectedSource === t.id;
            return (
              <g
                key={t.id}
                className="graph-node"
                transform={`translate(${p.x}, ${p.y})`}
                onPointerDown={(e) => onNodePointerDown(e, t.id)}
                onPointerUp={() => onNodePointerUp(t.id)}
              >
                {isBlocked && (
                  <circle
                    r={NODE_R + 6}
                    fill="none"
                    stroke="var(--mastery-weak)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    className="graph-blocked-ring"
                  />
                )}
                <circle
                  r={NODE_R}
                  fill={`var(--mastery-${tone})`}
                  stroke={isSelected ? "var(--color-brand)" : "var(--color-card)"}
                  strokeWidth={isSelected ? 4 : 2}
                />
                <text
                  y={NODE_R + 16}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--color-ink)"
                  style={{ pointerEvents: "none" }}
                >
                  {t.name.length > 16 ? `${t.name.slice(0, 15)}…` : t.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--mastery-untested)" }} />
          Not tested
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--mastery-weak)" }} />
          Weak
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--mastery-mid)" }} />
          Improving
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--mastery-strong)" }} />
          Strong
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-dashed" style={{ borderColor: "var(--mastery-weak)" }} />
          Blocked by a weak prerequisite
        </span>
        {isPending && <span>Saving…</span>}
      </div>
    </div>
  );
}

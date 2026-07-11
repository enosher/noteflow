"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { type PrereqEdge } from "@/lib/prereq";
import {
  DEFAULT_PARAMS,
  graphBounds,
  reachableFrom,
  seedLayout,
  stepSimulation,
  type SimNode,
} from "@/lib/graph-layout";
import { masteryTone, MasteryDot, type MasteryTone } from "@/components/mastery-dot";
import { addPrerequisite, removePrerequisite, type ModuleGraph } from "./actions";

const NODE_R = 30;
const VIEW_HEIGHT = 560; // px; fixed so the canvas feels like a stage, not a page that grows
const FIT_PAD = 70;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const DRAG_THRESHOLD = 4; // px of movement before a pointer-down counts as a drag, not a click
const SETTLE_THRESHOLD = 0.08; // max node movement (world px/tick) below which the sim sleeps
const ALPHA_DECAY = 0.975;
const MINIMAP_W = 150;
const MINIMAP_H = 100;

// Wrap a topic name onto up to two centred lines instead of chopping it
// at 16 chars. "Data Visualisation" deserves better than "Data Visualizat…";
// only names that overflow both lines get an ellipsis.
function wrapLabel(name: string, maxChars = 14): string[] {
  const words = name.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxChars || !current) {
      current = candidate; // fits, or a single word we can't split anyway
    } else if (lines.length === 0) {
      lines.push(current); // start line two
      current = w;
    } else {
      current = candidate; // line two overflows; trimmed below
    }
  }
  lines.push(current);
  return lines.map((l) => (l.length > maxChars + 2 ? `${l.slice(0, maxChars + 1)}…` : l));
}

// Hover-card wording; deliberately not MasteryDot's tooltip labels.
const TONE_LABEL: Record<MasteryTone, string> = {
  untested: "Not tested yet",
  weak: "Weak — needs practice",
  mid: "Improving",
  strong: "Strong",
};

type Transform = { x: number; y: number; k: number };

export default function GraphView({
  moduleId,
  initialGraph,
}: {
  moduleId: string;
  initialGraph: ModuleGraph;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Two node arrays, on purpose: the sim mutates a private working array
  // in rAF callbacks, then publishes an immutable snapshot per tick.
  // Render only touches the snapshot - the no-refs-during-render rule is
  // satisfied for real, not silenced.
  const [renderNodes, setRenderNodes] = useState<SimNode[]>(() =>
    seedLayout(
      initialGraph.topics.map((t) => t.id),
      initialGraph.edges
    )
  );
  const simNodes = useRef<SimNode[] | null>(null);
  const alphaRef = useRef(1);
  const rafRef = useRef<number | null>(null);

  // State renders; the ref feeds pointer handlers. Written together, never in render.
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const transformRef = useRef(transform);
  const applyTransform = useCallback((t: Transform) => {
    transformRef.current = t;
    setTransform(t);
  }, []);
  const fitAnimRef = useRef<number | null>(null);

  // Tracked so layout math never reads a ref mid-render.
  const [containerWidth, setContainerWidth] = useState(0);
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Drag bookkeeping needs no renders; anything drawn lives in state.
  const gesture = useRef<
    | { mode: "node"; id: string; startPointer: { x: number; y: number }; didDrag: boolean }
    | { mode: "pan"; startPointer: { x: number; y: number }; startTransform: Transform }
    | null
  >(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const blocked = useMemo(() => new Set(initialGraph.blocked), [initialGraph.blocked]);
  const topicsById = useMemo(
    () => new Map(initialGraph.topics.map((t) => [t.id, t])),
    [initialGraph.topics]
  );

  // Everything upstream and downstream of the hovered node. A weak topic
  // three levels back should visibly reach the cursor - that's the point.
  const chain = useMemo(() => {
    if (!hoveredId) return null;
    const up = reachableFrom(initialGraph.edges, hoveredId, "up");
    const down = reachableFrom(initialGraph.edges, hoveredId, "down");
    return { up, down, all: new Set([hoveredId, ...up, ...down]) };
  }, [hoveredId, initialGraph.edges]);

  function edgeInChain(e: PrereqEdge): boolean {
    if (!chain) return false;
    const upSide = new Set([hoveredId!, ...chain.up]);
    const downSide = new Set([hoveredId!, ...chain.down]);
    // On-chain = both ends on the same side of the hovered node.
    return (
      (upSide.has(e.topic_id) && upSide.has(e.prerequisite_topic_id)) ||
      (downSide.has(e.topic_id) && downSide.has(e.prerequisite_topic_id))
    );
  }

  // ---- simulation loop -------------------------------------------------

  const publish = useCallback(() => {
    setRenderNodes(simNodes.current!.map((n) => ({ ...n })));
  }, []);

  const runSimulation = useCallback(() => {
    if (rafRef.current !== null) return; // already running
    const loop = () => {
      const nodes = simNodes.current!;
      const pinned = gesture.current?.mode === "node" ? gesture.current.id : null;
      const moved = stepSimulation(nodes, initialGraph.edges, alphaRef.current, DEFAULT_PARAMS, pinned);
      alphaRef.current *= ALPHA_DECAY;
      publish();
      // Tick while hot; a drag holds the sim awake.
      if ((moved > SETTLE_THRESHOLD && alphaRef.current > 0.005) || pinned) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [initialGraph.edges, publish]);

  const reheat = useCallback(
    (alpha: number) => {
      alphaRef.current = Math.max(alphaRef.current, alpha);
      runSimulation();
    },
    [runSimulation]
  );

  // ---- viewport: fit, zoom, pan ---------------------------------------

  const animateTo = useCallback(
    (target: Transform) => {
      if (fitAnimRef.current !== null) cancelAnimationFrame(fitAnimRef.current);
      const from = { ...transformRef.current };
      const start = performance.now();
      const DURATION = 350;
      const step = (now: number) => {
        const t = Math.min((now - start) / DURATION, 1);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic: fast start, soft landing
        applyTransform({
          x: from.x + (target.x - from.x) * ease,
          y: from.y + (target.y - from.y) * ease,
          k: from.k + (target.k - from.k) * ease,
        });
        if (t < 1) fitAnimRef.current = requestAnimationFrame(step);
        else fitAnimRef.current = null;
      };
      fitAnimRef.current = requestAnimationFrame(step);
    },
    [applyTransform]
  );

  const fitView = useCallback(
    (animate: boolean) => {
      const el = containerRef.current;
      const nodes = simNodes.current;
      if (!el || !nodes || nodes.length === 0) return;
      const { minX, minY, maxX, maxY } = graphBounds(nodes, FIT_PAD);
      const bw = Math.max(maxX - minX, 1);
      const bh = Math.max(maxY - minY, 1);
      // Cap at 1.1: a two-node graph blown up to 560px looks silly.
      const k = Math.min(el.clientWidth / bw, VIEW_HEIGHT / bh, 1.1);
      const target = {
        k,
        x: (el.clientWidth - bw * k) / 2 - minX * k,
        y: (VIEW_HEIGHT - bh * k) / 2 - minY * k,
      };
      if (animate) animateTo(target);
      else applyTransform(target);
    },
    [animateTo, applyTransform]
  );

  // First paint: a burst of synchronous ticks so the raw seed grid is
  // never seen, then fit and hand off to the loop.
  const didInit = useRef(false);
  useLayoutEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    simNodes.current = renderNodes.map((n) => ({ ...n }));
    for (let i = 0; i < 40; i++) {
      stepSimulation(simNodes.current, initialGraph.edges, alphaRef.current, DEFAULT_PARAMS);
      alphaRef.current *= ALPHA_DECAY;
    }
    publish();
    fitView(false);
    runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fresh graph from the server: survivors keep their positions, newcomers
  // get seeded, and a gentle reheat ripples the change in - no jarring reset.
  const graphKey = useRef(initialGraph);
  useEffect(() => {
    if (graphKey.current === initialGraph || !simNodes.current) return;
    graphKey.current = initialGraph;
    const old = new Map(simNodes.current.map((n) => [n.id, n]));
    const seeded = seedLayout(
      initialGraph.topics.map((t) => t.id),
      initialGraph.edges
    );
    simNodes.current = seeded.map((n) => {
      const prev = old.get(n.id);
      // Trust the new level, keep the old position.
      return prev ? { ...n, x: prev.x, y: prev.y } : n;
    });
    publish();
    reheat(0.5);
  }, [initialGraph, publish, reheat]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (fitAnimRef.current !== null) cancelAnimationFrame(fitAnimRef.current);
    };
  }, []);

  const zoomAt = useCallback(
    (cx: number, cy: number, factor: number) => {
      const t = transformRef.current;
      const k = Math.min(Math.max(t.k * factor, MIN_ZOOM), MAX_ZOOM);
      if (k === t.k) return;
      // Hold the world point under the cursor still while scale changes.
      applyTransform({
        k,
        x: cx - ((cx - t.x) / t.k) * k,
        y: cy - ((cy - t.y) / t.k) * k,
      });
    },
    [applyTransform]
  );

  // React's wheel listeners are passive; preventDefault needs a native bind.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      // Trackpad pinch arrives as ctrl+wheel.
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002));
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  function localPoint(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function toWorld(p: { x: number; y: number }): { x: number; y: number } {
    const t = transformRef.current;
    return { x: (p.x - t.x) / t.k, y: (p.y - t.y) / t.k };
  }

  // ---- pointer gestures -------------------------------------------------

  function onBackgroundPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    gesture.current = {
      mode: "pan",
      startPointer: localPoint(e),
      startTransform: { ...transformRef.current },
    };
    setIsPanning(true);
  }

  function onNodePointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    gesture.current = { mode: "node", id, startPointer: localPoint(e), didDrag: false };
    setDragId(id);
    setHoveredId(null); // a hover card mid-drag is just noise
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gesture.current;
    const p = localPoint(e);

    if (!g) {
      if (hoveredId) setHoverPos(p); // track the pointer for the hover card
      return;
    }

    if (g.mode === "pan") {
      applyTransform({
        ...g.startTransform,
        x: g.startTransform.x + (p.x - g.startPointer.x),
        y: g.startTransform.y + (p.y - g.startPointer.y),
      });
      return;
    }

    const dx = p.x - g.startPointer.x;
    const dy = p.y - g.startPointer.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) g.didDrag = true;
    if (g.didDrag && simNodes.current) {
      const w = toWorld(p);
      const node = simNodes.current.find((n) => n.id === g.id);
      if (node) {
        node.x = w.x;
        node.y = w.y;
      }
      reheat(0.3); // neighbours keep flowing around the drag
    }
  }

  function onPointerUp() {
    const g = gesture.current;
    gesture.current = null;
    setDragId(null);
    setIsPanning(false);
    if (g?.mode === "node") {
      if (!g.didDrag) handleNodeClick(g.id);
      else reheat(0.3); // one last ripple as the node settles
    }
  }

  // Click-to-connect: first click picks the prerequisite, a second click
  // on another node submits the edge; the same node again cancels.
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

  // ---- rendering (everything below reads only state, never refs) --------

  const positions = new Map(renderNodes.map((n) => [n.id, n]));

  // Horizontal-leaning bezier, trimmed to the target's rim. Straight lines
  // read as clutter; curves read as flow.
  function edgePath(from: SimNode, to: SimNode): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const tx = to.x - (dx / len) * (NODE_R + 6);
    const ty = to.y - (dy / len) * (NODE_R + 6);
    const bend = Math.max(Math.abs(dx) / 2, 50);
    return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${tx - bend} ${ty}, ${tx} ${ty}`;
  }

  const hoveredTopic = hoveredId ? topicsById.get(hoveredId) : null;

  // Minimap: world bounds in a fixed 150x100 box, plus the visible rect.
  // Recomputed per render - a handful of multiplications.
  const mmBounds = graphBounds(renderNodes, 50);
  const mmScale = Math.min(
    MINIMAP_W / Math.max(mmBounds.maxX - mmBounds.minX, 1),
    MINIMAP_H / Math.max(mmBounds.maxY - mmBounds.minY, 1)
  );
  const mmOffX = (MINIMAP_W - (mmBounds.maxX - mmBounds.minX) * mmScale) / 2;
  const mmOffY = (MINIMAP_H - (mmBounds.maxY - mmBounds.minY) * mmScale) / 2;
  const mmProject = (x: number, y: number) => ({
    x: mmOffX + (x - mmBounds.minX) * mmScale,
    y: mmOffY + (y - mmBounds.minY) * mmScale,
  });
  const mmViewTL = mmProject((0 - transform.x) / transform.k, (0 - transform.y) / transform.k);
  const mmViewBR = mmProject(
    (containerWidth - transform.x) / transform.k,
    (VIEW_HEIGHT - transform.y) / transform.k
  );

  function onMinimapClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    // Invert the projection, then center the main view there.
    const wx = (e.clientX - rect.left - mmOffX) / mmScale + mmBounds.minX;
    const wy = (e.clientY - rect.top - mmOffY) / mmScale + mmBounds.minY;
    const t = transformRef.current;
    animateTo({
      k: t.k,
      x: containerWidth / 2 - wx * t.k,
      y: VIEW_HEIGHT / 2 - wy * t.k,
    });
  }

  const showMinimap = initialGraph.topics.length > 4 && containerWidth > 0;

  return (
    <div className="mt-6">
      <style>{`
        @keyframes graph-marching-ants {
          to { stroke-dashoffset: -16; }
        }
        .graph-blocked-ring, .graph-chain-edge {
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
        .graph-node circle.graph-node-body {
          transition: r 0.15s ease-out;
        }
        .graph-dim {
          opacity: 0.14;
          transition: opacity 0.15s ease-out;
        }
        .graph-lit {
          opacity: 1;
          transition: opacity 0.15s ease-out;
        }
      `}</style>

      {error && (
        <p className="mb-3 rounded border border-line bg-card px-3 py-2 text-sm text-[var(--mastery-weak)]">
          {error}
        </p>
      )}

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border border-line bg-card"
        style={{ height: VIEW_HEIGHT, touchAction: "none" }}
      >
        <svg
          className="h-full w-full select-none"
          style={{ cursor: isPanning ? "grabbing" : "default" }}
          onPointerDown={onBackgroundPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
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
            <marker
              id="arrow-lit"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-brand)" />
            </marker>
            {/* Subtle lift; heavier halos go muddy in dark mode. */}
            <filter id="node-shadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodOpacity="0.25" />
            </filter>
            {/* The quiet "this is a canvas" cue; world coords, so it zooms. */}
            <pattern id="dot-grid" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1.2" cy="1.2" r="1.2" fill="var(--color-line)" opacity="0.55" />
            </pattern>
          </defs>

          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
            <rect
              x={mmBounds.minX - 2000}
              y={mmBounds.minY - 2000}
              width={mmBounds.maxX - mmBounds.minX + 4000}
              height={mmBounds.maxY - mmBounds.minY + 4000}
              fill="url(#dot-grid)"
              style={{ pointerEvents: "none" }}
            />

            {initialGraph.edges.map((edge, i) => {
              const from = positions.get(edge.prerequisite_topic_id);
              const to = positions.get(edge.topic_id);
              if (!from || !to) return null;
              const lit = edgeInChain(edge);
              const dimmed = chain !== null && !lit;
              const d = edgePath(from, to);
              return (
                <g
                  key={`${edge.topic_id}-${edge.prerequisite_topic_id}`}
                  className={dimmed ? "graph-dim" : "graph-lit"}
                >
                  {/* Fat invisible twin - edge hover shouldn't demand pixel-perfect aim. */}
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    style={{ cursor: "pointer" }}
                    onPointerEnter={() => setHoveredEdge(i)}
                    onPointerLeave={() => setHoveredEdge(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveEdge(edge);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke={lit ? "var(--color-brand)" : "var(--color-muted)"}
                    strokeWidth={hoveredEdge === i ? 3 : lit ? 2.25 : 1.5}
                    strokeDasharray={lit ? "6 4" : undefined}
                    className={lit ? "graph-chain-edge" : undefined}
                    markerEnd={lit ? "url(#arrow-lit)" : "url(#arrow)"}
                    style={{ pointerEvents: "none" }}
                  />
                  {hoveredEdge === i && (
                    <text
                      x={(from.x + to.x) / 2}
                      y={(from.y + to.y) / 2 - 8}
                      textAnchor="middle"
                      fontSize="11"
                      fill="var(--mastery-weak)"
                      style={{ pointerEvents: "none" }}
                    >
                      click to remove
                    </text>
                  )}
                </g>
              );
            })}

            {initialGraph.topics.map((t) => {
              const p = positions.get(t.id);
              if (!p) return null;
              const tone = masteryTone(t.accuracy, t.attempts);
              const isBlocked = blocked.has(t.id);
              const isSelected = selectedSource === t.id;
              const dimmed = chain !== null && !chain.all.has(t.id);
              const isDragging = dragId === t.id;
              return (
                <g
                  key={t.id}
                  className={`graph-node ${dimmed ? "graph-dim" : "graph-lit"}`}
                  transform={`translate(${p.x}, ${p.y})`}
                  onPointerDown={(e) => onNodePointerDown(e, t.id)}
                  onPointerEnter={(e) => {
                    if (!gesture.current) {
                      setHoveredId(t.id);
                      // Seed now - waiting for pointermove hides the card if the pointer stops dead.
                      setHoverPos(localPoint(e));
                    }
                  }}
                  onPointerLeave={() => setHoveredId((h) => (h === t.id ? null : h))}
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
                    className="graph-node-body"
                    r={hoveredId === t.id || isDragging ? NODE_R + 3 : NODE_R}
                    fill={`var(--mastery-${tone})`}
                    stroke={isSelected ? "var(--color-brand)" : "var(--color-card)"}
                    strokeWidth={isSelected ? 4 : 2}
                    filter="url(#node-shadow)"
                  />
                  {/* Answers "how am I doing?" at a glance, no hover needed. */}
                  {t.attempts > 0 && t.accuracy !== null && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="13"
                      fontWeight="600"
                      fill="#fff"
                      style={{ pointerEvents: "none" }}
                    >
                      {Math.round(t.accuracy * 100)}%
                    </text>
                  )}
                  <text
                    y={NODE_R + 18}
                    textAnchor="middle"
                    fontSize="12"
                    fill="var(--color-ink)"
                    style={{ pointerEvents: "none" }}
                  >
                    {wrapLabel(t.name).map((line, li) => (
                      <tspan key={li} x={0} dy={li === 0 ? 0 : 14}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Three literal buttons: the refs lint can't follow closures
            through a mapped tuple array. */}
        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-md border border-line bg-card shadow-sm">
          <button
            type="button"
            title="Zoom in"
            aria-label="Zoom in"
            onClick={() => zoomAt(containerWidth / 2, VIEW_HEIGHT / 2, 1.3)}
            className="h-8 w-8 border-b border-line text-sm text-ink hover:bg-surface"
          >
            +
          </button>
          <button
            type="button"
            title="Zoom out"
            aria-label="Zoom out"
            onClick={() => zoomAt(containerWidth / 2, VIEW_HEIGHT / 2, 1 / 1.3)}
            className="h-8 w-8 border-b border-line text-sm text-ink hover:bg-surface"
          >
            −
          </button>
          <button
            type="button"
            title="Fit graph to view"
            aria-label="Fit graph to view"
            onClick={() => fitView(true)}
            className="h-8 w-8 text-sm text-ink hover:bg-surface"
          >
            ⛶
          </button>
        </div>

        {/* Only when big enough to lose your place; on 3 nodes it's furniture. */}
        {showMinimap && (
          <svg
            width={MINIMAP_W}
            height={MINIMAP_H}
            onClick={onMinimapClick}
            className="absolute bottom-3 right-3 cursor-pointer rounded-md border border-line shadow-sm"
            style={{ background: "var(--color-surface)" }}
          >
            {initialGraph.edges.map((e) => {
              const from = positions.get(e.prerequisite_topic_id);
              const to = positions.get(e.topic_id);
              if (!from || !to) return null;
              const a = mmProject(from.x, from.y);
              const b = mmProject(to.x, to.y);
              return (
                <line
                  key={`${e.topic_id}-${e.prerequisite_topic_id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--color-line)"
                  strokeWidth={1}
                />
              );
            })}
            {initialGraph.topics.map((t) => {
              const p = positions.get(t.id);
              if (!p) return null;
              const m = mmProject(p.x, p.y);
              return (
                <circle
                  key={t.id}
                  cx={m.x}
                  cy={m.y}
                  r={3}
                  fill={`var(--mastery-${masteryTone(t.accuracy, t.attempts)})`}
                />
              );
            })}
            <rect
              x={mmViewTL.x}
              y={mmViewTL.y}
              width={Math.max(mmViewBR.x - mmViewTL.x, 4)}
              height={Math.max(mmViewBR.y - mmViewTL.y, 4)}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth={1.5}
              rx={2}
            />
          </svg>
        )}

        {/* "Why is this node that colour?" - pointer-events: none so it
            never steals the hover that summoned it. */}
        {hoveredTopic && hoverPos && !dragId && (
          <div
            className="pointer-events-none absolute z-10 w-56 rounded-md border border-line bg-card p-3 shadow-lg"
            style={{
              left: Math.min(hoverPos.x + 18, Math.max(containerWidth - 240, 0)),
              top: Math.min(hoverPos.y + 12, VIEW_HEIGHT - 130),
            }}
          >
            <p className="text-sm font-semibold text-ink">{hoveredTopic.name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <MasteryDot accuracy={hoveredTopic.accuracy} attempts={hoveredTopic.attempts} />
              {TONE_LABEL[masteryTone(hoveredTopic.accuracy, hoveredTopic.attempts)]}
            </p>
            {hoveredTopic.attempts > 0 && hoveredTopic.accuracy !== null ? (
              <p className="mt-1 text-xs text-muted">
                {Math.round(hoveredTopic.accuracy * 100)}% accuracy · {hoveredTopic.attempts}{" "}
                attempt{hoveredTopic.attempts === 1 ? "" : "s"}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted">No quiz attempts yet</p>
            )}
            {blocked.has(hoveredTopic.id) && (
              <p className="mt-1 text-xs" style={{ color: "var(--mastery-weak)" }}>
                Gated: a prerequisite is weak — practice that first.
              </p>
            )}
            {selectedSource && selectedSource !== hoveredTopic.id && (
              <p className="mt-1 text-xs" style={{ color: "var(--color-brand)" }}>
                Click to make “{topicsById.get(selectedSource)?.name}” a prerequisite of this.
              </p>
            )}
          </div>
        )}
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

// A tiny static "concept graph" - the same idea that drives the real
// graph page (topics as nodes, mastery as color, prerequisites as
// lines) - reused as the auth pages' visual signature.
export function GraphMotif() {
  const nodes = [
    { x: 40, y: 30, tone: 'strong' },
    { x: 150, y: 12, tone: 'mid' },
    { x: 245, y: 60, tone: 'weak' },
    { x: 100, y: 110, tone: 'mid' },
    { x: 220, y: 145, tone: 'untested' },
    { x: 25, y: 175, tone: 'strong' },
  ] as const

  const edges: [number, number][] = [
    [0, 1], [1, 2], [0, 3], [1, 3], [3, 4], [3, 5],
  ]

  return (
    <svg viewBox="0 0 270 200" className="h-full w-full" aria-hidden="true">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="#EDE8DF"
          strokeOpacity={0.22}
          strokeWidth={1.5}
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={10}
          fill={`var(--mastery-${n.tone})`}
        />
      ))}
    </svg>
  )
}

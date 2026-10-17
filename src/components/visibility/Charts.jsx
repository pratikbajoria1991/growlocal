// Small, dependency-free charts for visibility tracking. Server-renderable.
// Rank cells carry their number (never colour alone); one green ramp, darker
// = better; trend lines are single-series with a hover title on each point.

const BANDS = [
  { max: 3, bg: "#15803d", ink: "#ffffff", label: "1–3" },
  { max: 10, bg: "#4ade80", ink: "#052e14", label: "4–10" },
  { max: 20, bg: "#bbf7d0", ink: "#052e14", label: "11–20" },
];
const OUT = { bg: "#e6e5da", ink: "rgba(10,31,22,0.65)", label: "Not in top 20" };
const band = (r) => (r == null ? OUT : BANDS.find((b) => r <= b.max));

export function RankGrid({ ranks, size, keyword, spacingKm }) {
  return (
    <figure>
      <div
        className="grid gap-[2px] rounded-xl overflow-hidden w-full max-w-[280px] aspect-square"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Google Maps rank for "${keyword}" at ${size * size} points ${spacingKm} km apart`}
      >
        {ranks.map((r, i) => {
          const b = band(r);
          const centre = i === Math.floor(ranks.length / 2);
          return (
            <div key={i} title={r == null ? "Not in the top 20 here" : `Rank ${r} here`}
              className={`flex items-center justify-center text-[11px] sm:text-xs font-semibold tabular-nums ${centre ? "ring-2 ring-inset ring-forest-900" : ""}`}
              style={{ background: b.bg, color: b.ink }}>
              {r ?? "20+"}
            </div>
          );
        })}
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-forest-900/70">
        {[...BANDS, OUT].map((b) => (
          <span key={b.label} className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: b.bg }} aria-hidden="true" />{b.label}</span>
        ))}
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm ring-2 ring-inset ring-forest-900" aria-hidden="true" />Your location</span>
      </figcaption>
    </figure>
  );
}

/**
 * Single-series trend, oldest left. `invert` puts lower values higher (ranks).
 * points: [{ at, v }] newest first, as stored.
 */
export function Trend({ points, title, format = (v) => v, invert = false, height = 56 }) {
  const pts = [...points].reverse().filter((p) => p.v != null);
  if (pts.length < 2) return <p className="text-xs text-forest-900/65">{title}: trend appears after two weekly checks.</p>;
  const W = 240, H = height, pad = 6;
  const vs = pts.map((p) => p.v);
  const lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
  const x = (i) => pad + (i * (W - pad * 2)) / (pts.length - 1);
  const y = (v) => { const t = (v - lo) / span; return pad + (invert ? t : 1 - t) * (H - pad * 2); };
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const first = pts[0].v, last = pts[pts.length - 1].v;
  return (
    <figure>
      <figcaption className="flex items-baseline justify-between gap-2 text-xs mb-1">
        <span className="text-forest-900/70">{title}</span>
        <span className="font-semibold tabular-nums">{format(first)} → {format(last)}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[280px]" role="img" aria-label={`${title}: ${format(first)} to ${format(last)} over ${pts.length} checks`}>
        <line x1={pad} x2={W - pad} y1={H - 1} y2={H - 1} stroke="rgba(10,31,22,0.12)" />
        <path d={d} fill="none" stroke="#15803d" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.v)} r="10" fill="transparent"><title>{`${new Date(p.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${format(p.v)}`}</title></circle>
            <circle cx={x(i)} cy={y(p.v)} r="3.5" fill="#15803d" stroke="#ffffff" strokeWidth="2" pointerEvents="none" />
          </g>
        ))}
      </svg>
    </figure>
  );
}

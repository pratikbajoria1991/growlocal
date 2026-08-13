// Shown while an audit runs. A skeleton that mirrors the real report's shape
// reads as progress; a lone spinner reads as a stall.
export function AuditSkeleton({ stage }) {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10" role="status" aria-live="polite">
      <span className="sr-only">Analysing your page…</span>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-10">
        <div className="rounded-4xl bg-forest-900 p-7 relative overflow-hidden">
          <div className="h-2.5 w-24 rounded bg-canvas-50/10 mb-4" />
          <div className="h-16 w-32 rounded-lg bg-canvas-50/10 mb-3" />
          <div className="h-6 w-20 rounded bg-canvas-50/10 mb-5" />
          <div className="h-2 w-full rounded bg-canvas-50/[0.07]" />
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(126,226,62,0.3), transparent 70%)" }}
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-4xl border hairline bg-white p-5 flex flex-col items-center">
              <div className="w-[110px] h-[110px] rounded-full shimmer mb-3" />
              <div className="h-2.5 w-12 rounded shimmer mb-2" />
              <div className="h-2 w-24 rounded shimmer" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-4 w-56 rounded shimmer mb-4" />
      <div className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border hairline bg-white p-5">
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-lg shimmer shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded shimmer" style={{ width: `${70 - i * 12}%` }} />
                <div className="h-2.5 rounded shimmer w-full" />
                <div className="h-2.5 rounded shimmer" style={{ width: `${85 - i * 8}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-forest-900/45">{stage}</p>
    </div>
  );
}

// Visibility, AI, review and listing reports. Pure render (no hooks), so the
// owner dashboard (server) and the admin console (client) share them.
import { Check, X, Star, Bot, MapPin, MessageSquare, ListChecks, Clock, AlertTriangle } from "lucide-react";
import { RankGrid, Trend } from "./Charts";

const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function Card({ icon: Icon, title, sub, children }) {
  return (
    <section className="rounded-3xl border hairline bg-white p-5 sm:p-6 mb-5">
      <h3 className="font-display font-bold text-lg tracking-[-0.02em] flex items-center gap-2"><Icon className="w-4 h-4 text-indigo-600" aria-hidden="true" />{title}</h3>
      {sub && <p className="text-xs text-forest-900/65 mt-1 mb-4">{sub}</p>}
      {!sub && <div className="mb-4" />}
      {children}
    </section>
  );
}

export function MapsVisibility({ snapshots }) {
  const s = snapshots[0];
  if (!s) return null;
  return (
    <Card icon={MapPin} title="Google Maps visibility"
      sub={`Your rank from ${s.grid.size * s.grid.size} points ${s.grid.spacingKm} km apart around ${s.place.name}. Checked ${fmtDate(s.at)}.`}>
      <div className="grid md:grid-cols-2 gap-6">
        {s.keywords.map((k) => {
          const hist = snapshots.map((x) => ({ at: x.at, kw: x.keywords.find((y) => y.keyword === k.keyword) })).filter((x) => x.kw);
          return (
            <div key={k.keyword} className="min-w-0">
              <div className="font-semibold mb-1">“{k.keyword}”</div>
              <p className="text-sm text-forest-900/75 mb-3">
                Top 3 at <strong className="tabular-nums">{k.top3Share}%</strong> of points · found at {k.found} of {k.ranks.length}
                {k.avgRank != null && <> · average rank <strong className="tabular-nums">{k.avgRank}</strong> where found</>}
              </p>
              <RankGrid ranks={k.ranks} size={s.grid.size} keyword={k.keyword} spacingKm={s.grid.spacingKm} />
              <div className="mt-4">
                <Trend title="Share of points in the top 3" points={hist.map((h) => ({ at: h.at, v: h.kw.top3Share }))} format={(v) => `${v}%`} />
              </div>
            </div>
          );
        })}
      </div>
      {s.failedSearches > 0 && <p className="mt-4 text-xs text-forest-900/65">{s.failedSearches} grid searches failed this week and are shown as “20+”.</p>}
    </Card>
  );
}

const ENGINE = { gemini: "Google's AI (Gemini)", chatgpt: "ChatGPT" };
const engineOf = (a) => a.engine || "gemini";

export function AiVisibility({ snapshots }) {
  const s = snapshots[0];
  if (!s?.ai?.length) return null;
  const hasChatgpt = s.ai.some((a) => engineOf(a) === "chatgpt");
  return (
    <Card icon={Bot} title="AI answer visibility"
      sub={`Whether ${hasChatgpt ? "Google's AI and ChatGPT" : "Google's AI (Gemini)"}, searching the web, name you when asked for the best in your area.${hasChatgpt ? "" : " ChatGPT isn't checked yet."}`}>
      <ul className="space-y-4">
        {s.ai.map((a) => {
          const hist = snapshots.slice(0, 8).map((x) => x.ai?.find((y) => y.keyword === a.keyword && engineOf(y) === engineOf(a))).filter(Boolean).reverse();
          return (
            <li key={`${engineOf(a)}:${a.keyword}`} className="border-t hairline pt-4 first:border-0 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="font-semibold">“{a.keyword}” <span className="font-normal text-sm text-forest-900/65">· {ENGINE[engineOf(a)]}</span></span>
                {a.error ? <span className="text-xs text-forest-900/65">Check failed this week</span>
                  : a.mentioned ? <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-emerald-600/10 text-emerald-800 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" aria-hidden="true" />Named</span>
                  : <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-rose-600/10 text-rose-800 inline-flex items-center gap-1"><X className="w-3.5 h-3.5" aria-hidden="true" />Not named</span>}
              </div>
              {hist.length > 1 && (
                <p className="text-xs text-forest-900/70 mb-1">
                  Last {hist.length} weeks: {hist.map((h, i) => <span key={i} className="font-mono">{h.error ? "·" : h.mentioned ? "✓" : "✗"}</span>)}
                  <span className="ml-1">(✓ named, ✗ not named)</span>
                </p>
              )}
              {a.sources?.length > 0 && (
                <p className="text-xs text-forest-900/65">Sources the AI used: {a.sources.map((x) => x.title).join(", ")}. Being listed on these helps.</p>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function Reviews({ snapshots }) {
  const s = snapshots[0];
  if (!s) return null;
  const r = s.reviews;
  return (
    <Card icon={MessageSquare} title="Reviews"
      sub="From your live Google listing. Google shares at most 5 reviews, picked by relevance rather than date, until your Business Profile is connected.">
      <div className="flex flex-wrap gap-8 mb-5">
        <div><div className="text-xs text-forest-900/65">Rating</div><div className="font-display font-bold text-3xl tabular-nums inline-flex items-center gap-1.5">{r.rating ?? "—"}<Star className="w-5 h-5 fill-amber-500 text-amber-500" aria-hidden="true" /></div></div>
        <div><div className="text-xs text-forest-900/65">Total reviews</div><div className="font-display font-bold text-3xl tabular-nums">{r.count}</div></div>
        <div className="min-w-[200px] flex-1"><Trend title="Total reviews" points={snapshots.map((x) => ({ at: x.at, v: x.reviews?.count ?? null }))} /></div>
      </div>
      {r.latest?.length > 0 && (
        <ul className="space-y-3">
          {r.latest.map((x, i) => (
            <li key={i} className="rounded-2xl bg-canvas-100 p-4">
              <div className="flex items-center justify-between gap-2 text-sm mb-1">
                <span className="font-medium">{x.author}</span>
                <span className="text-xs text-forest-900/65">{x.rating != null && `${x.rating}★`}{x.when && ` · ${x.when}`}</span>
              </div>
              {x.text && <p className="text-sm text-forest-900/80 leading-relaxed">{x.text}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const STATUS_UI = {
  live: ["Live", "bg-emerald-600/10 text-emerald-800", Check],
  submitted: ["Submitted, awaiting the directory", "bg-forest-900/[0.06] text-forest-900/80", Clock],
  owner_action: ["Needs you", "bg-amber-500/15 text-amber-900", AlertTriangle],
  needs_fix: ["Details wrong, we're fixing it", "bg-amber-500/15 text-amber-900", AlertTriangle],
  rejected: ["Rejected", "bg-rose-600/10 text-rose-800", X],
  todo: ["Planned", "bg-forest-900/[0.04] text-forest-900/70", Clock],
};

export function Listings({ data }) {
  if (!data) return null;
  const { directories, state, progress } = data;
  const rows = directories.filter((d) => state[d.id]?.status !== "na");
  return (
    <Card icon={ListChecks} title={`Directory listings: ${progress.live} of ${progress.count} live`}
      sub="We submit and correct your listings so every directory shows the same name, address and phone as Google. Directories approve on their own timelines.">
      <div className="h-2 rounded-full bg-forest-900/[0.07] overflow-hidden mb-5" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Listing value claimed">
        <div className="h-full bg-indigo-600" style={{ width: `${progress.percent}%` }} />
      </div>
      <ul className="divide-y divide-forest-900/[0.07]">
        {rows.map((d) => {
          const st = state[d.id] || {};
          const [label, cls, Icon] = STATUS_UI[st.status || "todo"] || STATUS_UI.todo;
          return (
            <li key={d.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium">{st.listingUrl && st.status === "live" ? <a href={st.listingUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{d.name}</a> : d.name}</div>
                {st.note && (st.status === "owner_action" || st.status === "needs_fix") && <div className="text-xs text-forest-900/70 mt-0.5">{st.note}</div>}
              </div>
              <span className={`text-xs font-semibold rounded-full px-2.5 py-1 inline-flex items-center gap-1 shrink-0 ${cls}`}><Icon className="w-3.5 h-3.5" aria-hidden="true" />{label}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

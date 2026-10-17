"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Loader2, Copy, Check, Download, Trash2, RefreshCw, ExternalLink,
  FileText, MessageSquare, HelpCircle, BarChart3, Search, MapPin, AlertCircle, X,
  CalendarDays, PenLine, ListChecks,
} from "lucide-react";
import { WorkLogPanel } from "./WorkLogPanel";
import { onboardingProgress } from "@/lib/onboarding";
import { MapsVisibility, AiVisibility, Reviews } from "./visibility/Reports";

const ACTIONS = [
  { id: "audit", label: "Website audit", icon: Search, needs: "website" },
  { id: "gbp", label: "GBP audit", icon: MapPin, needs: "gbpLink" },
  { id: "posts", label: "Post drafts", icon: FileText, input: "What's happening this week? (optional)" },
  { id: "replies", label: "Review replies", icon: MessageSquare, input: "Paste the real reviews, one per line" },
  { id: "faq", label: "FAQ + schema", icon: HelpCircle, input: "Questions they actually get asked (optional)" },
  { id: "calendar", label: "Content plan", icon: CalendarDays, input: "Anything specific this month? (optional)" },
  { id: "blogpost", label: "Write blog post", icon: PenLine, input: "Which topic or question?" },
  { id: "report", label: "Monthly report", icon: BarChart3, input: "Insights numbers, if you have them (optional)" },
];

const FIELDS = [
  ["name", "Business name", "Sharma Dental Care"],
  ["vertical", "Vertical", "Dental clinic"],
  ["city", "City / area", "Neighbourhood, city"],
  ["website", "Website", "https://example.com"],
  ["gbpLink", "Google Maps link", "https://maps.app.goo.gl/…"],
  ["phone", "Phone", "+country code and number"],
  ["ownerEmail", "Owner's sign-in email", "owner@business.com — links their dashboard"],
  ["services", "Services", "Implants, root canal, braces"],
  ["notes", "Notes", "Closed Sundays. Dr. Sharma is the draw."],
  ["crewGoal", "Monthly Growth Crew goal", "More implant enquiries from Google Maps and AI search"],
  ["ownerFacts", "Verified owner facts for the crew", "Hours, doctors and qualifications, services, prices the owner confirmed"],
];
const WIDE = new Set(["services", "notes", "crewGoal", "ownerFacts"]);

export function ConciergeConsole() {
  const [clients, setClients] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [inputFor, setInputFor] = useState(null);
  const [inputText, setInputText] = useState("");

  const active = clients.find((c) => c.id === activeId) || null;

  const loadClients = useCallback(async () => {
    const res = await fetch("/api/concierge/clients");
    const data = await res.json();
    if (res.ok) setClients(data.clients || []);
    else setError(data.error);
  }, []);

  const loadDrafts = useCallback(async (id) => {
    if (!id) return setDrafts([]);
    const res = await fetch(`/api/concierge/clients?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (res.ok) setDrafts(data.drafts || []);
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);
  useEffect(() => { loadDrafts(activeId); }, [activeId, loadDrafts]);

  async function saveClient(e) {
    e.preventDefault();
    setBusy("save"); setError(null);
    const res = await fetch("/api/concierge/clients", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return setError(data.error);
    setForm(null);
    await loadClients();
    setActiveId(data.client.id);
  }

  async function deleteClient(id) {
    if (!confirm("Remove this client and all their drafts?")) return;
    await fetch(`/api/concierge/clients?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (activeId === id) setActiveId(null);
    await loadClients();
  }

  async function run(actionId, withInput = "") {
    setBusy(actionId); setError(null); setInputFor(null);
    const res = await fetch("/api/concierge/run", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: activeId, action: actionId, input: withInput }),
    });
    const data = await res.json();
    setBusy(null); setInputText("");
    if (!res.ok) return setError(data.error);
    setDrafts((d) => [data.draft, ...d]);
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      {/* Client list */}
      <aside>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65">Clients ({clients.length})</h2>
          <button
            onClick={() => setForm({ name: "" })}
            className="text-xs inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {clients.length === 0 && !form && (
          <p className="text-sm text-forest-900/65 leading-relaxed">
            No clients yet. Add the first business you&apos;re servicing by hand.
          </p>
        )}

        <ul className="space-y-1.5">
          {clients.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl border transition-colors ${
                  c.id === activeId ? "border-indigo-500/40 bg-indigo-500/[0.06]" : "hairline bg-white hover:bg-forest-900/[0.02]"
                }`}
              >
                <div className="text-sm font-medium truncate">{c.name}</div>
                <div className="text-xs text-forest-900/65 truncate">{c.vertical || "—"}{c.city ? ` · ${c.city}` : ""}</div>
                <div className="text-[11px] text-forest-900/65 mt-0.5">Owner setup {onboardingProgress(c.onboarding, c.consent).pct}%</div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main panel */}
      <div className="min-w-0">
        {error && (
          <div className="mb-5 rounded-xl border border-rose-500/25 bg-rose-500/[0.05] p-3.5 flex items-start gap-2 text-sm text-rose-600">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {form ? (
          <form onSubmit={saveClient} className="rounded-4xl border hairline bg-white p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl">{form.id ? "Edit client" : "New client"}</h2>
              <button type="button" onClick={() => setForm(null)} className="text-forest-900/65 hover:text-forest-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {FIELDS.map(([key, label, ph]) => (
                <label key={key} className={WIDE.has(key) ? "sm:col-span-2" : ""}>
                  <span className="block text-xs text-forest-900/70 mb-1.5">{label}</span>
                  <input
                    value={form[key] || ""}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={ph}
                    required={key === "name"}
                    className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-canvas-50 outline-none focus:border-indigo-500/60 text-sm transition-colors"
                  />
                </label>
              ))}
              <label>
                <span className="block text-xs text-forest-900/70 mb-1.5">Status</span>
                <select
                  value={form.status || "trial"}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-canvas-50 outline-none focus:border-indigo-500/60 text-sm"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active (monthly crew runs)</option>
                  <option value="paused">Paused</option>
                </select>
              </label>
            </div>
            <button
              disabled={busy === "save"}
              className="mt-5 px-5 py-2.5 rounded-xl btn-premium text-white font-medium text-sm inline-flex items-center gap-2 disabled:opacity-40"
            >
              {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save client
            </button>
          </form>
        ) : active ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <h2 className="font-display text-2xl mb-1">{active.name}</h2>
                <p className="text-sm text-forest-900/70">
                  {[active.vertical, active.city, active.phone].filter(Boolean).join(" · ") || "No details yet"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setForm(active)} className="text-xs px-3 py-2 rounded-lg border hairline bg-white hover:bg-forest-900/[0.03]">Edit</button>
                <button onClick={() => deleteClient(active.id)} className="text-xs px-3 py-2 rounded-lg border hairline bg-white hover:bg-rose-500/5 text-rose-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="grid sm:grid-cols-3 gap-2.5 mb-4">
              {ACTIONS.map((a) => {
                const disabled = a.needs && !active[a.needs];
                return (
                  <button
                    key={a.id}
                    disabled={busy || disabled}
                    title={disabled ? `Needs a ${a.needs === "website" ? "website" : "Maps link"} on file` : ""}
                    onClick={() => (a.input ? (setInputFor(a), setInputText("")) : run(a.id))}
                    className="px-4 py-3 rounded-xl border hairline bg-white hover:bg-forest-900/[0.02] text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                  >
                    {busy === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <a.icon className="w-4 h-4 text-indigo-600" />}
                    {a.label}
                  </button>
                );
              })}
            </div>

            {/* Optional input before running */}
            {inputFor && (
              <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-4 mb-6">
                <div className="text-sm font-medium mb-2">{inputFor.label}</div>
                <textarea
                  rows={4} value={inputText} onChange={(e) => setInputText(e.target.value)}
                  placeholder={inputFor.input}
                  className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-white outline-none focus:border-indigo-500/60 text-sm leading-relaxed resize-y"
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => run(inputFor.id, inputText)} className="px-4 py-2 rounded-lg btn-premium text-white text-sm font-medium">
                    Generate
                  </button>
                  <button onClick={() => setInputFor(null)} className="px-4 py-2 rounded-lg border hairline bg-white text-sm">Cancel</button>
                </div>
              </div>
            )}

            {/* Work log — plan, approval, shipped, and the numbers afterwards */}
            <WorkLogPanel client={active} />

            {/* Citations — the manual directory submission work */}
            <CitationsPanel client={active} />

            {/* Weekly visibility tracking — grid, AI answers, reviews */}
            <TrackingPanel client={active} />

            {/* WordPress connector — backed-up, verified, undoable changes */}
            <WebsitePanel client={active} />

            {/* Drafts */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65">Drafts ({drafts.length})</h3>
              <button onClick={() => loadDrafts(activeId)} className="text-xs text-forest-900/65 hover:text-forest-900 inline-flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {drafts.length === 0 ? (
              <p className="text-sm text-forest-900/65">Nothing generated yet — run an action above.</p>
            ) : (
              <ul className="space-y-3">
                {drafts.map((d) => <DraftCard key={d.id} draft={d} client={active} />)}
              </ul>
            )}
          </>
        ) : (
          <p className="text-forest-900/70 text-sm">Select a client, or add one to get started.</p>
        )}
      </div>
    </div>
  );
}

// Directory listings: done-for-you submission and fixing. No directory has a
// submission API, so the team submits by hand from the kit below; this tracks
// each listing, what's wrong with it, and checks live ones for the right details.
function CitationsPanel({ client }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(null);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/concierge/citations?clientId=${encodeURIComponent(client.id)}`);
    if (res.ok) setData(await res.json());
  }, [client.id]);

  useEffect(() => { load(); }, [load]);

  async function post(directoryId, body) {
    setSaving(directoryId); setMsg(null);
    const res = await fetch("/api/concierge/citations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: client.id, directoryId, ...body }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setData((prev) => ({ ...prev, state: d.state, progress: d.progress }));
      if (d.check) setMsg({ id: directoryId, ok: d.check.ok, text: d.check.ok ? "Name and phone match on the live listing." : d.check.reason });
    } else setMsg({ id: directoryId, ok: false, text: d.error || "Couldn't save." });
    setSaving(null);
  }

  if (!data) return null;
  const { directories, state, progress, kit } = data;
  const kitText = kit ? [
    ["Business name", kit.name], ["Address", kit.address], ["Phone", kit.phone], ["Website", kit.website],
    ["Category", kit.category], ["Hours", kit.hours], ["Services", kit.services], ["Areas served", kit.areas], ["Description", kit.description],
  ].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n") : "";

  return (
    <section className="mb-8">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 inline-flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5" /> Directory listings — {progress.live}/{progress.count} live
          </h3>
          <span className="text-xs text-forest-900/65">{open ? "Hide" : "Show"}</span>
        </div>
        <div className="h-1.5 rounded-full bg-forest-900/8 overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="text-xs text-forest-900/65 mt-1.5">
          {progress.percent}% of weighted value live · {progress.submitted} submitted · {progress.ownerAction} waiting on owner · {progress.needsFix} need fixing · {progress.remaining} not started
        </p>
      </button>

      {open && (
        <>
          {kit && (
            <div className="mt-4 rounded-xl border hairline bg-canvas-100 p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold">Submission kit: use exactly these details everywhere</span>
                <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(kitText); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }}
                  className="text-xs px-2.5 py-1 rounded-lg border hairline bg-white inline-flex items-center gap-1">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy all
                </button>
              </div>
              <pre className="text-xs whitespace-pre-wrap leading-relaxed">{kitText || "No details yet."}</pre>
              <p className="text-[11px] text-forest-900/65 mt-2">Source: {kit.source}</p>
            </div>
          )}
          <ul className="mt-3 space-y-1.5">
            {directories.map((d) => {
              const st = state[d.id] || {};
              const s = st.status || "todo";
              return (
                <li key={d.id} className={`rounded-xl border p-3.5 ${s === "live" ? "border-emerald-500/25 bg-emerald-500/[0.03]" : s === "needs_fix" || s === "owner_action" ? "border-amber-500/30 bg-amber-500/[0.04]" : "hairline bg-white"}`}>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{d.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-forest-900/5 text-forest-900/65">{d.group}</span>
                        <span className="text-[10px] text-forest-900/65">value {d.weight}/10</span>
                      </div>
                      <p className="text-xs text-forest-900/70 leading-relaxed mt-1">{d.why}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={d.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-2.5 py-1.5 rounded-lg border hairline hover:bg-forest-900/[0.03] inline-flex items-center gap-1">
                        Submit <ExternalLink className="w-3 h-3" />
                      </a>
                      <select value={s} disabled={saving === d.id} onChange={(e) => post(d.id, { status: e.target.value })}
                        aria-label={`Status for ${d.name}`}
                        className="text-xs px-2.5 py-1.5 rounded-lg border hairline bg-white outline-none focus:border-indigo-500/60">
                        <option value="todo">Not started</option>
                        <option value="submitted">Submitted</option>
                        <option value="owner_action">Waiting on owner</option>
                        <option value="needs_fix">Listed, details wrong</option>
                        <option value="live">Live</option>
                        <option value="rejected">Rejected</option>
                        <option value="na">N/A</option>
                      </select>
                    </div>
                  </div>
                  {s !== "todo" && s !== "na" && (
                    <div className="mt-2.5 grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                      <input defaultValue={st.listingUrl || ""} placeholder="Listing URL" aria-label={`Listing URL for ${d.name}`}
                        onBlur={(e) => e.target.value !== (st.listingUrl || "") && post(d.id, { listingUrl: e.target.value })}
                        className="text-xs px-2.5 py-1.5 rounded-lg border hairline bg-white outline-none focus:border-indigo-500/60" />
                      <input defaultValue={st.note || ""} placeholder={s === "owner_action" ? "What the owner must do (shown to them)" : "Note: what's wrong, or what's pending"} aria-label={`Note for ${d.name}`}
                        onBlur={(e) => e.target.value !== (st.note || "") && post(d.id, { note: e.target.value })}
                        className="text-xs px-2.5 py-1.5 rounded-lg border hairline bg-white outline-none focus:border-indigo-500/60" />
                      <button type="button" disabled={!st.listingUrl || saving === d.id} onClick={() => post(d.id, { check: true })}
                        className="text-xs px-2.5 py-1.5 rounded-lg border hairline bg-white disabled:opacity-40 inline-flex items-center gap-1">
                        {saving === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />} Check listing
                      </button>
                    </div>
                  )}
                  {(msg?.id === d.id || st.check) && (
                    <p className={`text-[11px] mt-1.5 ${(msg?.id === d.id ? msg.ok : st.check?.ok) ? "text-emerald-800" : "text-amber-900"}`}>
                      {msg?.id === d.id ? msg.text : `Last check ${new Date(st.check.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${st.check.ok ? "details match" : st.check.reason}`}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

// Weekly visibility tracking: keywords, grid, run now, latest reports.
function TrackingPanel({ client }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/concierge/tracking?clientId=${encodeURIComponent(client.id)}`);
    if (res.ok) {
      const d = await res.json();
      setData(d);
      setForm({ keywords: d.config.keywords.join("\n"), grid: d.config.grid, spacingKm: d.config.spacingKm });
    }
  }, [client.id]);
  useEffect(() => { load(); }, [load]);

  async function call(body, kind) {
    setBusy(kind); setErr(null);
    try {
      const res = await fetch("/api/concierge/tracking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: client.id, ...body }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Failed.");
      await load();
    } catch (e) { setErr(e.message); }
    setBusy(null);
  }

  if (!data || !form) return null;
  const snaps = data.snapshots;
  const last = snaps[0];
  const searches = form.keywords.split(/[\n,]/).filter((k) => k.trim().length >= 3).length * form.grid * form.grid;

  return (
    <section className="mb-8">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left flex items-center justify-between mb-2">
        <h3 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 inline-flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" /> Visibility tracking — {data.config.keywords.length ? `${data.config.keywords.length} keywords` : "not set up"}{last ? ` · last ${new Date(last.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
        </h3>
        <span className="text-xs text-forest-900/65">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="mt-3">
          <div className="rounded-xl border hairline bg-white p-3.5 grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <label className="block text-xs">Keywords (up to 5, one per line; first 3 also get the AI check)
              <textarea rows={3} value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                className="mt-1 w-full px-2.5 py-1.5 rounded-lg border hairline outline-none focus:border-indigo-500/60 text-sm" placeholder={"dentist\ndental implants"} />
            </label>
            <label className="block text-xs">Grid
              <select value={form.grid} onChange={(e) => setForm({ ...form, grid: Number(e.target.value) })} className="mt-1 block px-2.5 py-1.5 rounded-lg border hairline bg-white text-sm">
                {[3, 5, 7].map((n) => <option key={n} value={n}>{n}×{n}</option>)}
              </select>
            </label>
            <label className="block text-xs">Spacing (km)
              <input type="number" step="0.1" min="0.3" max="5" value={form.spacingKm} onChange={(e) => setForm({ ...form, spacingKm: e.target.value })} className="mt-1 block w-24 px-2.5 py-1.5 rounded-lg border hairline text-sm" />
            </label>
            <div className="sm:col-span-3 flex flex-wrap items-center gap-2">
              <button type="button" disabled={!!busy} onClick={() => call({ keywords: form.keywords, grid: form.grid, spacingKm: form.spacingKm }, "save")} className="text-xs px-3 py-1.5 rounded-lg border hairline bg-white inline-flex items-center gap-1">
                {busy === "save" && <Loader2 className="w-3 h-3 animate-spin" />} Save settings
              </button>
              <button type="button" disabled={!!busy || !data.config.keywords.length} onClick={() => call({ run: true }, "run")} className="text-xs px-3 py-1.5 btn-premium inline-flex items-center gap-1 disabled:opacity-40">
                {busy === "run" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Run check now
              </button>
              <span className="text-[11px] text-forest-900/65">{searches} Google Maps searches per check (IDs only). Active clients are checked weekly automatically.</span>
            </div>
            {err && <p role="alert" className="sm:col-span-3 text-xs text-rose-700">{err}</p>}
          </div>
          {last ? (
            <div className="mt-4">
              <MapsVisibility snapshots={snaps} />
              <AiVisibility snapshots={snaps} />
              <Reviews snapshots={snaps} />
            </div>
          ) : <p className="text-xs text-forest-900/65 mt-3">No checks yet. Save keywords, then run a check.</p>}
        </div>
      )}
    </section>
  );
}

// WordPress connector: connect, apply a change (backed up and verified), undo.
function WebsitePanel({ client }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const [conn, setConn] = useState({ site: client.website || "", username: "", appPassword: "" });
  const [change, setChange] = useState({ pageId: "", kind: "append_html", html: "", actionId: "" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/concierge/website?clientId=${encodeURIComponent(client.id)}`);
    if (res.ok) setData(await res.json());
  }, [client.id]);
  useEffect(() => { load(); }, [load]);

  async function op(body, kind) {
    setBusy(kind); setMsg(null);
    try {
      const res = await fetch("/api/concierge/website", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: client.id, ...body }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Failed.");
      setMsg({ ok: true, text: kind === "connect" ? `Connected as ${d.user}.${d.unfilteredHtml ? "" : " This user can't save schema <script> tags; use an administrator for schema."}`
        : kind === "apply" ? "Applied and verified on the live page. It's in the work log, and you can undo it below."
        : kind === "undo" ? "Restored the page from its backup." : "Done." });
      if (kind === "connect") setConn((c) => ({ ...c, appPassword: "" }));
      if (kind === "apply") setChange((c) => ({ ...c, html: "" }));
      await load();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    setBusy(null);
  }

  if (!data) return null;
  const field = "w-full px-2.5 py-1.5 rounded-lg border hairline bg-white outline-none focus:border-indigo-500/60 text-sm";
  const needsApproval = change.kind === "replace_content" || !data.autoWebsiteTech;

  return (
    <section className="mb-8">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left flex items-center justify-between mb-2">
        <h3 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 inline-flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Website connector — {data.connection ? `WordPress · ${new URL(data.connection.site).host}` : "not connected"}
        </h3>
        <span className="text-xs text-forest-900/65">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          {msg && <p role="status" className={`text-xs ${msg.ok ? "text-emerald-800" : "text-rose-700"}`}>{msg.text}</p>}

          {!data.connection ? (
            <form onSubmit={(e) => { e.preventDefault(); op({ op: "connect", ...conn }, "connect"); }} className="rounded-xl border hairline bg-white p-3.5 grid sm:grid-cols-3 gap-2">
              <input className={field} placeholder="https://their-site.com" aria-label="WordPress site address" value={conn.site} onChange={(e) => setConn({ ...conn, site: e.target.value })} required />
              <input className={field} placeholder="WordPress username" aria-label="WordPress username" value={conn.username} onChange={(e) => setConn({ ...conn, username: e.target.value })} required autoComplete="off" />
              <input className={field} type="password" placeholder="Application password" aria-label="Application password" value={conn.appPassword} onChange={(e) => setConn({ ...conn, appPassword: e.target.value })} required autoComplete="new-password" />
              <div className="sm:col-span-3 flex flex-wrap items-center gap-2">
                <button disabled={!!busy} className="text-xs px-3 py-1.5 btn-premium inline-flex items-center gap-1">{busy === "connect" && <Loader2 className="w-3 h-3 animate-spin" />} Test and connect</button>
                <span className="text-[11px] text-forest-900/65">The owner creates it in WordPress: Users → Profile → Application Passwords. Stored encrypted; they can revoke it any time.</span>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-forest-900/70">
                Connected as {data.connection.user} on {new Date(data.connection.connectedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                {data.connection.plugins?.yoast && " · Yoast"}{data.connection.plugins?.rankMath && " · Rank Math"}
                <button type="button" onClick={() => op({ op: "disconnect" }, "disconnect")} className="underline">Disconnect</button>
              </div>
              {data.pagesError && <p className="text-xs text-rose-700">{data.pagesError}</p>}
              <form onSubmit={(e) => { e.preventDefault(); op({ op: "apply", ...change, pageId: Number(change.pageId) }, "apply"); }} className="rounded-xl border hairline bg-white p-3.5 space-y-2">
                <div className="grid sm:grid-cols-2 gap-2">
                  <select className={field} aria-label="Page" value={change.pageId} onChange={(e) => setChange({ ...change, pageId: e.target.value })} required>
                    <option value="">Choose a page…</option>
                    {data.pages.map((p) => <option key={p.id} value={p.id}>{p.title}{p.status !== "publish" ? ` (${p.status})` : ""}</option>)}
                  </select>
                  <select className={field} aria-label="Change type" value={change.kind} onChange={(e) => setChange({ ...change, kind: e.target.value })}>
                    <option value="append_html">Add a block (FAQ, schema)</option>
                    <option value="replace_content">Replace page wording (needs owner OK)</option>
                  </select>
                </div>
                {needsApproval && (
                  <select className={field} aria-label="Approved work-log item" value={change.actionId} onChange={(e) => setChange({ ...change, actionId: e.target.value })} required>
                    <option value="">Owner-approved work-log item…</option>
                    {data.approved.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                )}
                <textarea className={`${field} font-mono text-xs`} rows={6} aria-label="HTML to apply" placeholder={change.kind === "append_html" ? "HTML block, e.g. an FAQ section and its <script type=\"application/ld+json\"> schema" : "The page's full new content (HTML)"} value={change.html} onChange={(e) => setChange({ ...change, html: e.target.value })} required />
                <div className="flex flex-wrap items-center gap-2">
                  <button disabled={!!busy} className="text-xs px-3 py-1.5 btn-premium inline-flex items-center gap-1">{busy === "apply" && <Loader2 className="w-3 h-3 animate-spin" />} Back up and apply</button>
                  <span className="text-[11px] text-forest-900/65">The page is backed up first, then re-read to confirm the change stuck; if not, it's restored.</span>
                </div>
              </form>
            </>
          )}

          {data.backups.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1.5">Changes made ({data.backups.length})</div>
              <ul className="space-y-1.5">
                {data.backups.map((b) => (
                  <li key={b.id} className="rounded-xl border hairline bg-white p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span><a href={b.link} target="_blank" rel="noopener noreferrer" className="font-medium underline">{b.pageTitle || `Page ${b.pageId}`}</a> · {b.kind === "append_html" ? "block added" : "wording replaced"} · {new Date(b.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} by {b.by}</span>
                    {b.undoneAt ? <span className="text-forest-900/60">Undone {new Date(b.undoneAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      : <button type="button" disabled={!!busy} onClick={() => op({ op: "undo", backupId: b.id }, "undo")} className="px-2.5 py-1 rounded-lg border hairline inline-flex items-center gap-1">{busy === "undo" && <Loader2 className="w-3 h-3 animate-spin" />} Undo</button>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function DraftCard({ draft, client }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked */ }
  }

  function download() {
    const name = `${client.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${draft.action}-${draft.at.slice(0, 10)}.md`;
    const blob = new Blob([draft.output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <li className="rounded-2xl border hairline bg-white overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => setOpen((o) => !o)} className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium">{draft.label}</div>
          <div className="text-xs text-forest-900/65">
            {new Date(draft.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {draft.source === "stub" && <span className="ml-2 text-amber-600 font-medium">stub — no API key</span>}
            {draft.meta?.overall != null && <span className="ml-2">· {draft.meta.overall}/100</span>}
          </div>
        </button>
        <button onClick={copy} title="Copy" className="p-2 rounded-lg hover:bg-forest-900/5 text-forest-900/70">
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
        <button onClick={download} title="Download .md" className="p-2 rounded-lg hover:bg-forest-900/5 text-forest-900/70">
          <Download className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <pre className="px-4 pb-4 text-xs leading-relaxed whitespace-pre-wrap font-mono text-forest-900/75 border-t hairline pt-3 overflow-x-auto">
          {draft.output}
        </pre>
      )}
    </li>
  );
}

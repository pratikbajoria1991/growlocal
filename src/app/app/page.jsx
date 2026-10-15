import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LogOut, CheckCircle2, Clock, MessageCircle, ExternalLink } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { clientsForOwner, isAdmin } from "@/lib/clients";
import { listActions, ACTION_TYPES, latestDelta } from "@/lib/ledger";
import { OwnerDecision } from "@/components/OwnerDecision";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your business", robots: { index: false, follow: false } };

// The owner's view. Not a tool to operate — a window onto work being done for
// them, plus the one thing only they can do: say yes or no to risky changes.
export default async function OwnerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const businesses = await clientsForOwner(user.email);
  const withActions = await Promise.all(
    businesses.map(async (b) => ({ business: b, actions: await listActions(b.id) })),
  );

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/65 mb-2">Your business</div>
          <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-1">
            {businesses.length === 1 ? businesses[0].name : "Welcome back."}
          </h1>
          <p className="text-sm text-forest-900/70">{user.email}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isAdmin(user) && (
            <Link href="/concierge" className="text-xs text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-500/5">Console</Link>
          )}
          <form action="/api/auth/logout" method="POST">
            <button className="text-xs text-forest-900/65 hover:text-forest-900 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-forest-900/5 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </form>
        </div>
      </div>

      {businesses.length === 0 ? (
        <NotAClientYet />
      ) : (
        withActions.map(({ business, actions }) => (
          <BusinessView key={business.id} business={business} actions={actions} showName={businesses.length > 1} />
        ))
      )}
    </div>
  );
}

function BusinessView({ business, actions, showName }) {
  const awaiting = actions.filter((a) => a.status === "awaiting_approval");
  const upcoming = actions.filter((a) => a.status === "planned" || a.status === "approved")
    .sort((x, y) => x.plannedFor.localeCompare(y.plannedFor));
  const done = actions.filter((a) => a.status === "done")
    .sort((x, y) => y.doneAt.localeCompare(x.doneAt));
  const measured = done.map((a) => ({ a, d: latestDelta(a) })).filter(({ d }) => d?.comparable && d.rows.length);

  return (
    <section className="mb-14">
      {showName && <h2 className="font-display text-2xl mb-6">{business.name}</h2>}

      {/* Needs you — the only action an owner ever has to take */}
      <Block
        icon={MessageCircle}
        title={awaiting.length ? `Needs your OK (${awaiting.length})` : "Nothing needs your OK"}
        tone={awaiting.length ? "ask" : "calm"}
      >
        {awaiting.length === 0 ? (
          <p className="text-sm text-forest-900/70">We&apos;ll message you on WhatsApp when a change needs your approval.</p>
        ) : (
          <ul className="space-y-3">
            {awaiting.map((a) => (
              <li key={a.id} className="rounded-2xl border hairline bg-white p-5">
                <div className="text-xs text-forest-900/65 mb-1">{(ACTION_TYPES[a.type] || ACTION_TYPES.other).label}</div>
                <div className="font-medium mb-2">{a.title}</div>
                {a.detail && <p className="text-sm text-forest-900/65 whitespace-pre-wrap leading-relaxed mb-4">{a.detail}</p>}
                <OwnerDecision clientId={business.id} actionId={a.id} />
              </li>
            ))}
          </ul>
        )}
      </Block>

      {/* Results */}
      {measured.length > 0 && (
        <Block icon={CheckCircle2} title="What changed after our work">
          <p className="text-xs text-forest-900/65 mb-3">
            From your Google Business Profile Performance numbers, same-length periods before and after each change.
            Other things affect these numbers too — seasons, competitors, Google itself — so read them as a trend, not proof.
          </p>
          <ul className="space-y-3">
            {measured.slice(0, 5).map(({ a, d }) => (
              <li key={a.id} className="rounded-2xl border hairline bg-white p-4">
                <div className="text-sm font-medium mb-2">{a.title} <span className="text-forest-900/65 font-normal">· day {d.day}</span></div>
                <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                  {d.rows.map((r) => (
                    <span key={r.key}>
                      <span className="text-forest-900/70">{r.label}: </span>
                      <span className="tabular-nums">{r.before} → {r.after}</span>
                      <span className={`ml-1 tabular-nums ${r.diff > 0 ? "text-emerald-700" : r.diff < 0 ? "text-rose-600" : "text-forest-900/65"}`}>
                        ({r.diff > 0 ? "+" : ""}{r.diff})
                      </span>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* Coming up */}
      <Block icon={Clock} title={`Coming up (${upcoming.length})`}>
        {upcoming.length === 0 ? (
          <p className="text-sm text-forest-900/70">We&apos;re planning your next changes.</p>
        ) : (
          <ul className="divide-y divide-forest-900/[0.07]">
            {upcoming.map((a) => (
              <li key={a.id} className="py-3 flex items-start justify-between gap-4 text-sm">
                <span>{a.title}</span>
                <span className="text-forest-900/65 shrink-0">{fmt(a.plannedFor)}</span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      {/* Done */}
      <Block icon={CheckCircle2} title={`Done for you (${done.length})`}>
        {done.length === 0 ? (
          <p className="text-sm text-forest-900/70">Finished work will appear here, with a link to see it live.</p>
        ) : (
          <ul className="divide-y divide-forest-900/[0.07]">
            {done.slice(0, 30).map((a) => (
              <li key={a.id} className="py-3 flex items-start justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <div>{a.title}</div>
                  <div className="text-xs text-forest-900/65">{(ACTION_TYPES[a.type] || ACTION_TYPES.other).label}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-forest-900/65">{fmt(a.doneAt)}</div>
                  {a.proofUrl && (
                    <a href={a.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 inline-flex items-center gap-1">
                      See it <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </section>
  );
}

function Block({ icon: Icon, title, tone, children }) {
  const border = tone === "ask" ? "border-amber-500/30 bg-amber-500/[0.04]" : "hairline bg-canvas-50";
  return (
    <div className={`rounded-4xl border p-6 mb-5 ${border}`}>
      <h3 className="font-display text-lg mb-4 inline-flex items-center gap-2">
        <Icon className="w-4.5 h-4.5 text-indigo-600" aria-hidden="true" /> {title}
      </h3>
      {children}
    </div>
  );
}

function NotAClientYet() {
  return (
    <div className="rounded-4xl border hairline bg-white p-8">
      <h2 className="font-display text-2xl mb-2">We&apos;re not handling a business for this email yet.</h2>
      <p className="text-sm text-forest-900/60 leading-relaxed mb-6 max-w-xl">
        Once you&apos;re a Growlocal client, this page shows every change we make for you, anything that needs your OK,
        and what happened to your Google numbers afterwards. If you&apos;re already a client, sign in with the email you gave us.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/managed#apply" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl btn-premium text-white font-medium text-sm">
          Apply for a founding slot <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/audit" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border hairline bg-white font-medium text-sm">
          Run a free audit
        </Link>
      </div>
    </div>
  );
}

function fmt(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

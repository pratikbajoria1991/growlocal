import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ClipboardList, LogOut, CheckCircle2, Clock, MessageCircle, ExternalLink, TrendingUp, HelpCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { clientsForOwner, isAdmin } from "@/lib/clients";
import { listActions, ACTION_TYPES, latestDelta } from "@/lib/ledger";
import { OwnerDecision } from "@/components/OwnerDecision";
import { OwnerAnswers } from "@/components/OwnerAnswers";
import { monthlyReport, clientRuns, tidyQuestions } from "@/lib/crew/monthly";
import { onboardingProgress } from "@/lib/onboarding";
import { listSnapshots } from "@/lib/tracking";
import { getCitations } from "@/lib/citations";
import { MapsVisibility, AiVisibility, Reviews, Listings } from "@/components/visibility/Reports";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your business", robots: { index: false, follow: false } };

// The owner's view. Not a tool to operate — a window onto work being done for
// them, plus the one thing only they can do: say yes or no to risky changes.
export default async function OwnerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const businesses = await clientsForOwner(user.email);
  const withActions = await Promise.all(
    businesses.map(async (b) => {
      const [actions, report, runs, snapshots, citations] = await Promise.all([
        listActions(b.id), monthlyReport(b.id), clientRuns(b.id), listSnapshots(b.id), getCitations(b),
      ]);
      return { business: b, actions, report, runs, snapshots: snapshots.slice(0, 12), citations };
    }),
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
        withActions.map(({ business, actions, report, runs, snapshots, citations }) => (
          <BusinessView key={business.id} business={business} actions={actions} report={report} runs={runs}
            snapshots={snapshots} citations={citations} showName={businesses.length > 1} />
        ))
      )}
    </div>
  );
}

function BusinessView({ business, actions, report, runs, snapshots, citations, showName }) {
  const awaiting = actions.filter((a) => a.status === "awaiting_approval");
  const upcoming = actions.filter((a) => a.status === "planned" || a.status === "approved")
    .sort((x, y) => x.plannedFor.localeCompare(y.plannedFor));
  const done = actions.filter((a) => a.status === "done")
    .sort((x, y) => y.doneAt.localeCompare(x.doneAt));
  const measured = done.map((a) => ({ a, d: latestDelta(a) })).filter(({ d }) => d?.comparable && d.rows.length);

  return (
    <section className="mb-14">
      {showName && <h2 className="font-display text-2xl mb-6">{business.name}</h2>}

      <SetupCard business={business} />

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

      <GrowthPlan business={business} report={report} runs={runs} />

      {/* Weekly tracking: Maps grid, AI answers, reviews; then listings */}
      {snapshots.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display font-bold text-2xl tracking-[-0.03em] mb-4">Your visibility</h2>
          <MapsVisibility snapshots={snapshots} />
          <AiVisibility snapshots={snapshots} />
          <Reviews snapshots={snapshots} />
        </div>
      )}
      {Object.keys(citations.state).length > 0 && <Listings data={citations} />}

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

const CYCLE_DAYS = 28;
const day = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long" });

// The monthly Growth Crew, from the owner's side: the goal, when we last
// worked on it and when next, what changed in measured numbers, and the
// details only the owner can give us.
function GrowthPlan({ business, report, runs }) {
  if (!business.crewGoal && !runs?.length) return null;
  const last = runs?.[0];
  const next = last ? new Date(Date.parse(last.startedAt) + CYCLE_DAYS * 86_400_000).toISOString() : null;
  const cur = report?.current, ch = report?.change;
  const questions = tidyQuestions(cur?.ownerQuestions || [], business.ownerAnswers || []);
  const fmt = (n) => (n == null ? null : `${n > 0 ? "+" : ""}${n}`);
  return (
    <>
      <Block icon={TrendingUp} title="Your monthly growth plan">
        {business.crewGoal && <p className="text-sm mb-4"><span className="text-forest-900/70">Goal: </span>{business.crewGoal}</p>}
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <Fact k="Last update" v={last ? day(last.startedAt) : "Starting soon"} />
          <Fact k="Next update" v={next ? day(next) : "—"} />
          <Fact k="Changes ready this month" v={cur ? `${cur.approved}` : "—"} />
        </div>
        {cur && (
          <div className="grid sm:grid-cols-3 gap-3">
            <Fact k="Google rating" v={cur.rating != null ? `${cur.rating}★${ch?.rating ? ` (${fmt(ch.rating)})` : ""}` : "—"} />
            <Fact k="Google reviews" v={cur.reviews != null ? `${cur.reviews}${ch?.reviews ? ` (${fmt(ch.reviews)})` : ""}` : "—"} />
            <Fact k="Website score" v={cur.audit ? `${cur.audit.overall}/100${ch?.auditOverall ? ` (${fmt(ch.auditOverall)})` : ""}${cur.auditIfApplied && cur.auditIfApplied.overall > cur.audit.overall ? ` → ${cur.auditIfApplied.overall} once this month's changes go live` : ""}` : "No website yet"} />
          </div>
        )}
        <p className="text-xs text-forest-900/65 mt-3">
          Numbers come from your live Google listing and our website audit at each monthly check. Changes that need your OK are listed above.
        </p>
      </Block>
      {questions.length > 0 && (
        <Block icon={HelpCircle} title="We need a few details from you" tone="ask">
          <p className="text-sm text-forest-900/70 mb-4">
            We only publish what we can verify. Answer these and next month&apos;s changes can include them.
          </p>
          <OwnerAnswers clientId={business.id} questions={questions} />
        </Block>
      )}
    </>
  );
}

// Onboarding: prominent until complete, then a quiet link to edit.
function SetupCard({ business }) {
  const p = onboardingProgress(business.onboarding, business.consent);
  const href = `/app/onboarding/${business.id}`;
  if (p.pct === 100) {
    return (
      <p className="mb-8 text-sm text-forest-900/70">
        Setup complete. <Link href={href} className="text-indigo-700 underline underline-offset-4">Edit your business details</Link>
      </p>
    );
  }
  return (
    <div className="mb-8 rounded-3xl bg-forest-900 text-canvas-50 p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="w-11 h-11 rounded-2xl bg-brand flex items-center justify-center shrink-0"><ClipboardList className="w-5 h-5 text-brand-ink" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-bold text-xl tracking-[-0.03em] mb-1">{p.pct === 0 ? "Set up your business" : `Finish setting up (${p.pct}%)`}</h2>
          <p className="text-sm text-canvas-50/75 mb-4">About 10 minutes. Our agents can only use facts you confirm, so this is what lets them do complete work for you.</p>
          <div className="h-1.5 rounded-full bg-canvas-50/15 overflow-hidden mb-5 max-w-sm"><div className="h-full bg-brand" style={{ width: `${p.pct}%` }} /></div>
          <Link href={href} className="inline-flex items-center gap-2 px-5 py-2.5 btn-premium text-sm">
            {p.pct === 0 ? "Start setup" : "Continue setup"} <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Fact({ k, v }) {
  return (
    <div className="rounded-2xl border hairline bg-white p-3.5">
      <div className="text-xs text-forest-900/65 mb-0.5">{k}</div>
      <div className="text-sm font-medium">{v}</div>
    </div>
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

import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowRight, LogOut, ShieldCheck, ExternalLink } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { AgentPanel } from "@/components/AgentPanel";
import { AGENT_ACTIONS } from "@/lib/agent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function Dashboard({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const connected = Boolean(user.gbp?.connected);
  const oauthConfigured = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID);
  const actions = Object.entries(AGENT_ACTIONS).map(([id, a]) => ({ id, label: a.label, hint: a.hint }));

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-2">Dashboard</div>
          <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-1">Welcome back.</h1>
          <p className="text-sm text-forest-900/50">{user.email}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button className="text-xs text-forest-900/45 hover:text-forest-900 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-forest-900/5 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </form>
      </div>

      {sp?.oauth === "success" && (
        <Banner tone="ok" title="Google Business Profile connected." body="The AI agent can now draft content for your profile." />
      )}
      {sp?.oauth === "error" && (
        <Banner tone="err" title="Couldn't connect." body={`Reason: ${sp.reason || "unknown"}. Try again below.`} />
      )}

      {/* Connection */}
      <section className="mb-10">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">Google Business Profile</div>
        {connected ? (
          <div className="rounded-2xl border hairline bg-white p-5 flex items-center gap-4">
            <CheckCircle2 className="w-5 h-5 text-lime-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">Connected</div>
              <div className="text-xs text-forest-900/45">
                Granted {new Date(user.gbp.granted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-forest-900/45 hover:text-forest-900 inline-flex items-center gap-1 shrink-0"
            >
              Revoke <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : oauthConfigured ? (
          <div className="rounded-2xl border hairline bg-white p-6">
            <div className="flex items-start gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-lime-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm mb-1">Connect to get started</div>
                <p className="text-sm text-forest-900/60 leading-relaxed">
                  You&apos;ll authorise through Google&apos;s own consent screen. We never see your password, and you can revoke access in one click at any time.
                </p>
              </div>
            </div>
            <a
              href="/api/oauth/google/start"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-forest-900 text-canvas-50 font-medium text-sm hover:bg-forest-800 transition-colors"
            >
              <GoogleMark /> Connect with Google <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-lime-500/30 bg-lime-500/[0.06] p-5">
            <div className="font-medium text-sm mb-1.5">⚙️ Google OAuth not configured yet</div>
            <p className="text-sm text-forest-900/65 leading-relaxed mb-2">
              Set <code className="text-xs bg-white px-1.5 py-0.5 rounded border hairline">GOOGLE_OAUTH_CLIENT_ID</code> and{" "}
              <code className="text-xs bg-white px-1.5 py-0.5 rounded border hairline">GOOGLE_OAUTH_CLIENT_SECRET</code> to enable the connect flow.
            </p>
            <p className="text-xs text-forest-900/45">
              The <code className="text-[10px]">business.manage</code> scope needs Google verification — budget 2-6 weeks for approval.
            </p>
          </div>
        )}
      </section>

      {/* Agent */}
      <section>
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-2">AI agent</div>
        <p className="text-sm text-forest-900/55 mb-5 max-w-xl leading-relaxed">
          Every action produces a draft for your review. Nothing is published to your profile automatically.
        </p>
        <AgentPanel actions={actions} connected={connected} />
      </section>

      <div className="mt-12 pt-6 border-t hairline">
        <Link href="/audit" className="text-sm text-forest-900/50 hover:text-forest-900 inline-flex items-center gap-1.5">
          Run a website audit <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Banner({ tone, title, body }) {
  const ok = tone === "ok";
  return (
    <div
      className="rounded-2xl p-5 mb-8 border"
      style={{
        background: ok ? "rgba(126,226,62,0.08)" : "rgba(244,63,94,0.06)",
        borderColor: ok ? "rgba(126,226,62,0.3)" : "rgba(244,63,94,0.25)",
      }}
    >
      <div className="flex items-start gap-3">
        {ok ? <CheckCircle2 className="w-5 h-5 text-lime-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
        <div>
          <div className="font-medium text-sm mb-0.5">{title}</div>
          <p className="text-sm text-forest-900/65">{body}</p>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z" />
    </svg>
  );
}

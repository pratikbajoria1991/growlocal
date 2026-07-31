"use client";
import { useEffect, useState } from "react";
import { MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";

export function Comments({ slug }) {
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", body: "", website: "" });
  const [state, setState] = useState({ sending: false, done: false, error: null, message: null });

  useEffect(() => {
    let alive = true;
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => { if (alive) { setComments(d.comments || []); setLoaded(true); } })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [slug]);

  async function submit(e) {
    e.preventDefault();
    setState({ sending: true, done: false, error: null, message: null });
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...form }),
      });
      const data = await res.json();
      if (!res.ok) return setState({ sending: false, done: false, error: data.error, message: null });
      setState({ sending: false, done: true, error: null, message: data.message || null });
      setForm({ name: "", email: "", body: "", website: "" });
    } catch (err) {
      setState({ sending: false, done: false, error: err.message, message: null });
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-5 sm:px-8 py-10 border-t hairline">
      <h2 className="font-display text-xl sm:text-2xl mb-1.5 inline-flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-lime-600" aria-hidden="true" />
        Questions &amp; comments
      </h2>
      <p className="text-sm text-forest-900/55 mb-7 leading-relaxed">
        Ask anything about this post. Comments are reviewed before they appear, so give it a few hours.
      </p>

      {loaded && comments.length > 0 && (
        <ul className="space-y-4 mb-9">
          {comments.map((c, i) => (
            <li key={i} className="rounded-2xl border hairline bg-white p-5">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="font-medium text-sm">{c.name}</span>
                <time className="text-xs text-forest-900/40" dateTime={c.at}>
                  {new Date(c.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </time>
              </div>
              <p className="text-sm text-forest-900/75 leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {loaded && comments.length === 0 && (
        <p className="text-sm text-forest-900/40 mb-9 italic">No comments yet — be the first to ask something.</p>
      )}

      {state.done ? (
        <div className="rounded-2xl border hairline bg-white p-6">
          <CheckCircle2 className="w-5 h-5 text-lime-600 mb-2.5" aria-hidden="true" />
          <div className="font-medium mb-1.5">Thanks — that&apos;s in the queue.</div>
          <p className="text-sm text-forest-900/60 leading-relaxed">
            {state.message || "We review every comment before publishing, usually within a day."}
          </p>
          <button
            onClick={() => setState({ sending: false, done: false, error: null, message: null })}
            className="mt-4 text-sm text-lime-700 hover:underline"
          >
            Post another
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-2xl border hairline bg-white p-5 sm:p-6 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="c-name" className="block text-xs text-forest-900/55 mb-1.5">Name</label>
              <input
                id="c-name" type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name" suppressHydrationWarning
                className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-canvas-50 outline-none focus:border-lime-500/60 text-sm transition-colors"
              />
            </div>
            <div>
              <label htmlFor="c-email" className="block text-xs text-forest-900/55 mb-1.5">
                Email <span className="text-forest-900/35">(optional, never shown)</span>
              </label>
              <input
                id="c-email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" autoComplete="email"
                data-lpignore="true" suppressHydrationWarning
                className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-canvas-50 outline-none focus:border-lime-500/60 text-sm transition-colors"
              />
            </div>
          </div>

          {/* Honeypot — visually hidden, ignored by real users */}
          <div className="absolute w-px h-px overflow-hidden -m-px" aria-hidden="true">
            <label htmlFor="c-website">Website</label>
            <input
              id="c-website" type="text" tabIndex={-1} autoComplete="off"
              value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="c-body" className="block text-xs text-forest-900/55 mb-1.5">Comment</label>
            <textarea
              id="c-body" required rows={4} value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="What would you like to know?" maxLength={2000} suppressHydrationWarning
              className="w-full px-3.5 py-2.5 rounded-xl border hairline bg-canvas-50 outline-none focus:border-lime-500/60 text-sm leading-relaxed resize-y transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit" disabled={state.sending || form.body.trim().length < 3}
              className="px-5 py-2.5 rounded-xl bg-forest-900 text-canvas-50 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-forest-800 transition-colors"
            >
              {state.sending ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Sending…</> : <><Send className="w-4 h-4" aria-hidden="true" /> Post comment</>}
            </button>
            {form.body.length > 0 && (
              <span className="text-xs text-forest-900/35">{form.body.length}/2000</span>
            )}
          </div>
          {state.error && <p className="text-sm text-rose-500">{state.error}</p>}
        </form>
      )}
    </section>
  );
}

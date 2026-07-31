import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Info } from "lucide-react";
import { getPost, allSlugs, sortedPosts } from "@/lib/posts";
import { BRAND, ORG } from "@/lib/brand";
import { JsonLd, articleSchema, faqSchema, breadcrumbSchema } from "@/lib/schema";
import { Comments } from "@/components/Comments";

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.answer,
    alternates: { canonical: `${BRAND.url}/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.answer,
      publishedTime: post.published,
      authors: [ORG.founder],
      tags: post.tags,
    },
  };
}

export default async function Post({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const wordCount =
    post.answer.split(/\s+/).length +
    post.sections.reduce((n, s) => n + (s.body?.split(/\s+/).length || 0) + (s.list?.join(" ").split(/\s+/).length || 0), 0);

  const others = sortedPosts().filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <>
      <JsonLd data={articleSchema({ ...post, wordCount })} />
      <JsonLd data={faqSchema(post.faq)} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: post.title, path: `/blog/${slug}` },
      ])} />

      <article className="max-w-3xl mx-auto px-5 sm:px-8 pt-12 pb-8">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-forest-900/50 hover:text-forest-900 mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All posts
        </Link>

        <div className="flex items-center gap-3 mb-5 text-[11px] uppercase tracking-wider text-forest-900/40">
          <time dateTime={post.published}>
            {new Date(post.published).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" /> {post.readingMinutes} min read</span>
        </div>

        {/* H1 is the question itself */}
        <h1 className="font-display text-3xl sm:text-[2.75rem] leading-[1.08] tracking-[-0.03em] mb-6 text-balance">
          {post.title}
        </h1>

        {/* Direct answer, set apart — this is the block an answer engine lifts */}
        <div className="rounded-2xl border-l-[3px] border-lime-500 bg-lime-500/[0.06] pl-5 pr-5 py-4 mb-9">
          <div className="text-[10px] uppercase tracking-[0.15em] text-lime-700 font-semibold mb-1.5">Short answer</div>
          <p className="text-[17px] leading-relaxed text-forest-900/85 text-pretty">{post.answer}</p>
        </div>

        <div className="space-y-9">
          {post.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-xl sm:text-2xl leading-snug mb-3 text-balance">{s.heading}</h2>
              {s.body && <p className="text-forest-900/75 leading-[1.75] text-pretty">{s.body}</p>}
              {s.list && (
                <ul className="space-y-2 mt-3">
                  {s.list.map((li) => (
                    <li key={li} className="flex gap-3 text-forest-900/75 leading-relaxed">
                      <span className="mt-[0.6rem] w-1.5 h-1.5 rounded-full bg-lime-500 shrink-0" aria-hidden="true" />
                      <span className="text-pretty">{li}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Per-post FAQ, matching the FAQPage schema */}
        <section className="mt-12 pt-8 border-t hairline">
          <h2 className="font-display text-xl sm:text-2xl mb-5">Related questions</h2>
          <div className="divide-y divide-forest-900/[0.07]">
            {post.faq.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                  <h3 className="font-medium leading-snug">{f.q}</h3>
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full border hairline flex items-center justify-center text-forest-900/40 text-sm group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                </summary>
                <p className="mt-2.5 text-forest-900/70 leading-relaxed text-pretty">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {post.sourceNote && (
          <p className="mt-8 flex items-start gap-2 text-xs text-forest-900/45 leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>Where this question comes from: {post.sourceNote}</span>
          </p>
        )}

        <div className="mt-10 rounded-2xl bg-forest-900 text-canvas-50 p-7">
          <h2 className="font-display text-xl mb-2">Check your own site against this</h2>
          <p className="text-sm text-canvas-50/70 mb-5 leading-relaxed">
            The free audit tests every signal mentioned in this post and scores you out of 100.
          </p>
          <Link href="/audit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-500 text-forest-900 font-semibold text-sm hover:bg-lime-400 transition-colors">
            Run a free audit <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </article>

      <Comments slug={slug} />

      {others.length > 0 && (
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-16 pt-4">
          <h2 className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-4">Keep reading</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {others.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="block h-full rounded-2xl border hairline bg-white p-5 hover:shadow-lift transition-shadow">
                  <h3 className="font-display text-base leading-snug mb-1.5 text-balance">{p.title}</h3>
                  <span className="text-xs text-forest-900/45">{p.readingMinutes} min read</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

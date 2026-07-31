import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { sortedPosts } from "@/lib/posts";
import { BRAND } from "@/lib/brand";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/schema";

export const metadata = {
  title: "Blog — answers to what people actually ask about AEO, GEO and local SEO",
  description:
    "Straight answers to the questions people genuinely ask about Answer Engine Optimization, Generative Engine Optimization, schema markup and local search visibility.",
  alternates: { canonical: `${BRAND.url}/blog` },
};

export default function BlogIndex() {
  const posts = sortedPosts();
  return (
    <>
      <JsonLd data={webPageSchema({ path: "/blog", title: "Growlocal blog", description: metadata.description })} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Blog",
        "@id": `${BRAND.url}/blog#blog`,
        name: `${BRAND.name} blog`,
        description: metadata.description,
        url: `${BRAND.url}/blog`,
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${BRAND.url}/blog/${p.slug}`,
          datePublished: p.published,
        })),
      }} />

      <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-10">
        <div className="text-[11px] uppercase tracking-[0.15em] text-forest-900/35 mb-3">Blog</div>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.03] tracking-[-0.03em] mb-5 text-balance">
          Answers to what people actually ask.
        </h1>
        <p className="text-lg text-forest-900/65 leading-relaxed text-pretty">
          Every post here starts from a question people genuinely ask — the recurring ones from SEO communities,
          practitioner discussion, and the question-shapes that keyword tools surface. One question, one direct answer,
          then the detail.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-16">
        <ul className="divide-y divide-forest-900/[0.07]">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="group block py-7">
                <div className="flex items-center gap-3 mb-2.5 text-[11px] uppercase tracking-wider text-forest-900/40">
                  <time dateTime={p.published}>
                    {new Date(p.published).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" /> {p.readingMinutes} min</span>
                </div>
                <h2 className="font-display text-2xl sm:text-[1.75rem] leading-snug mb-2.5 group-hover:text-lime-700 transition-colors text-balance">
                  {p.title}
                </h2>
                <p className="text-forest-900/65 leading-relaxed mb-4 text-pretty">{p.answer}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-forest-900/5 text-forest-900/55">{t}</span>
                  ))}
                  <ArrowRight className="w-4 h-4 text-lime-600 ml-auto group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

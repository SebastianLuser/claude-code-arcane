---
name: seo-nextjs
description: "Technical SEO for the Next.js App Router: Metadata API, dynamic generateMetadata, sitemap.ts, robots.ts, JSON-LD structured data, Open Graph and canonical. Use when adding or auditing SEO in a Next app."
category: "frontend"
argument-hint: "[metadata|sitemap|jsonld|audit]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# seo-nextjs — Technical SEO for Next.js

## MANDATORY WORKFLOW

**Before generating or modifying code, complete these steps in order.**

### Step 0: Determine the scope
1. New app or an audit of existing SEO?
2. Static, dynamic (DB/CMS) or mixed content?
3. Does it need structured data (JSON-LD) for rich results? (articles, products, FAQ, breadcrumbs)

### Step 1: Base metadata (`app/layout.tsx`)
```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: { default: 'Site', template: '%s · Site' },
  description: '...',
  openGraph: { type: 'website', siteName: 'Site', images: ['/og.png'] },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
};
```

### Step 2: Dynamic metadata (`generateMetadata`)
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { images: [post.cover] },
  };
}
```
Never manual `<meta>` tags in the body — always the Metadata API.

### Step 3: sitemap.ts and robots.ts
```ts
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  return [{ url: 'https://example.com', changeFrequency: 'daily' },
    ...posts.map(p => ({ url: `https://example.com/blog/${p.slug}`, lastModified: p.updatedAt }))];
}
// app/robots.ts → rules + link to the sitemap
```

### Step 4: JSON-LD structured data
```tsx
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article',
    headline: post.title, datePublished: post.date, author: {...} }) }} />
```
Validate with Google's Rich Results Test.

### Step 5: Checklist
- [ ] `metadataBase` set (avoids broken OG URLs)
- [ ] Canonical on every indexable page
- [ ] 1200×630 OG image per important page
- [ ] sitemap.ts + robots.ts present
- [ ] JSON-LD wherever a rich result applies
- [ ] No accidental `noindex` in prod
- [ ] Healthy LCP/CLS (see the `nextjs-best-practices` skill)

## Wrap-up

Validate the structured data with Google's Rich Results Test and the meta tags with the browser inspector. If the checklist passes → SEO **READY**. Confirm changes with the user before writing. Next step: the `nextjs-best-practices` skill for Web Vitals, or `ai-seo` for content strategy.

---

_Inspired by the SEO skills in [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills). Adapted to the Arcane format. Related: the `ai-seo` skill._

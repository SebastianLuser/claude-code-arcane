---
name: seo-nextjs
description: "SEO técnico para Next.js App Router: Metadata API, generateMetadata dinámico, sitemap.ts, robots.ts, JSON-LD structured data, Open Graph y canonical. Usar al agregar o auditar SEO en una app Next."
category: "frontend"
argument-hint: "[metadata|sitemap|jsonld|audit]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# seo-nextjs — SEO técnico para Next.js

## MANDATORY WORKFLOW

**Antes de generar o modificar código, completar estos pasos en orden.**

### Step 0: Determinar scope
1. ¿App nueva o auditoría de SEO existente?
2. ¿Contenido estático, dinámico (DB/CMS) o mixto?
3. ¿Necesita structured data (JSON-LD) para rich results? (artículos, productos, FAQ, breadcrumbs)

### Step 1: Metadata base (`app/layout.tsx`)
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

### Step 2: Metadata dinámica (`generateMetadata`)
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
Nunca tags `<meta>` manuales en el body — siempre la Metadata API.

### Step 3: sitemap.ts y robots.ts
```ts
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  return [{ url: 'https://example.com', changeFrequency: 'daily' },
    ...posts.map(p => ({ url: `https://example.com/blog/${p.slug}`, lastModified: p.updatedAt }))];
}
// app/robots.ts → reglas + link al sitemap
```

### Step 4: JSON-LD structured data
```tsx
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article',
    headline: post.title, datePublished: post.date, author: {...} }) }} />
```
Validar con Rich Results Test de Google.

### Step 5: Checklist
- [ ] `metadataBase` seteado (evita URLs OG rotas)
- [ ] Canonical en cada page indexable
- [ ] OG image 1200×630 por page importante
- [ ] sitemap.ts + robots.ts presentes
- [ ] JSON-LD donde aplique rich result
- [ ] Sin `noindex` accidental en prod
- [ ] LCP/CLS sanos (ver skill `nextjs-best-practices`)

## Cierre

Validar el structured data con el Rich Results Test de Google y los meta tags con el inspector del navegador. Si el checklist pasa → SEO **READY**. Confirmar cambios con el usuario antes de escribir. Siguiente paso: skill `nextjs-best-practices` para Web Vitals, o `ai-seo` para estrategia de contenido.

---

_Inspirado en las skills de SEO de [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills). Adaptado al formato Arcane. Relacionado: skill `ai-seo`._

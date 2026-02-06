# WikiThat.com — Technical & SEO Audit
**Date:** February 5, 2026

---

## Executive Summary

WikiThat.com has **three critical issues** blocking all SEO value from the site. Until these are resolved, the site is effectively invisible to Google despite the SSR migration being complete.

---

## Issue 1: CRITICAL — Thai Gambling Spam in Google SERP Title

**What's happening:** When you Google `wikithat.com`, the title shows:
> "ABBET สล็อตเว็บตรง PG SLOT แตกง่าย 100% สมัครฟรี โบนัสดีที่สุด"

This is a classic **SEO spam injection attack** — a well-documented black hat technique where attackers modify `<title>` tags on compromised domains to promote gambling/casino sites. The Sucuri security blog has tracked this exact pattern since 2018 across 50,000+ sites.

**Two possible causes:**

1. **Inherited from previous owner** — The domain's old wiki platform may have been compromised before you bought it. Google cached the infected title and hasn't recrawled since your new site went live.
2. **Active injection** — Less likely if you deployed fresh on Railway/Vercel, but worth checking.

**Immediate actions:**
- Check your page source: `curl -s https://wikithat.com | grep -i '<title>'` — confirm the actual `<title>` tag being served is "WikiThat" (or whatever you set), not the spam text.
- If the `<title>` is clean in source, this is a stale Google cache issue. Request re-indexing via Google Search Console → URL Inspection → Request Indexing.
- If the `<title>` contains the Thai text, you have an active compromise. Check your deployment for injected scripts, especially any base64-encoded JS or conditional rendering that serves different content to bots vs browsers.
- File a **Google Outdated Content Removal** request at https://search.google.com/search-console/remove-outdated-content if the content doesn't match reality.

---

## Issue 2: CRITICAL — Homepage Returns Empty HTML to Crawlers

**What's happening:** When fetching `https://wikithat.com/` as a crawler/bot, the response body contains only:
```
WikiThat
```
No rendered HTML content. No headings, no text, no links, nothing.

**Why this matters:** If Googlebot sees an empty page, it has nothing to index. Your Wikipedia vs Grokipedia comparison tool, search bar, popular topics, voting mechanism — none of it exists in Google's view.

**Diagnosis:** This suggests the SSR migration may not be fully working. Possible causes:
- Next.js `getServerSideProps` or `generateStaticParams` not configured for the homepage
- Content is still being loaded client-side via `useEffect` after hydration
- API calls to Grokipedia/Wikipedia happening in the browser, not during server render

**How to verify:**
```bash
# Check what the server actually sends (no JS execution)
curl -s https://wikithat.com | head -100

# Compare with what a JS-enabled browser sees
# If curl shows empty but browser shows content = SSR is NOT working
```

**Fix:** Ensure the homepage component fetches and renders at least:
- Page title and description in `<head>`
- H1 tag with site name/value prop
- Popular comparison topics as actual HTML links (not JS-rendered)
- A search bar form element
- Structured data (JSON-LD) for the site

---

## Issue 3: CRITICAL — Google Index Full of Ghost Pages from Previous Owner

**What's happening:** A `site:wikithat.com` search shows the old wiki platform's content still indexed:
- `/wiki/be65d228.../Galaxies_---/Galaxies` — Galaxy article from old owner
- `/wiki/6fd65aa9.../How_it_Works/...` — Old "How it Works" revenue sharing page
- `/wiki/4c95023d.../Neptune/...` — Neptune article from old platform

These old `/wiki/UUID/...` URLs return 404 errors when accessed directly, which is good — but Google hasn't deindexed them yet.

**Meanwhile, ZERO new pages are indexed.** A search for `"wikithat.com" wikipedia grokipedia compare` returns absolutely nothing.

**Actions:**
1. **Return 410 (Gone) instead of 404 for old `/wiki/*` paths.** A 410 tells Google "this is permanently removed" vs 404 which means "maybe temporarily missing." Google processes 410s faster.

   In Next.js middleware or route handler:
   ```typescript
   // middleware.ts
   if (request.nextUrl.pathname.startsWith('/wiki/')) {
     return new Response(null, { status: 410 });
   }
   ```

2. **Submit a sitemap.xml** with ALL your new pages. Currently there appears to be no sitemap. Create one at `https://wikithat.com/sitemap.xml` listing every comparison page you want indexed.

3. **Add a robots.txt:**
   ```
   User-agent: *
   Allow: /
   Disallow: /wiki/
   
   Sitemap: https://wikithat.com/sitemap.xml
   ```

4. **Use Google Search Console bulk removal tool** to request removal of old `/wiki/` URLs if there are many.

---

## Issue 4: No Discoverability for New Content

**Problem:** Even if someone searches for exactly what WikiThat does — comparing Wikipedia and Grok AI articles — nothing from your site appears.

**Root cause chain:**
1. Empty HTML → Google can't see content → nothing to index
2. No sitemap → Google doesn't know what pages exist
3. No internal linking structure → Google can't crawl between pages
4. No backlinks yet → Google has no external signals

**SEO foundation checklist:**

| Item | Status | Priority |
|------|--------|----------|
| `<title>` tag unique per page | ❓ Unknown (check) | P0 |
| `<meta description>` per page | ❓ Unknown | P0 |
| H1 tag on every page | ❌ Missing (empty HTML) | P0 |
| Server-side rendered content | ❌ Not working | P0 |
| sitemap.xml | ❌ Missing | P0 |
| robots.txt | ❌ Missing | P1 |
| Canonical URLs | ❓ Unknown | P1 |
| Open Graph tags | ❓ Unknown | P1 |
| JSON-LD structured data | ❌ Missing | P1 |
| Internal links between comparisons | ❓ Unknown | P2 |
| 410 responses for old /wiki/ paths | ❌ Returning 404 | P2 |

---

## Recommended Fix Priority

### This Week (Blocks Everything)
1. **Verify and fix SSR** — The homepage MUST serve rendered HTML without JavaScript. This is the #1 blocker.
2. **Fix the `<title>` tag spam** — Request re-indexing or file removal request in Search Console.
3. **Deploy robots.txt and sitemap.xml**

### Next Week
4. Return 410 for `/wiki/*` routes
5. Add meta descriptions and Open Graph tags to all pages
6. Submit sitemap to Google Search Console
7. Use URL Inspection tool to verify Googlebot sees rendered content

### Ongoing
8. Build internal linking between comparison pages
9. Create content-rich landing pages for high-volume comparison topics
10. Start link building (the SEO strategy from your January conversation)

---

## Quick Wins

- **Google Search Console setup** (if not done): Verify ownership, submit sitemap, inspect URLs. This is free and gives you direct visibility into what Google sees.
- **Bing Webmaster Tools**: Submit there too — Bing often indexes faster and sends early traffic signals.
- **Check Railway/Vercel logs**: Confirm Googlebot is actually reaching your server and what response codes it's getting.
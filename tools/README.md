# Getting new pages crawled

Ship a page, and `sitemap.xml` and `feed.xml` update themselves on deploy.
There is one manual step left, and it is manual because Google made it manual.

## What runs automatically

`.github/workflows/deploy-pages.yml` runs on every push to `main`:

1. `node tools/build-seo.mjs` — rewrites `sitemap.xml` and `feed.xml` from the
   pages that exist on disk. A new page is in both the moment it ships. No list
   to remember to update.
2. Deploys to GitHub Pages.
3. `node tools/ping-indexnow.mjs` — submits the URLs this push changed to
   IndexNow.

You can run the generator locally too: `node tools/build-seo.mjs`. It prints
every URL with the date it chose and where the date came from.

## The one manual step

**A brand-new post: paste its URL into Search Console and press Request
Indexing.** Takes fifteen seconds and it is the single fastest lever there is.

Everything below explains why that step cannot be automated, so nobody spends
an afternoon looking for the API again.

## Which doors are open, tested

| Route | Status | Reaches |
|---|---|---|
| Sitemap `lastmod` | Open, automated | Google |
| RSS feed at `/feed.xml` | Open, automated | Google, readers |
| IndexNow | Open, automated | Bing, Yandex, DuckDuckGo, Brave, Ecosia |
| Search Console "Request Indexing" | Open, manual | Google, fastest |
| Google sitemap ping | **Closed** | — |
| Google Indexing API | **Closed for blog posts** | — |

Closed, verified rather than assumed:

- `google.com/ping?sitemap=` returns **HTTP 404** with the body "Sitemaps ping
  is deprecated." Retired June 2023.
- The Indexing API "can only be used to crawl pages with either `JobPosting` or
  `BroadcastEvent` embedded in a `VideoObject`." A brand-history post is
  neither.
- The Search Console API can resubmit a sitemap, but it cannot request indexing
  of a URL. Its URL inspection endpoint is read-only.

So there is no sanctioned button to press for Google from a script. What is
left is making the signals Google does read as accurate as possible, which is
what the generator is for.

## Why lastmod is computed carefully

Google honours `<lastmod>` only if it is "consistently and verifiably
accurate." Pad it and Google stops trusting the field **sitewide** — which
would cost more than it gains. So the generator, in order:

1. Uses the post's own `dateModified` from its JSON-LD. The page already tells
   Google that date; the sitemap should not invent a second answer.
2. Otherwise takes the newest commit that touched the file **and touched five
   files or fewer**. A commit that rewrites the nav across twenty pages is a
   template change, not a content change. Letting a sweep like that bump every
   date at once is exactly the pattern that gets `lastmod` ignored.
3. Otherwise the commit that first added the file.

If you genuinely rewrite an old post, update its `dateModified` in the JSON-LD.
That is the one field worth keeping honest by hand.

## Adding or excluding a page

Nothing to configure — any directory with an `index.html` is picked up. To keep
one out of the sitemap, add its path segment to `EXCLUDE` in
`tools/build-seo.mjs`. Currently excluded: `privacy-policy`, `terms-of-service`.

## IndexNow key

The key lives in `tools/ping-indexnow.mjs` and must match the filename and
contents of the `<key>.txt` file at the repo root. If you rotate one, rotate
both. The script checks the key file is being served before submitting and
skips quietly if it is not, so a broken key never fails a deploy.

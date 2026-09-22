"""Insert the follow card above "Related stories" on every non-Personal post.

Category comes from blog/index.html (the fn-card__cat label), so a new post
picks up the right variant as long as it is listed there. Idempotent: an
existing card is replaced, so edit the copy here and re-run.

    python3 tools/add-follow-cta.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
START, END = "<!-- follow-cta -->", "<!-- /follow-cta -->"
ANCHOR = '    <section class="related post-related"'

YT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>'
LI = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.73v20.53C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.73C24 .78 23.2 0 22.22 0z"/></svg>'

YT_URL = "https://youtube.com/@brandorigins"
LI_URL = "https://www.linkedin.com/in/chrisgarin/"


def btn(url, icon, label, primary=False):
    cls = "follow-cta__btn follow-cta__btn--primary" if primary else "follow-cta__btn"
    return f'<a class="{cls}" href="{url}" target="_blank" rel="noopener noreferrer">{icon}{label}</a>'


VARIANTS = {
    "Brand Origins": dict(
        kicker="Brand Origins",
        title="Like this story? There are more on YouTube.",
        text="I also run Brand Origins, a YouTube channel about the stories behind the brands we grew up with. 27K people subscribe.",
        actions=[btn(YT_URL, YT, "Watch on YouTube", True), btn(LI_URL, LI, "Follow me on LinkedIn")],
    ),
    "Explainer": dict(
        kicker="Written by Chris Garin",
        title="Want the next explainer?",
        text="I break down Philippine business and money news in plain language. Follow me on LinkedIn to catch the next one.",
        actions=[btn(LI_URL, LI, "Follow me on LinkedIn", True), btn(YT_URL, YT, "Brand Origins on YouTube")],
    ),
    "Playbook": dict(
        kicker="Written by Chris Garin",
        title="More of what actually works",
        text="I share real marketing plays from small businesses, the ones that worked and the ones that didn't. Follow me on LinkedIn for the next one.",
        actions=[btn(LI_URL, LI, "Follow me on LinkedIn", True)],
    ),
}


def card(v):
    return (
        f'{START}\n'
        f'    <aside class="follow-cta" aria-label="Follow Chris Garin">\n'
        f'      <img class="follow-cta__avatar" src="/images/chrisgarin2.png" alt="Chris Garin" width="56" height="56" loading="lazy">\n'
        f'      <div class="follow-cta__body">\n'
        f'        <p class="follow-cta__kicker">{v["kicker"]}</p>\n'
        f'        <h2 class="follow-cta__title">{v["title"]}</h2>\n'
        f'        <p class="follow-cta__text">{v["text"]}</p>\n'
        f'        <div class="follow-cta__actions">{"".join(v["actions"])}</div>\n'
        f'      </div>\n'
        f'    </aside>\n'
        f'    {END}\n'
    )


index = (ROOT / "blog/index.html").read_text()
cats = {}
for m in re.finditer(r'<a[^>]*href="/blog/([^/"]+)/"[^>]*>(.*?)</a>', index, re.S):
    c = re.search(r'fn-card__cat">([^<]+)', m.group(2))
    if c:
        cats[m.group(1)] = c.group(1).strip()

done, skipped = [], []
for slug, cat in sorted(cats.items()):
    if cat not in VARIANTS:
        continue
    path = ROOT / "blog" / slug / "index.html"
    html = path.read_text()
    html = re.sub(re.escape(START) + r".*?" + re.escape(END) + r"\n", "", html, flags=re.S)
    if ANCHOR not in html:
        skipped.append(slug)
        continue
    html = html.replace(ANCHOR, "    " + card(VARIANTS[cat]) + "\n" + ANCHOR, 1)
    path.write_text(html)
    done.append(f"{cat}: {slug}")

print("\n".join(done))
print(f"\n{len(done)} posts updated" + (f", skipped (no Related section): {skipped}" if skipped else ""))

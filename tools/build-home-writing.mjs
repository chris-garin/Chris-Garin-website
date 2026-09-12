#!/usr/bin/env node
/**
 * Fills the homepage "I write stuff too." teaser with the newest Personal posts.
 *
 * Run it locally with `node tools/build-home-writing.mjs`. CI runs it before
 * every deploy, so publishing a Personal post on the Field Notes index is all
 * it takes for the homepage to pick it up.
 *
 * Where the data comes from
 * -------------------------
 * Posts do not declare their own category; the only place a category lives is
 * the card on blog/index.html. So that page is the source of truth: every
 * `.fn-item[data-cat="Personal"]` card there is a candidate, copied verbatim
 * (tone, title, excerpt, date) so the homepage never drifts from Field Notes.
 * Order comes from each post's own JSON-LD datePublished, falling back to the
 * card's printed date, so a card placed out of order on the index still sorts
 * correctly here.
 *
 * Everything between the two markers in index.html is overwritten.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATEGORY = 'Personal';
const COUNT = 3;
const START = '<!-- home-writing:start -->';
const END = '<!-- home-writing:end -->';
const INDENT = '      ';

const blogIndex = readFileSync(join(ROOT, 'blog/index.html'), 'utf8');

/** `<article class="fn-item" data-cat="Personal">` ... `</article>` bodies. */
const ITEM = new RegExp(
  `<article class="fn-item" data-cat="${CATEGORY}">\\s*([\\s\\S]*?)\\s*</article>`,
  'g'
);

const postDate = (href, cardHtml) => {
  const file = join(ROOT, href.replace(/^\/|\/$/g, ''), 'index.html');
  if (existsSync(file)) {
    const m = readFileSync(file, 'utf8').match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  const printed = (cardHtml.match(/class="fn-card__date">([^<]+)</) || [])[1];
  const d = printed ? new Date(`${printed} UTC`) : null;
  return d && !isNaN(d) ? d.toISOString().slice(0, 10) : '0000-00-00';
};

const seen = new Set();
const cards = [];
for (const [, card] of blogIndex.matchAll(ITEM)) {
  const href = (card.match(/<a class="fn-card" href="([^"]+)"/) || [])[1];
  if (!href || seen.has(href)) continue;
  seen.add(href);
  cards.push({ href, card, date: postDate(href, card) });
}

// Stable sort: posts sharing a date keep their Field Notes order.
const picked = cards.sort((a, b) => b.date.localeCompare(a.date)).slice(0, COUNT);
if (picked.length === 0) {
  console.error(`build-home-writing: no ${CATEGORY} cards found in blog/index.html, homepage left alone`);
  process.exit(1);
}

/** Re-indent a card lifted from the index so it sits cleanly in the grid. */
const reindent = (html) => {
  const lines = html.split('\n');
  const base = Math.min(
    ...lines.slice(1).filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length)
  );
  return lines
    .map((l, i) => (i === 0 ? l.trim() : l.slice(base)))
    .map((l) => (l.trim() ? INDENT + '  ' + l : l))
    .join('\n');
};

const block = picked
  .map(
    ({ card }) =>
      `${INDENT}<article class="fn-item" data-reveal="scroll">\n${reindent(card)}\n${INDENT}</article>`
  )
  .join('\n');

const homePath = join(ROOT, 'index.html');
const home = readFileSync(homePath, 'utf8');
const s = home.indexOf(START);
const e = home.indexOf(END);
if (s === -1 || e === -1 || e < s) {
  console.error('build-home-writing: markers missing from index.html, homepage left alone');
  process.exit(1);
}

const next = `${home.slice(0, s + START.length)}\n${block}\n${INDENT}${home.slice(e)}`;
if (next !== home) writeFileSync(homePath, next);

console.log(`homepage writing teaser  ${picked.length} ${CATEGORY} posts${next === home ? ' (unchanged)' : ''}`);
for (const p of picked) console.log(`  ${p.date}  ${p.href}`);

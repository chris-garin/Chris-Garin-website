/**
 * Builds blog/search-index.json for the Field Notes search box.
 *
 * One entry per post listed on blog/index.html: its slug and the plain text
 * of its <article class="article-content">, with the Sources list dropped so
 * searching "Inquirer" does not match every post that cites it. Titles are
 * not stored here; the page already has them on the cards and matches them
 * before this file has even loaded.
 *
 * Runs on deploy (see .github/workflows/deploy-pages.yml), so a new post is
 * searchable the moment it ships. Run locally with:
 *   node tools/build-search-index.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const blogIndex = readFileSync(join(ROOT, 'blog/index.html'), 'utf8');

const slugs = [...new Set(
  [...blogIndex.matchAll(/class="fn-card" href="\/blog\/([^/"]+)\/"/g)].map((m) => m[1])
)];

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  mdash: '—', ndash: '–', hellip: '…', middot: '·', bull: '•',
  eacute: 'é', ntilde: 'ñ', uuml: 'ü', Uuml: 'Ü', ouml: 'ö',
  auml: 'ä', aacute: 'á', iacute: 'í', oacute: 'ó', uacute: 'ú',
  times: '×', peso: '₱', deg: '°', copy: '©', reg: '®', trade: '™' };

function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return NAMED[e] ?? m;
  });
}

const posts = [];
for (const slug of slugs) {
  const file = join(ROOT, 'blog', slug, 'index.html');
  if (!existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  const start = html.indexOf('<article class="article-content');
  if (start === -1) continue;
  let body = html.slice(start, html.indexOf('</article>', start));
  const sources = body.search(/<h2[^>]*>\s*Sources\s*<\/h2>/i);
  if (sources !== -1) body = body.slice(0, sources);

  const text = decode(
    body
      .replace(/<(script|style|iframe|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();

  posts.push({ slug, text });
}

writeFileSync(join(ROOT, 'blog/search-index.json'), JSON.stringify(posts));
const kb = (JSON.stringify(posts).length / 1024).toFixed(0);
console.log(`search-index.json: ${posts.length} posts, ${kb} KB`);

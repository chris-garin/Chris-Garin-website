/**
 * Turns HTML entities (&rsquo;, &#8217;, &amp; ...) back into plain characters.
 * Shared by build-search-index.mjs and build-seo.mjs, so text pulled out of a
 * page's HTML is clean before it is re-escaped for JSON or XML.
 */
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  mdash: '—', ndash: '–', hellip: '…', middot: '·', bull: '•',
  eacute: 'é', ntilde: 'ñ', uuml: 'ü', Uuml: 'Ü', ouml: 'ö',
  auml: 'ä', aacute: 'á', iacute: 'í', oacute: 'ó', uacute: 'ú',
  times: '×', peso: '₱', deg: '°', copy: '©', reg: '®', trade: '™' };

export function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return NAMED[e] ?? m;
  });
}

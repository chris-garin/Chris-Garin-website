#!/usr/bin/env node
/**
 * Submits the URLs changed by the current push to IndexNow.
 *
 * IndexNow is the one instant-notification protocol that actually exists for
 * a static blog. Bing, Yandex, DuckDuckGo, Brave and Ecosia consume it and
 * usually crawl within minutes. Google does NOT participate — its sitemap
 * ping endpoint was retired in 2023 and its Indexing API is restricted to
 * JobPosting and BroadcastEvent pages, so Google is reached through accurate
 * <lastmod> dates, the RSS feed, and the Request Indexing button in Search
 * Console. See tools/README.md.
 *
 * Verifies the key file is actually being served before submitting, because
 * IndexNow rejects the whole batch if it cannot fetch it.
 */

import { execFileSync } from 'node:child_process';

const ORIGIN = 'https://chrisgarin.com';
const KEY = '4677ea3b6f7969b0d62244ea5706508c';
const KEY_URL = `${ORIGIN}/${KEY}.txt`;

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();

/** Pages touched by this push, as public URLs. */
function changedUrls() {
  let files;
  try {
    files = git('diff', '--name-only', 'HEAD~1', 'HEAD').split('\n');
  } catch {
    files = git('ls-files').split('\n');
  }
  const urls = files
    .filter((f) => f.endsWith('index.html'))
    .map((f) => ORIGIN + '/' + f.replace(/index\.html$/, ''));
  return [...new Set(urls)];
}

const urlList = changedUrls();
if (urlList.length === 0) {
  console.log('no pages changed, nothing to submit');
  process.exit(0);
}

const keyCheck = await fetch(KEY_URL).catch(() => null);
if (!keyCheck || !keyCheck.ok) {
  console.log(`key file not reachable at ${KEY_URL} yet, skipping this run`);
  process.exit(0);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: 'chrisgarin.com',
    key: KEY,
    keyLocation: KEY_URL,
    urlList,
  }),
});

console.log(`IndexNow HTTP ${res.status} for ${urlList.length} url(s):`);
for (const u of urlList) console.log('  ' + u);

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const siteUrl = (process.env.SITE_URL || 'https://jarryuser.github.io/kindalibre-translate').replace(/\/+$/, '');

writeFileSync(join(dist, '.nojekyll'), '');
console.log('Built dist/.nojekyll');

try {
  execSync('npx gh-pages -d dist --dotfiles', { cwd: root, stdio: 'inherit' });
} catch {
  console.error('gh-pages publish failed. The gh-pages branch was not updated.');
  process.exit(1);
}

const index = readFileSync(join(dist, 'index.html'), 'utf8');
const assetPattern = /<script\b[^>]*\ssrc="([^\"]*assets\/index-[A-Za-z0-9_-]+\.js)"/;
const match = index.match(assetPattern);
if (!match) {
  console.error('Could not determine the built asset name.');
  process.exit(1);
}
const url = new URL(match[1], `${siteUrl}/`).href;
const timeoutMs = 5 * 60 * 1000;
const deadline = Date.now() + timeoutMs;

console.log(`Waiting for ${siteUrl}/ to reference ${url}...`);
for (let remaining = deadline - Date.now(); remaining > 0; remaining = deadline - Date.now()) {
  const signal = AbortSignal.timeout(Math.min(10000, remaining));
  try {
    const pageUrl = `${siteUrl}/?deploy=${Date.now()}`;
    const page = await fetch(pageUrl, { signal });
    const script = page.ok ? (await page.text()).match(assetPattern)?.[1] : undefined;
    if (script && new URL(script, page.url || pageUrl).href === url) {
      const res = await fetch(url, { method: 'HEAD', signal });
      if (res.ok) {
        console.log(`Live site is serving ${url}`);
        process.exit(0);
      }
    }
  } catch {
    // network hiccup, retry
  }
  await new Promise((r) => setTimeout(r, Math.min(10000, Math.max(0, deadline - Date.now()))));
}

console.error(
  `Site still not serving a page with a working ${url} after ${timeoutMs / 1000}s. ` +
    'The gh-pages branch was pushed but GitHub Pages has not published the new build. ' +
    'Check the Pages build status on GitHub (Settings > Pages) or run `npm run deploy` again.',
);
process.exit(1);

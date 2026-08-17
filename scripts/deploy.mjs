import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE_URL = process.env.SITE_URL || 'https://jarryuser.github.io/kindalibre-translate';

writeFileSync(join(dist, '.nojekyll'), '');
console.log('Built dist/.nojekyll');

try {
  execSync('npx gh-pages -d dist --dotfiles', { cwd: root, stdio: 'inherit' });
} catch {
  console.error('gh-pages publish failed. The gh-pages branch was not updated.');
  process.exit(1);
}

const index = readFileSync(join(dist, 'index.html'), 'utf8');
const match = index.match(/assets\/index-[A-Za-z0-9_-]+\.js/);
if (!match) {
  console.error('Could not determine the built asset name.');
  process.exit(1);
}
const asset = match[0];
const url = `${SITE_URL}/${asset}`;
const timeoutMs = 5 * 60 * 1000;
const start = Date.now();

console.log(`Waiting for ${url} to go live...`);
while (Date.now() - start < timeoutMs) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) {
      console.log(`Live site is serving ${asset}`);
      process.exit(0);
    }
  } catch {
    // network hiccup, retry
  }
  await new Promise((r) => setTimeout(r, 10000));
}

console.error(
  `Site still not serving ${url} after ${timeoutMs / 1000}s. ` +
    'The gh-pages branch was pushed but GitHub Pages has not published the new build. ' +
    'Check the Pages build status on GitHub (Settings > Pages) or run `npm run deploy` again.',
);
process.exit(1);

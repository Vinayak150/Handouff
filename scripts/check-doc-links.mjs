import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

// Check local Markdown paths; external URLs and anchor fragments are out of scope.
const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', 'dist']);
const markdown = [];
function walk(folder) {
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    if (ignored.has(item.name)) continue;
    const path = join(folder, item.name);
    if (item.isDirectory()) walk(path);
    else if (item.isFile() && item.name.endsWith('.md')) markdown.push(path);
  }
}
walk(root);

const errors = [];
let checked = 0;
for (const filename of markdown) {
  const raw = readFileSync(filename, 'utf8');
  const withoutCode = raw.replace(/^\x60\x60\x60[^\n]*\n[\s\S]*?^\x60\x60\x60\s*$/gm, '');
  for (const match of withoutCode.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, '').split(/\s+["']/)[0];
    if (!target || target.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    const relativePath = target.split(/[?#]/)[0];
    if (!relativePath) continue;
    let destination;
    try { destination = resolve(dirname(filename), decodeURIComponent(relativePath)); }
    catch { errors.push(`${relative(root, filename)}: invalid URL ${target}`); continue; }
    checked++;
    if ((destination !== root && !destination.startsWith(root + sep)) || !existsSync(destination)) {
      errors.push(`${relative(root, filename)}: missing local path ${target}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Documentation paths PASS: ${checked} local links across ${markdown.length} Markdown files`);
}

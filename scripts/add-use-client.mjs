import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const dirs = [
  'components/ui',
  'components/search',
];

let fixed = 0;
for (const dir of dirs) {
  const full = join(process.cwd(), dir);
  let files;
  try { files = readdirSync(full); } catch { continue; }
  for (const f of files) {
    if (!f.endsWith('.tsx') && !f.endsWith('.ts')) continue;
    const fp = join(full, f);
    if (statSync(fp).isDirectory()) continue;
    const content = readFileSync(fp, 'utf8');
    if (!content.trimStart().startsWith("'use client'")) {
      writeFileSync(fp, `'use client';\n\n${content}`);
      fixed++;
      console.log('  +', f);
    }
  }
}
console.log(`\nFixed: ${fixed} files`);

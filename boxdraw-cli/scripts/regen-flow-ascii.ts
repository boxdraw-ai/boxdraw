/**
 * Pipe `diagrams/install-flow/diagram.json` through the local boxdraw
 * binary and rewrite `src/diagram.ts` so the install CLI ships with
 * the freshly-rendered ASCII baked in.
 *
 *   pnpm regen-flow-ascii
 *
 * Run after touching the install-flow diagram source. Same idea as
 * `boxdraw-web/scripts/regen-diagrams.ts`; trimmed because we have
 * exactly one diagram to manage and don't need timing.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const SRC_JSON = resolve(ROOT, 'diagrams/install-flow/diagram.json');
const OUT_BOXDRAW = resolve(ROOT, 'diagrams/install-flow/diagram.boxdraw');
const OUT_TS = resolve(ROOT, 'src/diagram.ts');
const BOXDRAW = resolve(ROOT, '../boxdraw/target/release/boxdraw');

const json = readFileSync(SRC_JSON, 'utf-8');
const proc = spawnSync(BOXDRAW, [], { input: json, encoding: 'utf-8' });
if (proc.status !== 0) {
  throw new Error(`boxdraw exited ${proc.status}: ${proc.stderr}`);
}
const ascii = proc.stdout.replace(/\n+$/, ''); // trim trailing blank lines

writeFileSync(OUT_BOXDRAW, ascii + '\n');

const ts = `/**
 * The install-flow diagram, baked in at build time.
 *
 * It's \`boxdraw\`'s own output, generated from
 * \`diagrams/install-flow/diagram.json\` via:
 *
 *   pnpm regen-flow-ascii
 *
 * We bake it as a string instead of fetching the live API on first
 * run because (a) we want zero network before the user has even said
 * yes, and (b) the install CLI is itself a billboard for the product
 * — showing boxdraw's output during install IS the demo.
 */

// The script \`scripts/regen-flow-ascii.ts\` writes this file; everything
// after the marker is the rendered ASCII. Don't hand-edit.
export const INSTALL_FLOW_ASCII = \`${ascii.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
`;
writeFileSync(OUT_TS, ts);

console.log(`refreshed install-flow diagram (${ascii.length} chars)`);

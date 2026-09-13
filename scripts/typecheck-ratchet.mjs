#!/usr/bin/env node
/**
 * Typecheck, and fail if the error count went up.
 *
 * This repo has a long standing set of type errors. Gating on zero would mean
 * a permanently red build that everyone learns to ignore, so instead the count
 * is pinned: a change may not add errors, and when it removes some the baseline
 * is expected to come down with it.
 *
 * Run `npm run typecheck` for the errors themselves.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const BASELINE_FILE = new URL('../.typecheck-baseline', import.meta.url);

let output = '';
try {
  output = execSync('npx tsc -p tsconfig.app.json --noEmit', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (err) {
  output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
}

const count = output.split('\n').filter((line) => / error TS\d+: /.test(line)).length;
const baseline = Number(readFileSync(BASELINE_FILE, 'utf8').trim());

if (Number.isNaN(baseline)) {
  console.error('Could not read .typecheck-baseline');
  process.exit(1);
}

if (count > baseline) {
  console.error(`Typecheck errors went up: ${baseline} -> ${count}`);
  console.error('New errors:\n');
  console.error(output.split('\n').filter((l) => / error TS\d+: /.test(l)).join('\n'));
  process.exit(1);
}

if (count < baseline) {
  if (process.argv.includes('--update')) {
    writeFileSync(BASELINE_FILE, `${count}\n`);
    console.log(`Baseline lowered: ${baseline} -> ${count}`);
  } else {
    console.error(
      `Typecheck errors went down: ${baseline} -> ${count}. ` +
        'Run `npm run typecheck:ratchet -- --update` and commit .typecheck-baseline.',
    );
    process.exit(1);
  }
} else {
  console.log(`Typecheck errors unchanged at ${count}.`);
}

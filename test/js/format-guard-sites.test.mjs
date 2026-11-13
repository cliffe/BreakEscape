// Step 7 phase 2: the static scan that keeps every request site behind the fetch guard.
// It fails on a module-level stored fetch reference, on an XMLHttpRequest, sendBeacon or
// engine-route this.load.json that bypasses the wrapper (bar the bootstrap load in
// core/game.js), and on a format-guard.js import that is not main.js's first import.
// Run with: node test/js/format-guard-sites.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

// Remove line and block comments while keeping string contents, so a comment that names
// XMLHttpRequest or fetch is not mistaken for code.
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let str = null; // the open quote char, or null
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (str) {
      out += c;
      if (c === '\\') { out += d ?? ''; i += 2; continue; }
      if (c === str) str = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { str = c; out += c; i += 1; continue; }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i += 1; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i += 1; i += 2; continue; }
    out += c;
    i += 1;
  }
  return out;
}

const files = walk(js);

test('no module file keeps a fetch reference at module or property level', () => {
  const capture = /(?:\b(?:const|let|var)\s+[\w$]+|this\.[\w$]+)\s*=\s*(?:window\.|self\.|globalThis\.)?fetch\b(?!\s*\()/;
  const offenders = [];
  for (const f of files) {
    const code = stripComments(readFileSync(f, 'utf8'));
    if (capture.test(code)) offenders.push(relative(js, f));
  }
  assert.deepEqual(offenders, [], `a stored fetch reference bypasses the guard: ${offenders.join(', ')}`);
});

test('no XMLHttpRequest or navigator.sendBeacon in the engine JS', () => {
  const offenders = [];
  for (const f of files) {
    const code = stripComments(readFileSync(f, 'utf8'));
    if (/\bXMLHttpRequest\b/.test(code) || /navigator\.sendBeacon\b/.test(code)) offenders.push(relative(js, f));
  }
  assert.deepEqual(offenders, [], `an XHR or sendBeacon bypasses the guard: ${offenders.join(', ')}`);
});

test('the only engine-route this.load.json is the bootstrap in core/game.js', () => {
  const route = /\/scenario\b|\/room\/|\/sync_state\b|\/unlock\b|apiBasePath|\/break_escape\/games\//;
  const offenders = [];
  for (const f of files) {
    const code = stripComments(readFileSync(f, 'utf8'));
    const re = /\.load\.json\(\s*(['"`])([^'"`]+)\1\s*,\s*([^)]*)\)/g;
    let m;
    while ((m = re.exec(code))) {
      const key = m[2];
      const arg = m[3];
      const isBootstrap = relative(js, f) === 'core/game.js' && key === 'gameScenarioJSON';
      if (isBootstrap) continue;
      if (route.test(arg)) offenders.push(`${relative(js, f)}: ${key}`);
    }
  }
  assert.deepEqual(offenders, [], `a load.json to an engine route bypasses the guard: ${offenders.join(', ')}`);
});

test('core/game.js still loads the bootstrap by XHR under the gameScenarioJSON key', () => {
  const code = stripComments(readFileSync(join(js, 'core/game.js'), 'utf8'));
  assert.match(code, /\.load\.json\(\s*['"`]gameScenarioJSON['"`]/, 'the bootstrap load.json must stay, as the one exception');
});

test('format-guard.js is the first import of main.js', () => {
  const main = readFileSync(join(js, 'main.js'), 'utf8');
  const firstImport = main.match(/^\s*import\s+[^\n]*$/m);
  assert.ok(firstImport, 'main.js has at least one import');
  assert.match(firstImport[0], /['"]\.\/format-guard\.js['"]/, `first import was: ${firstImport[0]}`);
});

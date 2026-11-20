// `minigame-active` is read by the JS (objectives-panel.js, npc-barks.js) but nothing ever adds it to
// any element, so the CSS rule `.minigame-active .objectives-panel` could never match. It was removed.
// If a future change starts adding the class, add the rule back and update this pin.
// Run with: node --test test/js/objectives-css-no-dead-minigame-active.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('objectives.css has no .minigame-active selector', () => {
  const css = readFileSync(join(root, 'public/break_escape/css/objectives.css'), 'utf8');
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/\.minigame-active/.test(code), 'dead .minigame-active rule is gone');
  assert.ok(/\.objectives-panel\.hidden\s*\{[^}]*display:\s*none/.test(code), '.hidden still hides the panel');
});

test('no engine file adds the minigame-active class', () => {
  const files = [];
  const walk = d => { for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p); else if (/\.(js|mjs|erb)$/.test(e.name)) files.push(p);
  } };
  walk(join(root, 'public/break_escape/js'));
  walk(join(root, 'app/views'));
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    assert.ok(!/classList\.(add|toggle)\(\s*['"]minigame-active/.test(src), f + ' adds minigame-active');
    assert.ok(!/className\s*\+?=[^;\n]*minigame-active/.test(src), f + ' sets minigame-active by className');
  }
});

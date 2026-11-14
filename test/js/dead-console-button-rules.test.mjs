// UI backlog 3: console and minigame button rules whose class nothing creates any more were removed.
// Each class below has no markup in public/break_escape/js or app/views; this keeps the rules from
// coming back and fails if a script starts to create one of them without a rule being restored.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const walk = (d, ext, out = []) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (ext.some(e => f.endsWith(e))) out.push(p);
  }
  return out;
};
const cssFiles = walk(join(pub, 'css'), ['.css']);
const markupFiles = [...walk(join(pub, 'js'), ['.js']), ...walk(join(here, '../../app/views'), ['.erb'])];
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

const DEAD = ['cms-button', 'cms-button-primary', 'cms-button-secondary', 'dli-investigate-btn',
  'ip-confirm-btn', 'ip-modal-btn', 'ip-modal-buttons', 'laptop-close-btn', 'notes-minigame-buttons-container',
  'bluetooth-scan-btn', 'panel-close', 'ransomware-display-btn', 'sh-close-btn',
  'vpn-close-btn', 'vpn-flag-btn'];

test('no stylesheet has a rule for a console button class that nothing creates', () => {
  for (const f of cssFiles) {
    const css = strip(readFileSync(f, 'utf8'));
    for (const c of DEAD) {
      assert.ok(!new RegExp(`\\.${c}(?![\\w-])`).test(css), `${f.split('/').pop()} still styles .${c}`);
    }
  }
});

test('no script or view creates those classes (so the rules were dead, not just unreferenced by CSS)', () => {
  const src = markupFiles.map(f => readFileSync(f, 'utf8')).join('\n');
  for (const c of DEAD) assert.ok(!src.includes(c), `${c} is used in markup`);
});

// One compact-HUD rule: ui/hud-lanes.js isCompactViewport is the only JS copy (objectives-panel.js
// and tutorial-manager.js import it), and its thresholds are pinned to the CSS media queries.
// Run with: node test/js/compact-hud-rule.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape');
const L = await import(pathToFileURL(join(root, 'js/ui/hud-lanes.js')).href);
const { isCompactViewport: c } = L;

// Boundaries: under 900 wide, or 500 tall or less.
for (const [w, h, want] of [
  [899, 800, true], [900, 800, false], [901, 800, false],
  [1200, 499, true], [1200, 500, true], [1200, 501, false],
  [899, 499, true], [900, 501, false], [1024, 500, true], [844, 390, true], [390, 844, true],
]) assert.ok(c(w, h) === want, `isCompactViewport(${w},${h}) should be ${want}`);

// The CSS media queries carry the same numbers.
const css = readFileSync(join(root, 'css/objectives.css'), 'utf8');
const maxW = [...css.matchAll(/max-width:\s*([\d.]+)px/g)].map(m => parseFloat(m[1]));
const maxH = [...css.matchAll(/max-height:\s*([\d.]+)px/g)].map(m => parseFloat(m[1]));
assert.ok(maxW.includes(L.COMPACT_MAX_WIDTH_EXCL - 0.02), `CSS has max-width ${L.COMPACT_MAX_WIDTH_EXCL - 0.02}px`);
assert.ok(maxH.includes(L.COMPACT_MAX_HEIGHT), `CSS has max-height ${L.COMPACT_MAX_HEIGHT}px`);
// Same pair in the other stylesheets that restate the rule.
for (const f of ['ui-themes.css', 'hud.css']) {
  const t = readFileSync(join(root, 'css', f), 'utf8');
  assert.ok(t.includes(`max-width: ${L.COMPACT_MAX_WIDTH_EXCL - 0.02}px`), `${f} has the width breakpoint`);
}
// min-height companions sit one pixel above the height limit.
assert.ok(/min-height:\s*501px/.test(css), 'CSS min-height 501px pairs with max-height 500px');

// No second copy in the JS.
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
for (const f of walk(join(root, 'js')).filter(p => p.endsWith('.js'))) {
  const s = readFileSync(f, 'utf8');
  if (f.endsWith('ui/hud-lanes.js')) continue;
  assert.ok(!/innerWidth\s*<\s*900|innerHeight\s*<=\s*500/.test(s), `${f} restates the compact rule`);
}
for (const f of ['js/ui/objectives-panel.js', 'js/systems/tutorial-manager.js']) {
  assert.ok(/import \{ isCompactViewport \} from '(\.\.|\.)\/(ui\/)?hud-lanes\.js'/.test(readFileSync(join(root, f), 'utf8')), `${f} imports the helper`);
}
console.log('compact-hud-rule ok');

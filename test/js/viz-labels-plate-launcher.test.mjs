// Visualiser map labels (>= 8px or hidden), the credits plate, and the VM launcher palette.
// Run with: node --max-old-space-size=2048 test/js/viz-labels-plate-launcher.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape');
const js = readFileSync(join(root, 'js/music/bond-visualiser.js'), 'utf8');
const vizCss = readFileSync(join(root, 'css/bond-visualiser.css'), 'utf8');
const launcherCss = readFileSync(join(root, 'css/vm-launcher-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const frameCss = readFileSync(join(root, 'css/device-frame.css'), 'utf8');

test('no Press Start 2P canvas label is set under 8px', () => {
  const sizes = [...js.matchAll(/(\d+(?:\.\d+)?)px "Press Start 2P"/g)].map(m => Number(m[1]));
  assert.ok(sizes.length > 5, 'found the canvas fonts');
  for (const s of sizes) assert.ok(s >= 8 && s % 8 === 0 || s === 18 || s === 20 || s >= 8, `font ${s}px`);
  assert.deepEqual(sizes.filter(s => s < 8), []);
  assert.doesNotMatch(js, /font\s*=\s*'[0-7]px/);
  assert.match(js, /const MIN_LABEL_PX = 8;/);
  assert.match(js, /fontPx = layout\[0\]\.w >= 640 \? 2 \* MIN_LABEL_PX : MIN_LABEL_PX/);
  assert.match(js, /Math\.max\(MIN_LABEL_PX,size\)/);
});

test('fitLabelText keeps a label that fits, drops the marker, then hides', () => {
  const src = /function fitLabelText[\s\S]*?\n}\n/.exec(js)[0];
  const fit = new Function(`${src}; return fitLabelText;`)();
  const m = t => t.length * 8;
  assert.equal(fit(m, '▸ THREAT SCORE', 200), '▸ THREAT SCORE');
  assert.equal(fit(m, '▸ THREAT SCORE', 112), 'THREAT SCORE'.length * 8 <= 112 ? 'THREAT SCORE' : '');
  assert.equal(fit(m, '▸ THREAT SCORE', 60), '');
  assert.equal(fit(m, 'ABC', 24), 'ABC');
  assert.equal(fit(m, 'ABC', 23), '');
  assert.equal(fit(m, '', 0), '');
});

test('map and panel titles go through fitLabelText', () => {
  assert.match(js, /fitLabelText\(t=>_visCtx\.measureText\(t\)\.width,title,w-8\)/);
  assert.match(js, /fitLabelText\(t=>_visCtx\.measureText\(t\)\.width,'BREAK ESCAPE \/\/ GLOBAL THREAT MAP'/);
});

test('the credits label has an opaque flat plate with a 2px border', () => {
  const rule = /#bv-credits-overlay #bv-cr-label\.bv-cr-label \{([^}]*)\}/.exec(vizCss)[1].replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(rule, /background:\s*#000;/);
  assert.match(rule, /border:\s*2px solid var\(--bv-gold-dim/);
  assert.doesNotMatch(rule, /rgba|gradient|blur|radius|backdrop-filter|opacity/);
  assert.match(rule, /padding:\s*8px 16px;/);
  // the inline styles that JS sets on the label must not clear the plate
  assert.doesNotMatch(js, /label\.style\.cssText = [^;\n]*background/);
});

test('the VM launcher uses the shared device palette, no colours of its own', () => {
  assert.deepEqual(launcherCss.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? [], []);
  for (const t of ['face', 'edge', 'text', 'dim', 'info', 'danger', 'accent', 'button']) {
    assert.match(launcherCss, new RegExp(`var\\(--device-palette-${t}\\)`), t);
    assert.match(frameCss, new RegExp(`--device-palette-${t}:\\s*#[0-9a-f]{6};`), `defined: ${t}`);
  }
  assert.match(frameCss, /--device-frame-edge:\s*var\(--device-palette-edge\)/);
  assert.match(frameCss, /--device-frame-face:\s*var\(--device-palette-face\)/);
  assert.match(frameCss, /--device-frame-text:\s*var\(--device-palette-text\)/);
});

test('launcher text colours reach 4.5:1 on the face and the button fill', () => {
  const pal = Object.fromEntries([...frameCss.matchAll(/--device-palette-(\w+):\s*(#[0-9a-f]{6});/g)].map(m => [m[1], m[2]]));
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  for (const bg of ['face', 'button']) for (const fg of ['text', 'dim', 'accent', 'info', 'danger']) {
    assert.ok(ratio(pal[bg], pal[fg]) >= 4.5, `${fg} on ${bg}: ${ratio(pal[bg], pal[fg]).toFixed(1)}`);
  }
});

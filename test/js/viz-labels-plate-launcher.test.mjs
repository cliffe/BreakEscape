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
  assert.ok(sizes.length >= 2, 'found the literal canvas fonts');
  for (const s of sizes) assert.ok(s >= 8, `font ${s}px`);
  assert.deepEqual(sizes.filter(s => s < 8), []);
  assert.doesNotMatch(js, /font\s*=\s*'[0-7]px/);
  assert.match(js, /const MIN_LABEL_PX = 8;/);
  assert.match(js, /fontPx = layout\[0\]\.w >= 640 \? 2 \* MIN_LABEL_PX : MIN_LABEL_PX/);
  assert.match(js, /Math\.max\(MIN_LABEL_PX,size\)/);
});

test('every Press Start 2P canvas font is on the 8px grid with no weight keyword', () => {
  const fonts = [...js.matchAll(/(?:font\s*=\s*)[`'"]([^`'"\n]*Press Start 2P[^`'"\n]*)[`'"]/g)].map(m => m[1]);
  assert.ok(fonts.length >= 10, `found ${fonts.length} fonts`);
  for (const f of fonts) {
    assert.doesNotMatch(f, /\b(bold|bolder|[1-9]00)\b/, f);
    const px = /(?:^|\s)(\d+|\$\{[^}]+\})px/.exec(f);
    assert.ok(px, f);
    if (/^\d+$/.test(px[1])) assert.equal(Number(px[1]) % 8, 0, f);
    else assert.match(px[1], /MIN_LABEL_PX|fontPx|Math\.max\(MIN_LABEL_PX/, f); // 8 or 16 by construction
  }
  assert.doesNotMatch(js, /(18|20)px "Press Start 2P"/);
});

test('CCTV room label is fitted left of the REC tag, hidden when it will not fit', () => {
  const src = /function fitLabelText[\s\S]*?\n}\n/.exec(js)[0] + /function cctvLabelMaxW[\s\S]*?\n}\n/.exec(js)[0];
  const { fit, maxW } = new Function(`const PIX = 4; ${src}; return { fit: fitLabelText, maxW: cctvLabelMaxW };`)();
  const m = t => t.length * 8;
  const room = maxW(160, 8);
  assert.equal(room, 160 - 16 - 40 - 4);
  assert.equal(fit(m, 'MAIN OFFICE AREA', room), '', 'a 160px cell hides the long room name');
  assert.equal(fit(m, 'SERVER', room), 'SERVER');
  assert.ok(fit(m, 'MAIN OFFICE AREA', maxW(400, 8)) === 'MAIN OFFICE AREA', 'a wide cell keeps it');
  assert.match(js, /fitLabelText\(t => _visCtx\.measureText\(t\)\.width, feed\.label, cctvLabelMaxW\(w, fontPx\)\)/);
});

test('MITRE labels are drawn only when the ring spacing and the panel allow', () => {
  const src = /function mitreLabelsFit[\s\S]*?\n}\n/.exec(js)[0];
  const fit = new Function(`${src}; return mitreLabelsFit;`)();
  const m = t => t.length * 8;
  const tac = ['RECON','RESOURCE','INITIAL','EXEC','PERSIST','PRIV-ESC','DEFENSE','CRED','DISCOVERY','LATERAL','COLLECT','C2','EXFIL','IMPACT'];
  assert.equal(fit(m, tac, 300, 200, 80, 100, 400), false, 'R=80: 36px spacing is under a 5-letter label');
  assert.equal(fit(m, tac, 300, 200, 30, 260, 80), false, 'phone ring is far too tight');
  assert.equal(fit(m, tac, 300, 200, 120, 100, 400), true, 'wide ring inside a wide panel');
  assert.equal(fit(m, tac, 300, 200, 120, 190, 220), false, 'spacing fine but labels leave the panel');
  assert.match(js, /if \(active && showTactics\)/);
});

test('city labels skip any that would sit on one already drawn', () => {
  const src = /function boxesOverlap[\s\S]*?\n}\n/.exec(js)[0];
  const ov = new Function(`${src}; return boxesOverlap;`)();
  assert.equal(ov({ x: 0, y: 0, w: 56, h: 8 }, { x: 40, y: 4, w: 64, h: 8 }), true);
  assert.equal(ov({ x: 0, y: 0, w: 56, h: 8 }, { x: 56, y: 0, w: 64, h: 8 }), false);
  assert.equal(ov({ x: 0, y: 0, w: 56, h: 8 }, { x: 10, y: 8, w: 64, h: 8 }), false);
  assert.match(js, /cityBoxes\.some\(b=>boxesOverlap\(b,box\)\)/);
});

test('8px canvas text is drawn at whole-pixel origins', () => {
  for (const re of [/fillText\(t\.slice\(0,5\),Math\.round\(tx-8\),Math\.round\(ty-4\)\)/, /fillText\('MOTION', Math\.round\(bx\), Math\.round\(by - PIX \* 2\)\)/, /Math\.round\(col1X\+col1W\/2\),Math\.round\(c1y\+40\)/, /_visCtx\.fillText\(city\[0\],lx,ly\)/]) assert.match(js, re);
});

test('SIEM panel titles reach 4.5:1 on the panel background and the plate fallback matches its token', () => {
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const cols = [...js.matchAll(/panelBox\([^;]*'▸ (?:SCORE HISTORY|FREQ BANDS|EVENT TOTALS)','(#[0-9a-fA-F]{6})'\)/g)].map(m => m[1]);
  assert.equal(cols.length, 3);
  for (const c of cols) assert.ok((lum(c) + 0.05) / (lum('#00040a') + 0.05) >= 4.5, c);
  const token = /--bv-gold-dim:\s*(#[0-9a-f]{6})/i.exec(vizCss)[1].toLowerCase();
  const falls = [...vizCss.matchAll(/var\(--bv-gold-dim,\s*(#[0-9a-f]{6})\)/gi)].map(m => m[1].toLowerCase());
  assert.ok(falls.length >= 2);
  for (const f of falls) assert.equal(f, token);
});

test('the launcher status tag does not look like a button, and the card is not a click target', () => {
  const tag = /\.vm-status\.console \{([^}]*)\}/.exec(launcherCss)[1];
  assert.match(tag, /border:\s*2px dashed/);
  assert.doesNotMatch(tag, /palette-button/);
  assert.doesNotMatch(/\.vm-card \{[^}]*\}/.exec(launcherCss)[0], /cursor:\s*pointer/);
  assert.doesNotMatch(launcherCss, /\.vm-card:hover/);
});

test('fitLabelText keeps a label that fits, drops the marker, then hides', () => {
  const src = /function fitLabelText[\s\S]*?\n}\n/.exec(js)[0];
  const fit = new Function(`${src}; return fitLabelText;`)();
  const m = t => t.length * 8;
  assert.equal(fit(m, '▸ THREAT SCORE', 200), '▸ THREAT SCORE');
  assert.equal(fit(m, '▸ THREAT SCORE', 100), 'THREAT SCORE');
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

test('the themes do not override the launcher content colours', () => {
  const themes = readFileSync(join(root, 'css/ui-themes.css'), 'utf8');
  assert.doesNotMatch(themes, /\[data-ui-theme\] \.vm-card/);
  assert.doesNotMatch(themes, /\[data-ui-theme\] \.vm-launcher-description/);
  assert.match(launcherCss, /\.vm-launcher \{[^}]*background:\s*var\(--device-palette-face\)/);
});

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
  const fonts = [...js.matchAll(/font\s*=\s*(['`])((?:(?!\1)[^\n])*Press Start 2P(?:(?!\1)[^\n])*)\1/g)].map(m => m[2]);
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

test('CCTV room label is fitted left of the REC tag; REC gives way before the name does', () => {
  const src = ['fitLabelText', 'cctvLabelMaxW', 'cctvCellLabel'].map(n => new RegExp(`function ${n}[\\s\\S]*?\\n}\\n`).exec(js)[0]).join('');
  const { fit, maxW, cell } = new Function(`const PIX = 4; ${src}; return { fit: fitLabelText, maxW: cctvLabelMaxW, cell: cctvCellLabel };`)();
  const m = t => t.length * 8;
  const room = maxW(160, 8);
  assert.equal(room, 160 - 16 - 40 - 4);
  assert.equal(fit(m, 'SERVER', room), 'SERVER');
  assert.ok(fit(m, 'MAIN OFFICE AREA', maxW(400, 8)) === 'MAIN OFFICE AREA', 'a wide cell keeps it');
  assert.deepEqual(cell(m, 'SERVER', 160, 8), { text: 'SERVER', rec: true }, 'fits beside REC: both drawn');
  // a 168px phone cell: 16 glyphs = 128px, beside-REC room is 108px, alone room is 152px
  assert.deepEqual(cell(m, 'MAIN OFFICE AREA', 168, 8), { text: 'MAIN OFFICE AREA', rec: false }, 'REC dropped, name kept');
  assert.deepEqual(cell(m, 'CONFERENCE ROOM', 168, 8), { text: 'CONFERENCE ROOM', rec: false });
  assert.deepEqual(cell(m, 'A VERY LONG ROOM NAME INDEED', 168, 8), { text: '', rec: true }, 'too long even alone: name hidden, REC kept');
  assert.match(js, /cctvCellLabel\(t => _visCtx\.measureText\(t\)\.width, feed\.label, w, fontPx\)/);
  assert.match(js, /if \(recOn && cellRec\)/);
});

test('the MOTION tag stays below the CAM/time header row and inside its cell', () => {
  const src = /function motionTagPos[\s\S]*?\n}\n/.exec(js)[0];
  const pos = new Function(`const PIX = 4; ${src}; return motionTagPos;`)();
  const x = 100, y = 50, w = 168, fontPx = 8, tw = 48, header = y + 8 + fontPx; // header baseline
  const high = pos(x + 40, y + 6, 40, x, y, w, fontPx, tw); // box top near the cell top
  assert.ok(high.y - fontPx >= header, `glyph top ${high.y - fontPx} is below the header baseline ${header}`);
  const normal = pos(x + 40, y + 60, 40, x, y, w, fontPx, tw);
  assert.equal(normal.y, y + 60 - 8, 'a box well down the cell keeps the usual two-pixel-unit lift');
  const right = pos(x + w - 10, y + 60, 40, x, y, w, fontPx, tw);
  assert.ok(right.x + tw <= x + w - 8, 'right edge inside the cell');
  const left = pos(x - 20, y + 60, 40, x, y, w, fontPx, tw);
  assert.ok(left.x >= x + 8, 'left edge inside the cell');
  for (const r of [high, normal, right, left]) assert.ok(Number.isInteger(r.x) && Number.isInteger(r.y));
  assert.match(js, /motionTagPos\(bx, by, bw, x, y, w, fontPx, _visCtx\.measureText\('MOTION'\)\.width\)/);
  assert.match(js, /if \(mp\) _visCtx\.fillText\('MOTION', mp\.x, mp\.y\)/, 'a null position skips the tag');
});

test('the clamped MOTION tag never touches any bracket arm, or is skipped', () => {
  const src = /function motionTagPos[\s\S]*?\n}\n/.exec(js)[0];
  const pos = new Function(`const PIX = 4; ${src}; return motionTagPos;`)();
  const hit = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
  const PIX = 4, k = 12, x = 100, y = 50;
  let clampedSeen = 0, shown = 0;
  for (const fontPx of [8, 16]) for (let h = 72; h <= 140; h += h < 112 ? 4 : 28) for (let w = 140; w <= 420; w += 20)
    for (const mid of [0.51, 0.6, 0.75, 0.9, 1]) for (const dx of [-1, -0.5, 0, 0.5, 1]) for (const dy of [-1, -0.5, 0, 0.5, 1]) {
    const tw = fontPx * 6;
    const bw = w * (0.18 + mid * 0.15), bh = h * (0.25 + mid * 0.2);
    const bx = x + w * 0.5 + dx * w * 0.2 - bw / 2, by = y + h * 0.55 + dy * h * 0.08 - bh / 2; // dy is the cos drift
    const p = pos(bx, by, bw, x, y, w, fontPx, tw);
    if (y + 8 + fontPx * 2 + 4 > by - 4) clampedSeen++;
    if (!p) continue;
    shown++;
    const tag = [p.x, p.y - fontPx, tw, fontPx];
    const arms = [[bx, by, k, PIX], [bx, by, PIX, k], [bx + bw - k, by, k, PIX], [bx + bw - PIX, by, PIX, k],
                  [bx, by + bh - PIX, k, PIX], [bx, by + bh - k, PIX, k], [bx + bw - k, by + bh - PIX, k, PIX], [bx + bw - PIX, by + bh - k, PIX, k]];
    arms.forEach((a, i) => assert.ok(!hit(tag, a), `tag ${tag} hits arm ${i} ${a} (h=${h} font=${fontPx} w=${w} mid=${mid} dx=${dx} dy=${dy})`));
    assert.ok(Number.isInteger(p.x) && Number.isInteger(p.y));
    assert.ok(p.x >= x + 8 && p.x + tw <= x + w - 8, 'inside the cell');
  }
  assert.ok(clampedSeen > 1000, 'the clamp case is exercised');
  assert.ok(shown > 1000, 'the tag is normally shown');
  // nothing fits: a tiny cell with a box that fills it
  assert.equal(pos(x + 4, y + 10, 100, x, y, 140, 16, 96), null, 'no clear spot: tag skipped');
});

test('MITRE labels: full names, else 3-letter codes, else none', () => {
  const src = ['mitreLabelsFit', 'mitreLabelMode'].map(n => new RegExp(`function ${n}[\\s\\S]*?\\n}\\n`).exec(js)[0]).join('');
  const codes = /const MITRE_CODES = (\[[^\]]*\]);/.exec(js)[1];
  const mode = new Function(`const MITRE_CODES = ${codes}; ${src}; return mitreLabelMode;`)();
  const m = t => t.length * 8;
  const tac = ['RECON','RESOURCE','INITIAL','EXEC','PERSIST','PRIV-ESC','DEFENSE','CRED','DISCOVERY','LATERAL','COLLECT','C2','EXFIL','IMPACT'];
  const cds = JSON.parse(codes.replace(/'/g, '"'));
  assert.equal(cds.length, tac.length);
  assert.equal(new Set(cds).size, cds.length, 'codes are distinct');
  cds.forEach((c, i) => assert.ok(c.length <= 3 && tac[i].startsWith(c[0]), `${c} for ${tac[i]}`));
  assert.equal(mode(m, tac, 300, 600, 200, 0, 800), 'full', 'wide ring: whole names (76px spacing needs R 170)');
  assert.equal(mode(m, tac, 300, 200, 120, 100, 400), 'code', 'R=120: whole names do not fit, never cut to 5 letters');
  assert.equal(mode(m, tac, 300, 200, 80, 100, 400), 'code', 'R=80: 36px spacing is under 76 but over 28');
  assert.equal(mode(m, tac, 300, 200, 30, 260, 80), 'none', 'phone ring is far too tight');
  assert.equal(mode(m, tac, 300, 200, 120, 190, 220), 'none', 'spacing fine but even codes leave the panel');
  assert.equal(mode(m, tac, 300, 200, 80, 224, 150), 'none', 'codes fit the spacing but not the panel');
  assert.doesNotMatch(js, /t\.slice\(0,\s*5\)/, 'no tactic name is sliced');
  const block = js.slice(js.indexOf('const tacticMode=mitreLabelMode'), js.indexOf('const tacticMode=mitreLabelMode') + 1500);
  assert.match(block, /fillText\(tacticMode==='code'\?MITRE_CODES\[i\]:t,/, 'draws a whole name or a code');
  assert.doesNotMatch(block.split('\n').slice(0, 25).join('\n'), /\bt\.(slice|substring|substr)\(/, 'no tactic name is cut in the MITRE label block');
  assert.match(js, /tacticMode!=='none'/);
  assert.match(js, /tacticMode==='code'\?MITRE_CODES\[i\]/);
});

test('city labels are drawn after the dots and pulses, and keep a gap from each other', () => {
  const src = /function boxesOverlap[\s\S]*?\n}\n/.exec(js)[0];
  const ov = new Function(`${src}; return boxesOverlap;`)();
  assert.equal(ov({ x: 0, y: 0, w: 56, h: 8 }, { x: 40, y: 4, w: 64, h: 8 }), true);
  assert.equal(ov({ x: 0, y: 0, w: 56, h: 8 }, { x: 56, y: 0, w: 64, h: 8 }), false);
  assert.equal(ov({ x: 0, y: 0, w: 56, h: 8 }, { x: 10, y: 8, w: 64, h: 8 }), false);
  assert.match(js, /const LABEL_GAP = 2;/);
  const gap = Number(/const LABEL_GAP = (\d+);/.exec(js)[1]);
  assert.ok(gap >= 2);
  // the padded box makes labels 1px apart collide, and 2px apart pass
  const padded = (x, w) => ({ x, y: 0, w: w + gap, h: 8 + gap });
  assert.equal(ov(padded(0, 56), padded(57, 64)), true, '1px apart is too close');
  assert.equal(ov(padded(0, 56), padded(58, 64)), false, '2px apart is allowed');
  assert.match(js, /w:Math\.ceil\(lw\)\+LABEL_GAP,h:MIN_LABEL_PX\+LABEL_GAP/);
  assert.match(js, /cityBoxes\.some\(b=>boxesOverlap\(b,box\)\)/);
  // the fillText happens in a second loop that follows the pulses loop
  const pulses = js.indexOf('for (const p of mapPulses)');
  const second = js.indexOf('for (const l of cityLabels)');
  assert.ok(pulses > 0 && second > pulses, 'labels drawn after the pulses');
  assert.doesNotMatch(js.slice(js.indexOf('const cityBoxes'), pulses), /fillText\(city\[0\]/, 'not drawn in the city loop');
});

test('8px canvas text is drawn at whole-pixel origins', () => {
  for (const re of [/MITRE_CODES\[i\]:t,Math\.round\(tx-8\),Math\.round\(ty-4\)\)/, /x: Math\.round\(Math\.max\(x \+ pad/, /Math\.ceil\(bx \+ PIX \* 4\)/, /Math\.round\(col1X\+col1W\/2\),Math\.round\(c1y\+40\)/, /_visCtx\.fillText\(l\.name,l\.lx,l\.ly\)/, /lx=Math\.round\(lx\)/]) assert.match(js, re);
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
});

test('the launcher is a device frame: the face is the frame\'s, the window is clear and unthemed, so there is no band', () => {
  const themes = readFileSync(join(root, 'css/ui-themes.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const win = /\.minigame-container\[data-minigame="vm-launcher"\] > \.minigame-game-container \{([^}]*)\}/.exec(launcherCss);
  assert.ok(win, 'window rule in the launcher stylesheet');
  assert.match(win[1], /background:\s*none/);
  // no themed frame on the window any more: the shared device frame draws it
  assert.doesNotMatch(themes, /data-minigame="vm-launcher"\] > \.minigame-game-container/);
  // the inner launcher div does not carry the face (the frame does)
  assert.doesNotMatch(/\.vm-launcher \{[^}]*\}/.exec(launcherCss)[0], /background/);
});

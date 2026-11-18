// bond-visualiser.css follows the pixel-art UI rules: no smooth gradients (hard-stop repeating
// stripes only), no blur in text-shadow/box-shadow/filter, no type under 8px.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/bond-visualiser.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

let failed = 0;
function check(name, ok, detail = '') {
  if (ok) console.log(`PASS ${name}`);
  else { failed++; console.log(`FAIL ${name} ${detail}`); }
}

// split on commas outside brackets
function splitTop(s) {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
// body of fn( ... ) starting at index of the opening bracket
function bracketBody(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++;
    if (s[i] === ')' && --depth === 0) return s.slice(open + 1, i);
  }
  return '';
}

// 1. gradients: only repeating hard-stop stripes
const gradRe = /([a-z-]*gradient)\(/g;
let m, gradients = 0;
while ((m = gradRe.exec(css))) {
  gradients++;
  const name = m[1];
  const body = bracketBody(css, m.index + m[0].length - 1);
  if (!name.startsWith('repeating-')) { check(`gradient ${name} is a hard-stop stripe`, false, body.slice(0, 60)); continue; }
  const parts = splitTop(body).filter(p => !/^(\d+deg|to\s)/.test(p));
  const stops = parts.map(p => {
    const mm = p.match(/^(.*?)(?:\s+(-?[\d.]+(?:px|%)))?$/);
    return { colour: mm[1].trim(), pos: mm[2] || null };
  });
  let ok = true;
  for (let i = 1; i < stops.length; i++) {
    if (stops[i].colour !== stops[i - 1].colour && stops[i].pos !== stops[i - 1].pos && stops[i].pos !== null) ok = false;
  }
  check(`repeating gradient has hard stops: ${body.replace(/\s+/g, ' ').slice(0, 50)}`, ok);
}
check('scanline and meter stripes still present', gradients >= 3, `found ${gradients}`);

const js = readFileSync(join(here, '../../public/break_escape/js/music/bond-visualiser.js'), 'utf8');
const glow = (js.match(/const _GLOW_DARK\s*=\s*'([^']*)'/) || [])[1] || '';
const jsInline = js.replace(/\$\{_GLOW_DARK\}/g, glow);

// the parser the scan uses: blur radius (3rd length) of one shadow, or null if it has fewer than 3
function shadowBlur(sh) {
  const lengths = sh.replace(/rgba?\([^)]*\)|hsla?\([^)]*\)|var\([^)]*\)|#[0-9a-fA-F]{3,8}\b|\binset\b|\b[a-z]+\b/g, ' ').match(/-?[\d.]+(px|em|rem)?/g) || [];
  return lengths.length >= 3 ? parseFloat(lengths[2]) : null;
}
check('shadow parser ignores hex colours', shadowBlur('2px 2px #997a00') === null && shadowBlur('2px 2px 0 #997a00') === 0 && shadowBlur('0 0 6px #000') === 6);

// 2. blur radius in shadows (CSS file, then inline styles in the JS)
let shadows = 0, blurry = [];
const shadowDecls = [
  ...[...css.matchAll(/(text-shadow|box-shadow)\s*:\s*([^;}]+)/g)].map(x => [x[1], x[2]]),
  ...[...jsInline.matchAll(/(text-shadow|box-shadow)\s*:\s*([^;`'"]+)/g)].map(x => [x[1], x[2]]),
  ...[...jsInline.matchAll(/(?:textShadow|boxShadow)\s*=\s*(['"`])(.*?)\1/g)].map(x => ['js-style', x[2]]),
];
for (const dm of shadowDecls.map(([a, b]) => [null, a, b])) {
  if (/^(none|inherit|initial|unset)$/.test(dm[2].trim())) continue;
  for (const sh of splitTop(dm[2])) {
    shadows++;
    const blur = shadowBlur(sh);
    if (blur !== null && blur !== 0) blurry.push(`${dm[1]}: ${sh}`);
  }
}
check('no blur radius in text-shadow or box-shadow', blurry.length === 0, blurry.join(' | '));
check('shadows were parsed', shadows > 5, `parsed ${shadows}`);

// 3. filters
check('no filter blur or drop-shadow', !/filter\s*:[^;}]*(blur|drop-shadow)/.test(css) && !/backdrop-filter/.test(css));
check('no inline filter blur or drop-shadow in the JS', !/filter\s*:[^;`'"]*(blur|drop-shadow)/.test(js) && !/\.style\.filter\s*=/.test(js) && !/backdrop-filter/.test(js));
check('no non-zero border-radius in the CSS', [...css.matchAll(/border-radius\s*:\s*([^;}]+)/g)].every(x => /^0(px)?$/.test(x[1].trim())));

// 4. font sizes
const small = [...css.matchAll(/font-size\s*:\s*([\d.]+)px/g)].filter(x => parseFloat(x[1]) < 8).map(x => x[0]);
check('no font-size under 8px', small.length === 0, small.join(', '));

// 5. GNF font sizes: multiples of 8 from 16px. The family is resolved per rule: its own
// font-family, else the nearest ancestor-prefix rule that sets one (e.g. ".bv-track-info span"
// inherits ".bv-track-info"). The .bv-cr-* classes sit on elements that also carry .bv-cr-line
// (GNF), which a stylesheet walk cannot see, so they are mapped to it by name.
const flat = css.replace(/@media[^{]*\{/g, '').replace(/\}\s*\}/g, '}');
const rules = [...flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(r => ({
  sel: r[1].trim().split(',')[0].trim(),
  family: (r[2].match(/font-family\s*:\s*([^;]+)/) || [])[1],
  size: (r[2].match(/font-size\s*:\s*([\d.]+)px/) || [])[1],
}));
function familyOf(sel) {
  const parts = sel.split(/\s+/);
  for (let n = parts.length; n >= 1; n--) {
    const prefix = parts.slice(0, n).join(' ');
    const own = rules.find(r => r.sel === prefix && r.family);
    if (own) return own.family;
  }
  if (/^\.bv-cr-(title|subtitle|section-header|entry|warning|gap)/.test(sel)) return "'GNF'";
  if (sel.startsWith('#bond-vis-overlay')) return "'Press Start 2P'";
  return null;
}
const badGnf = [], badPs2p = [], unresolved = [];
for (const r of rules) {
  if (!r.size) continue;
  const fam = familyOf(r.sel);
  if (!fam) { unresolved.push(r.sel); continue; }
  if (/Press Start/.test(fam) && parseFloat(r.size) % 8 !== 0) badPs2p.push(`${r.sel} ${r.size}px`);
  if (/GNF/.test(fam)) {
    const px = parseFloat(r.size);
    if (px < 16 || px % 8 !== 0) badGnf.push(`${r.sel} ${px}px`);
  }
}
check('every GNF font-size is a multiple of 8 from 16px', badGnf.length === 0, badGnf.join(', '));
check('every Press Start 2P font-size is a multiple of 8', badPs2p.length === 0, badPs2p.join(', '));
if (unresolved.length) console.log(`NOTE font-family not resolved from CSS for: ${unresolved.join(' | ')}`);

// 6. inline font sizes in the JS: the family and size sit in the same style string (one line)
const badInline = [], unresolvedInline = [];
for (const m2 of js.matchAll(/font-size\s*:\s*([\d.]+)px/g)) {
  const a = js.lastIndexOf('\n', m2.index) + 1, z = js.indexOf('\n', m2.index);
  const line = js.slice(a, z < 0 ? undefined : z);
  const fam = (line.match(/font-family\s*:\s*['"]?([A-Za-z0-9 ]+)/) || [])[1];
  const px = parseFloat(m2[1]);
  if (!fam) { unresolvedInline.push(`${m2[0]} (line ${js.slice(0, m2.index).split('\n').length})`); continue; }
  if (/VT323/.test(fam) && px < 16) badInline.push(`VT323 ${px}px`);
  else if (/Press Start/.test(fam) && (px < 8 || px % 8)) badInline.push(`PS2P ${px}px`);
  else if (/GNF/.test(fam) && (px < 16 || px % 8)) badInline.push(`GNF ${px}px`);
}
check('inline font sizes in the JS follow the grid', badInline.length === 0, badInline.join(', '));
if (unresolvedInline.length) console.log(`NOTE inline font-family not found on the same line for: ${unresolvedInline.join(' | ')}`);
console.log(failed ? `${failed} FAILED` : 'ALL PASSED');
process.exit(failed ? 1 : 0);

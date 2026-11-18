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

// 2. blur radius in shadows
let shadows = 0, blurry = [];
for (const dm of css.matchAll(/(text-shadow|box-shadow)\s*:\s*([^;}]+)/g)) {
  if (/^(none|inherit|initial|unset)$/.test(dm[2].trim())) continue;
  for (const sh of splitTop(dm[2])) {
    shadows++;
    const lengths = sh.replace(/rgba?\([^)]*\)|var\([^)]*\)|inset/g, ' ').match(/-?[\d.]+(px|em|rem)?/g) || [];
    if (lengths.length >= 3 && parseFloat(lengths[2]) !== 0) blurry.push(`${dm[1]}: ${sh}`);
  }
}
check('no blur radius in text-shadow or box-shadow', blurry.length === 0, blurry.join(' | '));
check('shadows were parsed', shadows > 5, `parsed ${shadows}`);

// 3. filters
check('no filter blur or drop-shadow', !/filter\s*:[^;}]*(blur|drop-shadow)/.test(css) && !/backdrop-filter/.test(css));

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
const badGnf = [], unresolved = [];
for (const r of rules) {
  if (!r.size) continue;
  const fam = familyOf(r.sel);
  if (!fam) { unresolved.push(r.sel); continue; }
  if (/GNF/.test(fam)) {
    const px = parseFloat(r.size);
    if (px < 16 || px % 8 !== 0) badGnf.push(`${r.sel} ${px}px`);
  }
}
check('every GNF font-size is a multiple of 8 from 16px', badGnf.length === 0, badGnf.join(', '));
if (unresolved.length) console.log(`NOTE font-family not resolved from CSS for: ${unresolved.join(' | ')}`);

console.log(failed ? `${failed} FAILED` : 'ALL PASSED');
process.exit(failed ? 1 : 0);

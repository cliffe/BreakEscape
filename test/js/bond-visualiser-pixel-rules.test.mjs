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

console.log(failed ? `${failed} FAILED` : 'ALL PASSED');
process.exit(failed ? 1 : 0);

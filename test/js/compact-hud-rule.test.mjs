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

// The CSS media queries carry the same numbers. Parse the real @media preludes (comments stripped)
// and pin each query that defines the compact layout, found by the first selector inside it, to
// the helper constants. Matching numbers anywhere in the file is not enough: a property such as
// `max-height: 500px` elsewhere would hide a drifted query.
const W = (L.COMPACT_MAX_WIDTH_EXCL - 0.02).toFixed(2);   // max-width bound: just under 900
const H = L.COMPACT_MAX_HEIGHT;
const MINW = L.COMPACT_MAX_WIDTH_EXCL;                    // min-width bound: 900
const HP1 = H + 1;                                        // min-height companion: 501
const HP002 = (H + 0.02).toFixed(2);                      // hud.css companion: 500.02
const norm = x => x.replace(/\s+/g, ' ').trim();
// The selector is a lookahead, so a nested @media (inside @media print, say) is read too.
const mediaQueries = text => {
  const t = text.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...t.matchAll(/@media([^{]+)\{(?=\s*([^{}]*?)\s*\{)/g)].map(m => ({ prelude: norm(m[1]), selector: norm(m[2].split(',')[0]) }));
};
// [file, first selector inside the query, the exact prelude the constants give]
const COMPACT_QUERIES = [
  ['objectives.css', '.objectives-panel.collapsed .objectives-title-text', `(min-width: ${MINW}px) and (min-height: ${HP1}px)`],
  ['objectives.css', null, `(max-width: ${W}px), (max-height: ${H}px)`],
  ['objectives.css', null, `(max-width: ${W}px) and (min-height: ${HP1}px) and (orientation: portrait)`],
  ['ui-themes.css', '[data-ui-theme] .objectives-panel.collapsed', `(max-width: ${W}px), (max-height: ${H}px)`],
  ['ui-themes.css', '[data-ui-theme] .objectives-panel.collapsed', `(max-width: ${W}px) and (min-height: ${HP1}px) and (orientation: portrait)`],
  ['hud.css', 'html .game-display-dialog', `(max-height: ${H}px)`],
  ['hud.css', '#combat-buttons', `(min-width: ${MINW}px), (orientation: landscape) and (max-height: ${H}px)`],
  ['hud.css', 'body:has(#combat-buttons) #hud-info-label', `(max-width: ${W}px) and (orientation: portrait), (max-width: ${W}px) and (min-height: ${HP002}px)`],
];
// Queries that carry a compact-rule number for another reason. [file, prelude, reason]. Add here, not to
// COMPACT_QUERIES, unless the query really is the compact layout.
const OTHER_QUERIES = [];
const SCANNED = ['objectives.css', 'ui-themes.css', 'hud.css'];
// One place decides what counts as an OTHER_QUERIES entry: it needs a reason and a scanned file. The unpinned check and the shape count both use it.
for (const o of OTHER_QUERIES) assert.ok(o.length === 3 && SCANNED.includes(o[0]) && o[1] && typeof o[2] === 'string' && o[2].trim(), `OTHER_QUERIES entry [${o}] needs a scanned file, a prelude and a non-empty reason`);
const isOther = (f, prelude) => OTHER_QUERIES.some(o => o[0] === f && o[1] === prelude);
const numbersOfRule = new RegExp(`\\b(${W.replace('.', '\\.')}|${MINW}|${H}|${HP1}|${HP002.replace('.', '\\.')})(px)?\\b`);
for (const f of SCANNED) {
  const qs = mediaQueries(readFileSync(join(root, 'css', f), 'utf8'));
  const expected = COMPACT_QUERIES.filter(q => q[0] === f);
  // A stale OTHER_QUERIES entry (query renamed or deleted) must not linger.
  for (const o of OTHER_QUERIES.filter(o => o[0] === f)) assert.ok(qs.some(q => q.prelude === o[1]), `${f}: OTHER_QUERIES entry @media ${o[1]} matches no @media in the file`);
  // Every expected prelude appears exactly as the constants give it (a drifted bound leaves none).
  for (const [, sel, prelude] of expected) {
    const hits = qs.filter(q => q.prelude === prelude && (sel === null || q.selector === sel));
    assert.ok(hits.length >= 1, `${f}: a compact @media (${prelude})${sel ? ` before "${sel}"` : ''} is missing or drifted from hud-lanes.js`);
  }
  // Any query with a rule number in it must be one of the expected preludes: no unpinned copy.
  for (const q of qs) {
    if (!numbersOfRule.test(q.prelude)) continue;
    assert.ok(expected.some(e => e[2] === q.prelude) || isOther(f, q.prelude),
      `${f}: @media ${q.prelude} uses a compact-rule number: add it to COMPACT_QUERIES if it is the compact layout, or to OTHER_QUERIES with a reason if not`);
  }
  // The compact query must keep its selector: count queries by the compact shapes with any numbers.
  const shapes = qs.filter(q => !isOther(f, q.prelude) && /^\(max-width: [\d.]+px\)(, \(max-height: [\d.]+px\)| and \(min-height: [\d.]+px\) and \(orientation: portrait\))$/.test(q.prelude));
  const wantShapes = expected.filter(e => /^\(max-width: [\d.]+px\)(, \(max-height|\sand \(min-height)/.test(e[2])).length;
  assert.ok(shapes.length === wantShapes, `${f}: ${shapes.length} compact-shaped @media queries, expected ${wantShapes}`);
}

// No second copy in the JS: a viewport size compared with a compact-rule number.
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const VIEWPORT = /innerWidth|innerHeight|visualViewport|clientWidth|clientHeight|\bvw\b|\bvh\b|matchMedia/;
const NUM = '(?:899(?:\\.98)?|900|500(?:\\.02)?|501)';
const COMPARE = new RegExp(`(?:[<>]=?\\s*${NUM}\\b)|(?:\\b${NUM}\\s*[<>]=?)|(?:m(?:ax|in)-(?:width|height):\\s*${NUM}px)`);
for (const f of walk(join(root, 'js')).filter(p => p.endsWith('.js'))) {
  if (f.endsWith('ui/hud-lanes.js')) continue;
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    if (!VIEWPORT.test(line)) return;
    // A matchMedia query with no width term is a height-only rule (base-minigame.js subtitles), not the compact rule.
    // Drop just that call, so the rest of the line is still checked.
    const rest = line.replace(/matchMedia\??\.?\(\s*(['"`])((?:(?!\1).)*)\1\s*\)/g, (m, q, mq) => /width/.test(mq) ? m : '');
    assert.ok(!COMPARE.test(rest), `${f}:${i + 1} restates the compact rule: ${line.trim()}`);
  });
}
for (const f of ['js/ui/objectives-panel.js', 'js/systems/tutorial-manager.js']) {
  assert.ok(/import \{[^}]*\bisCompactViewport\b[^}]*\} from '[./]+(ui\/)?hud-lanes\.js'/.test(readFileSync(join(root, f), 'utf8')), `${f} imports the helper`);
}
console.log('compact-hud-rule ok');

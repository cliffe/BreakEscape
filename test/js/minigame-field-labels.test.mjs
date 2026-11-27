// Field labels and key names in minigames are not emphasis. minigames-framework.css draws
// <strong> and <b> as a 2px underline, so a label such as "UID:" must be
// <span class="mg-field-label"> (or mg-section-label for a panel heading) and take no underline.
// Run: node --max-old-space-size=2048 test/js/minigame-field-labels.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'break_escape');
const js = (p) => readFileSync(join(root, 'js', 'minigames', p), 'utf8');

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(join(dir, e.name)) : (e.name.endsWith('.js') ? [join(dir, e.name)] : []));
const ALL_MINIGAME_JS = walk(join(root, 'js', 'minigames'));
const css = (f) => readFileSync(join(root, 'css', f), 'utf8');

test('no strong or b tag in any minigame wraps a short label ending in a colon', () => {
  const re = /<(strong|b)\b[^>]*>\s*[^<>]{1,40}:\s*<\/\1>/g;
  assert.ok(ALL_MINIGAME_JS.length > 50, 'the folder scan found the minigame sources');
  for (const f of ALL_MINIGAME_JS) {
    const hits = readFileSync(f, 'utf8').match(re) || [];
    assert.deepEqual(hits, [], `${f} has a label in an emphasis tag`);
  }
});

test('the dusting meters take no bold tag around their values', () => {
  assert.doesNotMatch(js('dusting/dusting-game.js'), /<b[ >]/);
});

test('the RFID cloner builds its labels as mg-field-label spans', () => {
  const src = js('rfid/rfid-ui.js');
  assert.doesNotMatch(src, /createElement\(['"](strong|b)['"]\)/);
  assert.doesNotMatch(src, /<strong>(Checksum|UID|Type|Keys Known|HEX|Facility|Card|DEZ 8)/);
  assert.match(src, /mg-field-label/);
});

test('the labels that used to be strong are not strong now', () => {
  const nsm = js('network-segmentation-map/network-segmentation-map-minigame.js');
  assert.match(nsm, /mg-section-label">CLINICAL CONSEQUENCES:/);
  assert.match(nsm, /mg-section-label">DUAL AUTHORISATION STATUS:/);
  assert.match(js('dusting/dusting-game.js'), /mg-field-label">Surface:/);
  assert.match(js('dusting/dusting-game.js'), /dusting-result-value/);
});

test('the label classes exist with no underline', () => {
  const css = readFileSync(join(root, 'css', 'minigames-framework.css'), 'utf8');
  for (const cls of ['mg-field-label', 'mg-section-label']) {
    assert.match(css, new RegExp(`\\.${cls}\\b`), `${cls} missing from minigames-framework.css`);
  }
  const rule = css.match(/:is\(\.mg-field-label, \.mg-section-label\)\s*\{([^}]*)\}/);
  assert.ok(rule, 'shared label rule missing');
  assert.match(rule[1], /text-decoration:\s*none/);
  assert.match(rule[1], /font-weight:\s*400/);
  assert.doesNotMatch(rule[1], /underline|border-radius/);
});

// CSS selectors retargeted off strong/b must match classes the markup now emits.
test('retargeted CSS selectors match the classes the markup emits', () => {
  const dusting = js('dusting/dusting-game.js'), dcss = css('dusting.css');
  assert.match(dcss, /\.dusting-result \.dusting-result-value\s*\{/);
  assert.match(dusting, /class="dusting-result"[^]*?class="dusting-result-value"/);
  assert.match(dcss, /\.dusting-meter \.dusting-meter-value\s*\{/);
  assert.match(dusting, /class="dusting-meter"><label>[^<]*<span class="dusting-meter-value"/);

  assert.match(css('scanner-panel.css'), /\.scan-instructions \.mg-section-label\s*\{/);
  assert.match(js('bluetooth/bluetooth-scanner-minigame.js'), /scan-instructions[^]*?<span class="mg-section-label">Instructions:/);

  const bio = js('biometrics/biometrics-minigame.js'), bcss = css('biometrics-minigame.css');
  assert.match(bcss, /\.field-note \.mg-section-label\s*\{/);
  const bioHeading = /--mg-heading-colour:\s*(#[0-9a-f]{3,6})/i.exec(bcss)?.[1] ?? '';
  assert.ok(bioHeading && bioHeading.toLowerCase() !== '#e0e0e0', 'biometrics headings must differ from the #e0e0e0 body text');
  assert.match(bio, /className = 'sample-header'/);
  assert.match(bio, /className = 'field-note'/);
  assert.equal((bio.match(/className = 'mg-section-label'/g) || []).length, 2);

  assert.match(css('phone-chat-minigame.css'), /\.transcript \.mg-field-label\s*\{/);
  const phone = js('phone-chat/phone-chat-ui.js');
  assert.match(phone, /className = 'transcript'/);
  assert.match(phone, /transcriptLabel\.className = 'mg-field-label'/);
});

// Labels stand apart from their values by colour; each scene sets the variables on its own root.
test('the colour variables exist in the framework and on each minigame root', () => {
  const fw = css('minigames-framework.css');
  assert.match(fw, /\.mg-field-label\s*\{\s*color:\s*var\(--mg-label-colour, inherit\)/);
  assert.match(fw, /\.mg-section-label\s*\{\s*color:\s*var\(--mg-heading-colour, inherit\)/);
  assert.doesNotMatch(fw, /--mg-(label|heading)-colour\s*:/, 'no global default');
  const roots = [
    ['rfid-minigame.css', '.flipper-card-data', '--mg-label-colour'],
    ['dusting.css', '.dusting-container', '--mg-label-colour'],
    ['dusting.css', '.dusting-container', '--mg-heading-colour'],
    ['network-segmentation-map-minigame.css', '.nsm-modal', '--mg-heading-colour'],
    ['ncsc-brief-minigame.css', '.ncsc-brief-content', '--mg-heading-colour'],
    ['password-minigame.css', '.password-minigame-area', '--mg-label-colour'],
    ['biometrics-minigame.css', '.biometrics-minigame-container', '--mg-heading-colour'],
  ];
  for (const [file, sel, v] of roots) {
    const re = new RegExp('(^|\\n)' + sel.replace(/\./g, '\\.') + '\\s*\\{([^}]*)\\}');
    const m = css(file).match(re);
    assert.ok(m, `${sel} rule missing in ${file}`);
    assert.match(m[2], new RegExp(v + '\\s*:\\s*\\S'), `${sel} in ${file} sets ${v}`);
  }
  // Accent fails on the cyberpunk pressed jar (4.39:1): its label takes the body text colour
  assert.match(css('dusting.css'), /\[data-ui-theme="cyberpunk"\] \.dusting-jar\[aria-pressed="true"\] \.mg-section-label\s*\{\s*color:\s*var\(--d-text\)/);
});

test('a pressed jar has a non-colour marker, the changed drug row keeps its emphasis, the sever modal border is 2px', () => {
  assert.match(css('dusting.css'), /\.dusting-jar\[aria-pressed="true"\]::before/);
  // The diff view underlines only the changed row's drug name (the other rows are plain cells): emphasis, kept
  assert.match(js('drug-library-integrity/drug-library-integrity-minigame.js'), /<td><strong>\$\{escapeHtml\(displayDashes\(drug\.name\)\)\}<\/strong><\/td>/);
  assert.match(css('network-segmentation-map-minigame.css'), /\.nsm-modal\s*\{[^}]*border:\s*2px /);
});

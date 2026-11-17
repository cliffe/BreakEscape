// Field labels and key names in minigames are not emphasis. minigames-framework.css draws
// <strong> and <b> as a 2px underline, so a label such as "UID:" must be
// <span class="mg-field-label"> (or mg-section-label for a panel heading) and take no underline.
// Run: node --max-old-space-size=2048 test/js/minigame-field-labels.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'break_escape');
const js = (p) => readFileSync(join(root, 'js', 'minigames', p), 'utf8');

const CONVERTED = [
  'rfid/rfid-ui.js', 'dusting/dusting-game.js', 'network-segmentation-map/network-segmentation-map-minigame.js',
  'bluetooth/bluetooth-scanner-minigame.js', 'password/password-minigame.js', 'ncsc-brief/ncsc-brief-minigame.js',
  'biometrics/biometrics-minigame.js', 'phone-chat/phone-chat-ui.js', 'network-view/network-view-minigame.js',
  'container/container-minigame.js', 'drug-library-integrity/drug-library-integrity-minigame.js',
];

test('no strong or b tag wraps a short label ending in a colon', () => {
  const re = /<(strong|b)\b[^>]*>\s*[^<>]{1,40}:\s*<\/\1>/g;
  for (const f of CONVERTED) {
    const hits = js(f).match(re) || [];
    assert.deepEqual(hits, [], `${f} still has a label in an emphasis tag`);
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

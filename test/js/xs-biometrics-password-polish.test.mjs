// B6, B7, C3: fingerprint title line pitch, footer contrast, Submit gap under the hint controls.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = (f) => readFileSync(new URL(`../../public/break_escape/css/${f}`, import.meta.url), 'utf8');
const block = (text, sel) => {
    const i = text.indexOf(`\n${sel} {`);
    assert.ok(i >= 0, `${sel} rule exists`);
    return text.slice(i, text.indexOf('}', i));
};
test('fingerprint heading has a 24px line pitch (1.5 of 16px)', () => {
    assert.ok(/line-height:\s*24px;/.test(block(css('biometrics-minigame.css'), '.fpr-heading')), 'line-height 24px');
});
test('fingerprint footer keys use the readable green', () => {
    assert.ok(/\.fpr-keys \{[^}]*color: #7fa88a;/.test(css('biometrics-minigame.css')), '#7fa88a');
});
test('hint controls sit 10px under the input, flush on the desktop panel', () => {
    const t = css('password-minigame.css');
    assert.ok(/margin-top:\s*10px;/.test(block(t, '.hint-controls')), 'margin-top 10px');
    assert.ok(/margin-top:\s*0;/.test(block(t, '.pc-lock-panel .hint-controls')), 'pc panel margin-top 0');
});

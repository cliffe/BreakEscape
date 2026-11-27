// Sweep 3 B2/B34/B35: small contrast fixes in four minigame stylesheets.
// Run with: node --max-old-space-size=2048 test/js/sweep3-contrast-small-css.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const css = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
function rule(file, sel) {
    const t = readFileSync(join(css, file), 'utf8');
    const m = t.match(new RegExp('(?:^|\\n)' + sel.replace(/\./g, '\\.') + '\\s*\\{([^}]*)\\}'));
    assert.ok(m !== null, sel + ' rule exists');
    return m[1];
}
const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('esd panel is opaque', () => {
    assert.ok(/background:\s*#101010;/.test(rule('esd-pushbutton-minigame.css', '.esd-panel')), 'panel #101010');
});
test('ncsc envelope ref is #8b949e at 4.5:1 or better, sealed line-height 1.4', () => {
    assert.ok(/color:\s*#8b949e;/.test(rule('ncsc-brief-minigame.css', '.ncsc-envelope-ref')), 'ref colour');
    assert.ok(ratio('#8b949e', '#0d1117') >= 4.5, 'ref contrast on #0d1117');
    assert.ok(/line-height:\s*1\.4;/.test(rule('ncsc-brief-minigame.css', '.ncsc-sealed-message')), 'line-height');
});
test('nad detail hint is #8a9bb0 at 4.5:1 or better on #0a0f1e', () => {
    assert.ok(/color:\s*#8a9bb0;/.test(rule('network-architecture-minigame.css', '.nad-detail-hint')), 'hint colour');
    assert.ok(ratio('#8a9bb0', '#0a0f1e') >= 4.5, 'hint contrast');
});
test('landing-page invalid text keeps flex-grow so the X stays at the right of the header', () => {
    // .lpb-head has no justify-content: without flex-grow the X sits mid-row after the text.
    assert.ok(/flex:\s*1( 1 auto)?;/.test(rule('landing-page-builder-minigame.css', '.lpb-invalid-text')), 'flex grow');
});

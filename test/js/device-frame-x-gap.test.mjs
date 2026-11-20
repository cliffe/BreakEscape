// The shared device frame title row keeps the X's 44px hit area off the first control row of
// rogue-ap, patch-panel and vm-launcher: 12px below the row (14px at phone width), set once in
// device-frame.css, with no per-device margin overrides left to fight it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cssDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public/break_escape/css');
const read = (f) => readFileSync(join(cssDir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const frame = read('device-frame.css');

test('title row margin-bottom is at least 12px', () => {
    const b = /\.device-frame > \.device-frame-title\s*\{([^}]*)\}/.exec(frame)?.[1] ?? '';
    const m = /margin:\s*0 0 (\d+)px/.exec(b);
    assert.ok(m !== null && Number(m[1]) >= 12, 'desktop margin >= 12px');
});
test('phone width margin-bottom is at least 14px', () => {
    const med = /@media \(max-width: 559px\)\s*\{([\s\S]*?\}\s*)\}/.exec(frame)?.[1] ?? '';
    const m = /margin-bottom:\s*(\d+)px/.exec(med);
    assert.ok(m !== null && Number(m[1]) >= 14, 'phone margin >= 14px');
});
test('no device sheet overrides the title margin below the shared value', () => {
    for (const f of ['rogue-ap.css', 'patch-panel-minigame.css', 'vm-launcher-minigame.css']) {
        const rules = [...read(f).matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((r) => /title(?!-text)/.test(r[1]) && /margin-bottom|margin:/.test(r[2]));
        assert.ok(rules.length === 0, `${f} has no title margin override`);
    }
});
test('vm-launcher no longer needs its phone margin-top workaround', () => {
    assert.ok(!/\.vm-launcher\s*\{\s*margin-top:\s*6px/.test(read('vm-launcher-minigame.css')), 'workaround folded into the shared rule');
});

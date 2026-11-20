// B1: the phone-width padding override must keep the 44px top clearance for the X.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/examine-minigame.css'), 'utf8');
const phone = css.slice(css.indexOf('@media (max-width: 600px)'));
const m = phone.match(/\.examine-panel\s*\{([^}]*)\}/);

test('phone examine panel keeps 44px above the content for the X', () => {
    assert.ok(m !== null, 'a .examine-panel rule in the 600px block');
    const decl = m[1].replace(/\/\*[\s\S]*?\*\//g, '');
    const pad = decl.match(/(?:^|[;\s])padding:\s*([^;]+);/);
    const top = decl.match(/padding-top:\s*(\d+)px/);
    const first = pad ? pad[1].trim().split(/\s+/)[0] : '';
    assert.ok((top && Number(top[1]) >= 44) || first === '44px', 'top padding at least 44px, got ' + decl.trim());
});

test('the card scrolls inside the viewport on short landscape', () => {
    const base = css.slice(0, css.indexOf('.examine-panel'));
    assert.ok(/max-height:\s*calc\(100vh - 160px\)/.test(base) && /overflow-y:\s*auto/.test(base), 'bounded and scrolling');
});

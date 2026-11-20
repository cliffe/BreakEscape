// Backup recovery: on a phone the confirm row sticks to the bottom of the console with the
// console surface behind it and a 2px top border, so it is visible on open.
// Run with: node --max-old-space-size=2048 test/js/backup-recovery-confirm-sticky.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/backup-recovery-minigame.css'), 'utf8');
const start = css.indexOf('@media (max-width: 600px) {');
const block = start < 0 ? '' : css.slice(start, css.indexOf('\n}\n', start));
const rule = block.slice(block.indexOf('.backup-recovery-actions'));

test('phone block makes the confirm row sticky at the bottom', () => {
    assert.ok(start >= 0, 'a max-width 600px block exists');
    assert.ok(/position:\s*sticky/.test(rule), 'position sticky');
    assert.ok(/bottom:\s*0/.test(rule), 'bottom 0');
});

test('sticky row has the surface behind it and a 2px top border', () => {
    assert.ok(/background:\s*var\(--mg07-bg\)/.test(rule), 'console surface colour behind the row');
    assert.ok(/border-top:\s*2px solid/.test(rule), '2px top border');
});

test('desktop actions row is not sticky', () => {
    const base = css.slice(css.indexOf('.backup-recovery-actions {'), css.indexOf('.backup-recovery-confirm-btn {'));
    assert.ok(!/sticky/.test(base), 'base rule has no sticky');
});

// Backup recovery: where the tiles stack (max-width 860px) or the window is short (max-height
// 500px) the confirm row sticks to the bottom of the console with the console surface behind it and
// a 2px top border, so it is visible on open. One custom property drives the shell padding and the
// row's negative margins, so they cannot drift apart.
// Run with: node --max-old-space-size=2048 test/js/backup-recovery-confirm-sticky.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../public/break_escape/css/backup-recovery-minigame.css'), 'utf8');
const HEAD = '@media (max-width: 860px), (max-height: 500px) {';
const start = css.indexOf(HEAD);
const block = start < 0 ? '' : css.slice(start, css.indexOf('\n}\n', start));
const rule = block.slice(block.indexOf('.backup-recovery-actions'));
const shellRule = block.slice(block.indexOf('.backup-recovery-shell'), block.indexOf('.backup-recovery-actions'));

test('the sticky block covers narrow (860px) and short (500px) windows, so 800x600 and 844x390 get it', () => {
    assert.ok(start >= 0, 'the block opens with (max-width: 860px), (max-height: 500px)');
    assert.ok(!/@media \(max-width: 600px\) \{\s*\.backup-recovery-actions/.test(css), 'no 600px-only sticky block is left');
});

test('block makes the confirm row sticky at the bottom', () => {
    assert.ok(/position:\s*sticky/.test(rule), 'position sticky');
    assert.ok(/bottom:\s*0/.test(rule), 'bottom 0');
});

test('sticky row has the surface behind it and a 2px top border', () => {
    assert.ok(/background:\s*var\(--mg07-bg\)/.test(rule), 'console surface colour behind the row');
    assert.ok(/border-top:\s*2px solid/.test(rule), '2px top border');
});

test('margins and shell padding come from one property (no hard-coded 12px pair to drift)', () => {
    assert.ok(/--br-pad:\s*12px/.test(shellRule), 'the shell sets --br-pad');
    assert.ok(/padding:\s*var\(--br-pad\)/.test(shellRule), 'shell padding uses --br-pad');
    assert.ok(/margin:\s*0 calc\(-1 \* var\(--br-pad\)\) calc\(-1 \* var\(--br-pad\)\)/.test(rule), 'row margins are the negative of --br-pad');
    assert.ok(!/-12px/.test(rule), 'no literal -12px in the row rule');
});

test('desktop actions row is not sticky', () => {
    const base = css.slice(css.indexOf('.backup-recovery-actions {'), css.indexOf('.backup-recovery-confirm-btn {'));
    assert.ok(!/sticky/.test(base), 'base rule has no sticky');
});

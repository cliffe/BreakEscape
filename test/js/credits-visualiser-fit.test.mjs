// Blind A 2026-10-16: the credits visualiser's right-hand panel was cut off at
// 1400 px (m06, m07 M1), and a forced (disableClose) credits screen kept its close
// control hidden until the music track ended, which a muted or headless browser
// may never report (m07 M1: 12 minutes with no exit).
// Run with: node --test test/js/credits-visualiser-fit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const css = readFileSync(join(root, 'css/bond-visualiser.css'), 'utf8');
const js = readFileSync(join(root, 'js/music/bond-visualiser.js'), 'utf8');

const rule = (sel) => {
    const i = css.indexOf(`${sel} {`);
    return css.slice(i, css.indexOf('}', i));
};

test('the layout columns cannot grow past the window', () => {
    assert.match(rule('#bond-vis-overlay .bv-app'), /grid-template-columns: minmax\(0, 1fr\)/);
    assert.match(rule('#bond-vis-overlay .bv-stage'), /grid-template-columns: 180px minmax\(0, 1fr\) 180px/);
});

test('the close control comes back once the last credits line has shown', () => {
    const fn = js.slice(js.indexOf('function showNext()'), js.indexOf('function _stopCredits()'));
    assert.match(fn, /finished && _disableClose/);
    assert.match(fn, /_disableClose = false/);
    assert.match(fn, /closeBtn\.style\.display = ''/);
});

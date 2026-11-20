import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape');
const read = (p) => readFileSync(join(root, p), 'utf8');

const cases = [
    ['css/concern-form-minigame.css', '.cf-minigame-container', 760],
    ['css/sis-config-threshold-minigame.css', '.sis-threshold-minigame-container', 800],
    ['css/ncsc-brief-minigame.css', '.ncsc-minigame-container', 760],
];

for (const [file, cls, cap] of cases) {
    test(`${file} caps the console window at ${cap}px, full width on phones`, () => {
        const css = read(file);
        const re = new RegExp(cls.replace('.', '\\.') + ' \\.console-window \\{ width: min\\((\\d+)px, 100%\\); \\}');
        const m = css.match(re);
        assert.ok(m !== null, 'cap rule present');
        assert.ok(Number(m[1]) === cap, 'cap is ' + cap);
    });
}

test('concern-form tags its container so the cap applies', () => {
    const js = read('js/minigames/concern-form/concern-form-minigame.js');
    assert.ok(js.includes("classList.add('cf-minigame-container')"), 'container class added');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/css');
const rule = (file, sel) => {
    const css = readFileSync(join(root, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const m = new RegExp(sel.replace(/[.]/g, '\\.') + '\\s*\\{([^}]*)\\}').exec(css);
    return m ? m[1] : '';
};

test('K5 B: the infusion pump no-charts notice is a small framed card, not a full plate', () => {
    const b = rule('infusion-pump-minigame.css', '.ip-no-charts');
    assert.ok(/width:\s*fit-content/.test(b), 'card wraps its content');
    assert.ok(/border:\s*2px solid/.test(b), 'framed with a 2px border');
    assert.ok(!/height:\s*100%/.test(b), 'no full-height plate');
    assert.ok(/font-size:\s*16px/.test(rule('infusion-pump-minigame.css', '.ip-no-charts-text')), 'notice text 16px');
});

test('K8 B: the ransomware status note is 16px', () => {
    const b = rule('ransomware-display-minigame.css', '.ransomware-display-note');
    assert.ok(/font-size:\s*16px/.test(b), 'note 16px');
});

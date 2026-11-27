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

test('K5 B: the game container shrinks to the card, so no plate and the X sits on the card', () => {
    const css = readFileSync(join(root, 'infusion-pump-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const m = /\[data-minigame="infusion-pump"\]\s*>\s*\.minigame-game-container:has\(>\s*\.ip-no-charts\)\s*\{([^}]*)\}/.exec(css);
    assert.ok(!!m, 'a :has(> .ip-no-charts) rule on the game container');
    const b = m ? m[1] : '';
    assert.ok(/width:\s*fit-content/.test(b), 'container wraps the card');
    assert.ok(/height:\s*auto/.test(b), 'no full-height container');
    assert.ok(/margin:\s*auto/.test(b), 'centred on both axes by the shell');
    assert.ok(/background:\s*none/.test(b), 'no #1a1a1a plate');
    const card = rule('infusion-pump-minigame.css', '.ip-no-charts');
    assert.ok(/margin:\s*0 auto;/.test(card), 'the card centres sideways even without :has()');
    assert.ok(/padding:\s*16px 48px;/.test(card), 'equal side padding: centred content, room for the X');
});

test('K8 B: the phone ransomware headline is 16px (24px line), above the 16px note, and wraps', () => {
    const css = readFileSync(join(root, 'ransomware-display-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const phone = /@media \(max-width: 840px\)\s*\{([\s\S]*)\}\s*$/.exec(css.trim())?.[1] ?? '';
    const t = /\.ransomware-display-title\s*\{([^}]*)\}/.exec(phone)?.[1] ?? '';
    assert.ok(/font-size:\s*16px/.test(t), 'phone headline 16px');
    assert.ok(/line-height:\s*24px/.test(t), 'phone headline 24px line');
    assert.ok(/overflow-wrap:\s*anywhere/.test(t), 'headline may wrap');
});

test('K8 B: the ransomware status note is 16px', () => {
    const b = rule('ransomware-display-minigame.css', '.ransomware-display-note');
    assert.ok(/font-size:\s*16px/.test(b), 'note 16px');
});

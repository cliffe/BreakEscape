// m02 owner decisions D177 (Kim's exit line) and D179 (trimmed opening briefing).
// Boolean asserts only (memory safety). Run: node --test test/js/m02-decisions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const ink = (n) => readFileSync(join(root, 'scenarios/m02_ransomed_trust/ink', n), 'utf8');

function exitText(vars) {
    const s = new inkjs.Story(ink('m02_npc_sarah_kim.json'));
    s.BindExternalFunction('player_name', () => 'Agent', false);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString('hub');
    while (s.canContinue) s.Continue();
    const i = s.currentChoices.findIndex((c) => c.text.includes('I need to get on'));
    assert.ok(i >= 0, 'exit choice present');
    s.ChooseChoiceIndex(i);
    let out = '';
    while (s.canContinue) out += s.Continue();
    return out;
}
const ALT = /If you find me an alternative/;

test('Kim exit: alternative line shows only when the player holds no keys', () => {
    assert.ok(ALT.test(exitText({})) === true, 'no keys: line shown');
    assert.ok(ALT.test(exitText({ offline_keys_recovered: true })) === false, 'holding keys: hidden');
    assert.ok(/Yes\. Go\./.test(exitText({ offline_keys_recovered: true })) === true, 'holding keys: Yes. Go.');
    assert.ok(ALT.test(exitText({ offline_keys_recovered: true, kim_has_escrow_keys: true })) === false, 'handed over: hidden');
});

test('briefing: trimmed lines are gone and the key facts remain', () => {
    const t = ink('m02_opening_briefing.json');
    for (const gone of ['chalkboard', 'Half the NHS', 'genuinely booked', 'still in the wires']) {
        assert.ok(t.includes(gone) === false, `${gone} removed`);
    }
    for (const kept of ['Forty-seven people', 'Ghost', 'Recover the decryption keys and bring', 'Dr. Sarah Kim', 'Gary Whitlock', 'Ghost may have had help']) {
        assert.ok(t.includes(kept), `${kept} kept`);
    }
});

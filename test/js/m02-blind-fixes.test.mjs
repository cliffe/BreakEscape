// m02 blind playtest fixes: Kim takes the escrow keys, Val's "go and get him" waits on
// Reeves still being free, the debrief shows "quietly" and "buy me time", the safe's
// empty toast can say where the contents went, and the badge wording agrees.
// Run with: node --test test/js/m02-blind-fixes.test.mjs
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

function open(file, knot, vars = {}) {
    const s = new inkjs.Story(ink(file));
    s.BindExternalFunction('player_name', () => 'Agent', false);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    return s;
}
function text(s) {
    let out = '';
    while (s.canContinue) out += s.Continue();
    return out;
}
const labels = (s) => s.currentChoices.map((c) => c.text);
const pick = (s, label) => {
    const i = labels(s).findIndex((t) => t.includes(label));
    assert.ok(i >= 0, `choice "${label}" missing from ${JSON.stringify(labels(s))}`);
    s.ChooseChoiceIndex(i);
    return text(s);
};

test('Kim offers to take the escrow keys only once they are recovered, and only once', () => {
    let s = open('m02_npc_sarah_kim.json', 'hub');
    text(s);
    assert.ok(!labels(s).some((t) => t.includes('Hand her the escrow keys')));
    s = open('m02_npc_sarah_kim.json', 'hub', { offline_keys_recovered: true });
    text(s);
    const out = pick(s, 'Hand her the escrow keys');
    assert.match(out, /something to put in front of them besides a cheque/);
    assert.equal(s.variablesState.kim_has_escrow_keys, true);
    assert.ok(!labels(s).some((t) => t.includes('Hand her the escrow keys')));
    const bye = pick(s, 'I need to get on');
    assert.match(bye, /Yes\. Go\./);
});

test('Kim keeps the old hand-over greeting only until the keys are handed over', () => {
    let s = open('m02_npc_sarah_kim.json', 'hub', { offline_keys_recovered: true });
    assert.match(text(s), /Tell me you have something I can take into that room/);
    s = open('m02_npc_sarah_kim.json', 'hub', { offline_keys_recovered: true, kim_has_escrow_keys: true });
    assert.doesNotMatch(text(s), /Tell me you have something/);
});

test('Val does not send the player after Reeves once he is dealt with', () => {
    const run = (vars) => {
        const s = open('m02_npc_security_guard.json', 'reeves_vindicated', vars);
        text(s);
        return { s, out: pick(s, "It'll be in the record") };
    };
    assert.match(run({}).out, /Go and get him/);
    for (const v of ['insider_asset_arrested', 'insider_asset_escaped', 'night_security_supervisor_ko']) {
        const { s, out } = run({ [v]: true });
        assert.doesNotMatch(out, /Go and get him/, v);
        assert.match(out, /Then that'll do me/);
        assert.ok(!labels(s).some((t) => t.includes('Stay out of the boardroom')));
    }
});

test('the debrief shows a quiet arrest and a "buy me time" board answer', () => {
    const d = (knot, vars) => text(open('m02_closing_debrief.json', knot, vars));
    assert.match(d('insider_rolled_up', { insider_asset_arrested: true, reeves_stance: 'quiet' }), /took him quietly/);
    assert.doesNotMatch(d('insider_rolled_up', { insider_asset_arrested: true, reeves_stance: 'handover' }), /took him quietly/);
    const fin = (vars) => text(open('m02_closing_debrief.json', 'final_reflection', vars));
    assert.match(fin({ advised_board_time: true }), /asked her for time/);
    assert.doesNotMatch(fin({}), /asked her for time/);
});

test('Reeves sets a stance global on each way out of the scene', () => {
    const src = ink('m02_npc_asset.ink');
    for (const [knot, stance] of [['choice_arrest', 'quiet'], ['choice_expose', 'public'], ['choice_handover', 'handover'], ['choice_hostile', 'hostile']]) {
        const body = src.slice(src.indexOf(`=== ${knot} ===`)).split('\n===')[0];
        assert.ok(body.includes(`#set_global:reeves_stance:${stance}`), knot);
    }
    assert.ok(ink('m02_npc_sarah_kim.ink').includes('#set_global:advised_board_time:true'));
});

test('empty containers use a scenario emptyText; the m02 safe and badge wording are set', () => {
    const inter = readFileSync(join(root, 'public/break_escape/js/systems/interactions.js'), 'utf8');
    assert.match(inter, /data\.emptyText/);
    const scn = readFileSync(join(root, 'scenarios/m02_ransomed_trust/scenario.json.erb'), 'utf8');
    assert.match(scn, /"emptyText": "Empty\. The escrow keys you took are in your notepad\."/);
    assert.doesNotMatch(scn, /Badge number: withheld in this log/);
    assert.match(scn, /Ghost's operational log names the badge/);
    for (const g of ['advised_board_time', 'reeves_stance', 'kim_has_escrow_keys']) assert.ok(scn.includes(`"${g}"`), g);
});

// Mission-ending convention for m03 Victoria, m07 HaX bring-me-in, m08 Nightshade:
// the irreversible choice carries #ending_check in its brackets, and a "Not yet"
// choice backs out without starting the ending.
// Run with: node test/js/ending-checks-release.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const inkjs = require(join(root, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);
const load = (p) => readFileSync(join(root, p), 'utf8').replace(/^﻿/, '');
const M03 = load('scenarios/m03_ghost_in_the_machine/ink/m03_npc_victoria.json');
const M07 = load('scenarios/m07_architects_gambit/ink/m07_phone_agent_0x99.json');
const M10 = load('scenarios/m10_full_disclosure/ink/m10_tesseract.json');
const M08 = load('scenarios/m08_the_mole/ink/m08_nightshade_confrontation.json');

function at(json, knot, vars = {}) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    return s;
}
function drain(s) {
    const lines = [], tags = [];
    while (s.canContinue) {
        lines.push(s.Continue().trim());
        tags.push(...(s.currentTags || []));
    }
    return { lines, tags };
}
const find = (s, re) => s.currentChoices.findIndex((c) => re.test(c.text));

test('m03: every ending choice carries ending_check, and "Not yet" does not', () => {
    const s = at(M03, 'confrontation_decision', { usb_seen: true });
    drain(s);
    const ending = s.currentChoices.filter((c) => !/Not yet/.test(c.text));
    assert.equal(ending.length, 3, 'recruit, arrest, escape');
    for (const c of ending) assert.ok(c.tags && c.tags.includes('ending_check'), c.text);
    const notYet = s.currentChoices[find(s, /Not yet/)];
    assert.ok(notYet, 'Not yet offered');
    assert.ok(!(notYet.tags || []).includes('ending_check'));
});

test('m03: "Not yet" decides nothing, and the next talk resumes at the decision', () => {
    const s = at(M03, 'confrontation_decision', { usb_seen: true });
    drain(s);
    s.ChooseChoiceIndex(find(s, /Not yet/));
    const { tags } = drain(s);
    assert.ok(tags.includes('exit_conversation'));
    assert.ok(!tags.some((t) => /^(set_global:victoria_fate|complete_task:victoria_choice_made)/.test(t)));
    assert.equal(s.variablesState.victoria_fate, '');
    assert.equal(s.variablesState.confront_held, true);
    // Talk to her again: straight to the choices, none of the opening speech.
    s.ChoosePathString('nighttime_confrontation');
    const again = drain(s);
    assert.ok(!again.lines.some((l) => /came back after hours/.test(l)));
    assert.ok(find(s, /walking out of here/) >= 0);
    assert.equal(s.variablesState.confront_held, false);
});

test('m03: choosing an ending still sets the fate', () => {
    const s = at(M03, 'confrontation_decision');
    drain(s);
    s.ChooseChoiceIndex(find(s, /walking out of here/));
    const { tags } = drain(s);
    assert.ok(tags.includes('set_global:victoria_fate:arrested'));
    assert.ok(tags.includes('complete_task:victoria_choice_made'));
});

const ALL = { flag1_submitted: true, flag2_submitted: true, flag3_submitted: true, flag4_submitted: true };

test('m07: bring_me_in asks first and does not request the debrief yet', () => {
    const s = at(M07, 'bring_me_in', ALL);
    const { lines } = drain(s);
    assert.deepEqual(lines.filter(Boolean), [], 'no opener when every flag is in');
    assert.equal(s.variablesState.debrief_requested, false);
    const go = s.currentChoices[find(s, /Put him through\. That ends tonight/)];
    assert.ok(go.tags.includes('ending_check'));
    assert.ok(!(s.currentChoices[find(s, /Not yet/)].tags || []).includes('ending_check'));
    assert.ok(find(s, /Not yet/) >= 0);
});

test('m07: "Not yet" leaves debrief_requested false and ends the call', () => {
    const s = at(M07, 'bring_me_in', ALL);
    drain(s);
    s.ChooseChoiceIndex(find(s, /Not yet/));
    const { tags } = drain(s);
    assert.ok(tags.includes('exit_conversation'));
    assert.equal(s.variablesState.debrief_requested, false);
});

test('m07: confirming sets debrief_requested and keeps the voiced hand-off line', () => {
    const s = at(M07, 'bring_me_in', ALL);
    drain(s);
    s.ChooseChoiceIndex(find(s, /Put him through/));
    const { lines, tags } = drain(s);
    assert.equal(s.variablesState.debrief_requested, true);
    assert.ok(lines.includes("Putting you through. He's waiting."));
    assert.ok(tags.includes('exit_conversation'));
});

test('m07: with a flag missing the confirm is tagged too, and still waits for the flags', () => {
    const s = at(M07, 'bring_me_in', { ...ALL, flag4_submitted: false });
    const { lines } = drain(s);
    assert.ok(lines.includes('Not yet. Put the rest of the flags through the relay and he\'s on straight after.'));
    assert.equal(s.variablesState.debrief_requested, false);
    const go = s.currentChoices.find((c) => /Understood/.test(c.text));
    assert.ok(go && go.tags.includes('ending_check'));
    assert.ok(!s.currentChoices.some((c) => /Put him through/.test(c.text)));
});

test('m08: both fate choices carry ending_check; "Not yet" does not', () => {
    const s = at(M08, 'the_choice');
    drain(s);
    const fates = s.currentChoices.filter((c) => !/Not yet/.test(c.text));
    assert.equal(fates.length, 2);
    for (const c of fates) assert.ok(c.tags && c.tags.includes('ending_check'), c.text);
    assert.ok(!(s.currentChoices[find(s, /Not yet/)].tags || []).includes('ending_check'));
});

test('m08: "Not yet" decides nothing and holds the choice', () => {
    const s = at(M08, 'the_choice');
    drain(s);
    s.ChooseChoiceIndex(find(s, /Not yet/));
    const { tags } = drain(s);
    assert.ok(tags.includes('exit_conversation'));
    assert.ok(!tags.includes('complete_task:decide_the_fate'));
    assert.equal(s.variablesState.fate_decided, false);
    // The knot re-enters itself, so the same choices wait for the next talk.
    assert.ok(find(s, /No deals/) >= 0);
});

test('m08: a fate choice still completes the task', () => {
    const s = at(M08, 'the_choice');
    drain(s);
    s.ChooseChoiceIndex(find(s, /No deals/));
    const { tags } = drain(s);
    assert.ok(tags.includes('complete_task:decide_the_fate'));
    assert.equal(s.variablesState.fate_decided, true);
});

// m10: the tagged choices are the irreversible ones; back-outs stay untagged.
function menu(knot, vars = {}) {
    const s = at(M10, knot, { tess_menu: true, ...vars });
    drain(s);
    return s;
}
const tagged = (s, re) => {
    const i = find(s, re);
    assert.ok(i >= 0, `choice ${re} offered`);
    return (s.currentChoices[i].tags || []).includes('ending_check');
};

test('m10: standing end menu tags cooperate and arrest, not the shoot warning', () => {
    const s = menu('end_menu_standing');
    assert.ok(tagged(s, /cooperate/));
    assert.ok(tagged(s, /under arrest/));
    assert.ok(!tagged(s, /Shoot him/));
});

test('m10: seated end menu leads to reach untagged; Fire and Hold fire are tagged', () => {
    const s = menu('end_menu_seated');
    assert.ok(!tagged(s, /under arrest/));
    assert.ok(!tagged(s, /Shoot him/));
    const r = at(M10, 'reach');
    drain(r);
    assert.ok(tagged(r, /^Fire/));
    assert.ok(tagged(r, /Hold fire/));
});

test('m10: cold_warning tags Do it and leaves Lower the weapon alone', () => {
    const s = at(M10, 'cold_warning', { points_landed: 2 });
    drain(s);
    assert.ok(tagged(s, /Do it/));
    assert.ok(!tagged(s, /Lower the weapon/));
});

test('m10: join_3 tags Publish it and leaves No alone', () => {
    const s = at(M10, 'join_3');
    drain(s);
    assert.ok(tagged(s, /Publish it/));
    assert.ok(!tagged(s, /^No\./));
});

test('m10: the back-outs on the join path are untagged', () => {
    for (const [knot, re] of [['join_1_menu', /Step back/], ['join_2_menu', /Step away/], ['join_2_menu', /Stop it/]]) {
        const s = menu(knot);
        assert.ok(!tagged(s, re), `${knot} ${re}`);
    }
});

test('m10: a tagged choice still sets the ending', () => {
    const s = at(M10, 'reach');
    drain(s);
    s.ChooseChoiceIndex(find(s, /Hold fire/));
    drain(s);
    assert.equal(s.variablesState.ending, 'arrest');
});

// m10, generic: walk every reachable choice from the core and require that any
// choice that takes `ending` from "" to a value carries ending_check. A later
// ending branch that forgets the tag fails here without a new test.
test('m10: every choice that sets `ending` carries ending_check (graph walk)', () => {
    const seed = {
        core_greeted: true, flag1_submitted: true, flag2_submitted: true, flag3_submitted: true,
        flag4_submitted: true, flag4_heard: true, case_heard: true,
        exchange_1: 'x', exchange_2: 'x', exchange_3: 'x', tess_menu: true,
    };
    const entries = [
        ['core_router', seed],
        ['core_router', { ...seed, console_choice: 'stopped', database_outcome: 'secured' }],
        ['core_router', { ...seed, console_choice: 'stopped' }],
        ['core_router', { ...seed, console_choice: 'stopped', database_outcome: 'secured', points_landed: 2 }],
        ['database_menu', seed], ['end_menu_standing', seed], ['end_menu_seated', seed],
        ['reach', seed], ['cold_warning', seed], ['join_3', seed], ['console_menu', seed],
    ];
    const seen = new Set();
    const setters = new Set();
    const t = new Story(M10);
    const KEYS = ['ending', 'console_choice', 'database_outcome', 'join_step', 'tess_menu',
        'cold_lowered', 'tess_end_said', 'fire_held', 'tess_db_costs_said', 'tess_db_greeted'];
    const key = () => KEYS.map((k) => String(t.variablesState[k])).join('|') + '#' +
        t.currentChoices.map((c) => c.text).join('/');
    let nodes = 0;
    function visit(stateJson, depth) {
        if (depth > 12 || ++nodes > 3000) return;
        t.state.LoadJson(stateJson);
        const n = t.currentChoices.length;
        for (let i = 0; i < n; i++) {
            t.state.LoadJson(stateJson);
            const c = t.currentChoices[i];
            const before = t.variablesState.ending;
            t.ChooseChoiceIndex(i);
            let guard = 0;
            while (t.canContinue && guard++ < 400) t.Continue();
            if (before === '' && t.variablesState.ending !== '') {
                setters.add(`${t.variablesState.ending}: ${c.text.trim()}`);
                assert.ok((c.tags || []).includes('ending_check'),
                    `choice "${c.text.trim()}" sets ending=${t.variablesState.ending} without ending_check`);
            }
            if (t.currentChoices.length) {
                const k = key();
                if (!seen.has(k)) {
                    seen.add(k);
                    visit(t.state.toJson(), depth + 1);
                }
            }
        }
    }
    for (const [knot, vars] of entries) {
        const s = at(M10, knot, vars);
        let guard = 0;
        while (s.canContinue && guard++ < 400) s.Continue();
        visit(s.state.toJson(), 0);
    }
    assert.ok(nodes < 3000, `walk converged (${nodes} nodes)`);
    for (const e of ['scorched', 'surrender', 'arrest', 'lethal', 'executed', 'joined']) {
        assert.ok([...setters].some((x) => x.startsWith(e + ':')), `walk reached ending ${e}`);
    }
});

test('m10: Wipe both is tagged and has an untagged back-out that decides nothing', () => {
    const s = menu('database_menu');
    assert.ok(tagged(s, /Wipe both/));
    assert.ok(!tagged(s, /Not yet/));
    s.ChooseChoiceIndex(find(s, /Not yet/));
    const { tags } = drain(s);
    assert.ok(tags.includes('exit_conversation'));
    assert.equal(s.variablesState.ending, '');
    assert.equal(s.variablesState.database_outcome, '');
});

// m08 blind-playtest fixes: audit_case refusal hint, accurate ATHENA attribution,
// softened early Nightshade tells, PIN hops. Run with: node test/js/m08-blind-fixes.test.mjs
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
const dir = join(root, 'scenarios/m08_the_mole');
const read = (p) => readFileSync(join(dir, p), 'utf8').replace(/^﻿/, '');
const DIR = read('ink/m08_director_netherton.json');
const ERB = read('scenario.json.erb');

test('audit_case refusal escalates to a concrete hint on the fourth ask', () => {
    // stopping block is per-story-state: run four visits in one story
    const s = new Story(DIR);
    s.variablesState.found_badge_audit = true;
    s.variablesState.found_timeline = true;
    const texts = [];
    for (let i = 0; i < 4; i++) {
        s.ChoosePathString('audit_case');
        const o = [];
        while (s.canContinue) o.push(s.Continue().trim());
        texts.push(o.join('\n'));
    }
    assert.match(texts[3], /Vector on the operations floor, Nightshade in the Crypto Lab/);
    assert.notEqual(texts[3], texts[2]);
});

test('menu line attributes the PIN device to ATHENA\'s log, not an invented quote', () => {
    const ink = read('ink/m08_director_netherton.ink');
    assert.doesNotMatch(ink, /ATHENA says he never signed/);
    assert.match(ink, /ATHENA's log has his PIN device still out/);
    assert.match(read('ink/m08_opening_briefing.ink'), /PIN device you are thinking of is still signed out to Agent 0x47/);
});

test('early tells no longer name the lab or the ideology', () => {
    assert.doesNotMatch(ERB, /entropy as a moral position/);
    const note = ERB.match(/"text": "MINE\. Not for the file[^"]*"/)[0];
    assert.doesNotMatch(note, /Cryptography Lab/);
    const ph = read('ink/m08_suspect_phantom.ink');
    assert.doesNotMatch(ph, /terminal 03 in the Cryptography Lab|from Cryptography Lab terminal 03/i);
    // the evidence chain still names the lab: auth log and door audit
    assert.match(ERB, /Cryptography Lab terminal 03  OPEN/);
    assert.match(ERB, /Crypto Lab door CL-1|CL-1/);
});

test('every PIN is found away from its door', () => {
    // pin -> [room holding the door, room holding the clue]
    const roomOf = (idRe) => {
        const idx = ERB.search(idRe);
        const before = ERB.slice(0, idx);
        const names = [...before.matchAll(/^    "(main_lobby|director_office|operations_floor|intel_analysis|server_room|security_archives|cryptography_lab|interrogation_room|break_room)": \{/gm)];
        return names.length ? names[names.length - 1][1] : null;
    };
    assert.equal(roomOf(/"id": "badge_printer"/), 'main_lobby');
    assert.equal(roomOf(/"id": "password_sticky_note"/), 'break_room');
    assert.equal(roomOf(/"id": "director_safe"/), 'director_office');
    assert.equal(roomOf(/"id": "nightshade_personnel_record"/), 'operations_floor');
    assert.equal(roomOf(/"id": "interrogation_suite_code"/), 'director_office');
});

test('Nightshade scene resumes in the hub on a reload once the scene has opened', () => {
    const J = read('ink/m08_nightshade_confrontation.json');
    const run = (opened) => {
        const s = new Story(J);
        s.variablesState.nightshade_scene_opened = opened;
        s.ChoosePathString('start');
        const out = [];
        while (s.canContinue) out.push(s.Continue().trim());
        return { out: out.join('\n'), choices: s.currentChoices.map((c) => c.text) };
    };
    const fresh = run(false);
    assert.match(fresh.out, /interrogation room records everything/);
    const resumed = run(true);
    assert.doesNotMatch(resumed.out, /interrogation room records everything/);
    assert.ok(resumed.choices.some((c) => /Two people are dead/.test(c)), 'hub topics offered');
    // first choice sets the latch
    const s = new Story(J);
    s.ChoosePathString('start');
    while (s.canContinue) s.Continue();
    s.ChooseChoiceIndex(1);
    s.Continue();
    assert.equal(s.variablesState.nightshade_scene_opened, true);
    // declared as a synced global in the scenario
    assert.match(ERB, /"nightshade_scene_opened": false/);
    // the fate latches still win over the resume divert
    const f = new Story(J);
    f.variablesState.nightshade_scene_opened = true;
    f.variablesState.fate_decided = true;
    f.ChoosePathString('start');
    const t = [];
    while (f.canContinue) t.push(f.Continue().trim());
    assert.match(t.join('\n'), /police come|expecting you upstairs|Leave him|^$/);
});

// ---- part 2 ----
const NS = read('ink/m08_nightshade_confrontation.json');

function runAuditRight(vars) {
    const s = new Story(DIR);
    Object.assign(s.variablesState, { suite_code: '5386', ...vars });
    s.ChoosePathString('audit_right');
    const out = [];
    while (s.canContinue) out.push(s.Continue().trim());
    return out.join('\n');
}

test('Director does not repeat the suite code or the Okafor evaluation once the player has them', () => {
    const none = runAuditRight({ all_flags_submitted: true });
    assert.match(none, /The code is 5386/);
    assert.match(none, /code card is in my safe as well, with Dr Okafor's evaluation/);

    const both = runAuditRight({ all_flags_submitted: true, suite_code_found: true, found_nightshade_profile: true });
    assert.doesNotMatch(both, /5386|Okafor|code card/);
    assert.match(both, /The chain is in\. He goes down to the suite now\./);

    const codeOnly = runAuditRight({ suite_code_found: true });
    assert.doesNotMatch(codeOnly, /5386/);
    assert.match(codeOnly, /Okafor's evaluation is in that safe as well/);
    assert.doesNotMatch(codeOnly, /code card/);

    const evalOnly = runAuditRight({ found_nightshade_profile: true });
    assert.match(evalOnly, /The code is 5386/);
    assert.doesNotMatch(evalOnly, /Okafor/);
});

test('Director reads-it-himself branch gates the same repeats', () => {
    const run = (vars) => {
        const s = new Story(DIR);
        Object.assign(s.variablesState, { suite_code: '5386', found_access_logs: true, audit_misreads: 2, audit_reply: 3, ...vars });
        s.ChoosePathString('audit_wrong');
        const out = [];
        while (s.canContinue) out.push(s.Continue().trim());
        return out.join('\n');
    };
    assert.match(run({}), /suite code is in my safe, with Dr Okafor's evaluation/);
    assert.doesNotMatch(run({ suite_code_found: true, found_nightshade_profile: true }), /safe|Okafor/);
});

test('"Not yet" at the disposition returns to the disposition, not the top of the scene', () => {
    const s = new Story(NS);
    s.variablesState.fate_decided = false;
    s.ChoosePathString('the_choice');
    while (s.canContinue) s.Continue();
    const notYet = s.currentChoices.findIndex(c => /^Not yet/.test(c.text));
    assert.ok(notYet >= 0);
    s.ChooseChoiceIndex(notYet);
    // the engine reads on past the exit tag, so run the story to its next stop
    while (s.canContinue) s.Continue();
    assert.equal(s.variablesState.held_at_choice, true);
    // next visit: start knot, like the room-entry mapping
    s.ChoosePathString('start');
    const first = s.Continue().trim();
    assert.match(first, /disposition screen behind you/);
    assert.ok(!/interrogation room records everything/.test(first));
    // a real choice clears the hold
    while (s.canContinue) s.Continue();
    const deal = s.currentChoices.findIndex(c => /^No deals/.test(c.text));
    s.ChooseChoiceIndex(deal);
    while (s.canContinue) s.Continue();
    assert.equal(s.variablesState.held_at_choice, false);
    assert.equal(s.variablesState.nightshade_arrested, true);
});

test('debrief "picked a locker" line only follows a seen lockpick, never a key', () => {
    const bg = read('ink/m08_background_agent.ink');
    assert.match(bg, /~ locker_seen_picked = true/);
    // the only trigger is the lockpick-in-view mapping; keys go to the key minigame, which never runs it
    const m = ERB.match(/"eventPattern": "lockpick_used_in_view",\s*"targetKnot": "on_locker_picked"/);
    assert.ok(m);
    assert.equal((ERB.match(/targetKnot": "on_locker_picked"/g) || []).length, 1);
});

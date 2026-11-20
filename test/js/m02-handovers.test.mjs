// m02 handovers (feat/m02-handovers), R1 M1: the person-NPC knots that ask the player a question
// survive a reload and a re-talk, an old save without the new lanyard keys still clears Val's
// check, saves made before the build do not re-fire their once-only HaX mappings, and Kim's
// badge is picked by name so games made before the build still receive it.
// Plays the real compiled ink with inkjs, the real NPCManager and the real give_item path.
// Run with: node --test test/js/m02-handovers.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const sys = join(js, 'systems');
const inkDir = join(root, 'scenarios/m02_ransomed_trust/ink');
const { Story } = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const quiet = { log: console.log, warn: console.warn, info: console.info };
const hush = () => { console.log = console.warn = console.info = () => {}; };
const loud = () => { Object.assign(console, quiet); };

const load = name => readFileSync(join(inkDir, `${name}.json`), 'utf8').replace(/^﻿/, '');
const JSONS = {
    gary: load('m02_npc_gary_whitlock'),
    bernie: load('m02_npc_receptionist'),
    val: load('m02_npc_security_guard'),
    kim: load('m02_npc_sarah_kim'),
    hax: load('m02_phone_agent0x99'),
    debrief: load('m02_closing_debrief')
};

// A story as the engine opens it: the synced globals written in (only the keys the save holds,
// and only ones the ink declares), the local VARs as given, then a knot.
function open(json, { globals = {}, locals = {}, path = 'start', saved = null } = {}) {
    const s = new Story(json);
    s.BindExternalFunction('player_name', () => 'Agent');
    if (saved) {
        s.state.LoadJson(saved);
        return s;
    }
    for (const [k, val] of Object.entries({ ...globals, ...locals })) {
        if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = val;
    }
    if (path) s.ChoosePathString(path);
    return s;
}
const run = s => {
    const text = [], tags = [];
    while (s.canContinue) {
        const t = s.Continue().trim();
        if (t) text.push(t);
        tags.push(...(s.currentTags || []));
    }
    return { text, tags, choices: s.currentChoices.map(c => c.text) };
};
const pick = (s, label) => {
    const i = s.currentChoices.findIndex(c => c.text.includes(label));
    assert.notEqual(i, -1, `choice "${label}" is offered (got ${JSON.stringify(s.currentChoices.map(c => c.text))})`);
    s.ChooseChoiceIndex(i);
    return run(s);
};
/** What a reload mid-choice does: save, build a fresh story, load the save. */
const reload = (json, s) => open(json, { saved: s.state.toJson() });
const v = (s, name) => s.variablesState[name];

// ---------------------------------------------------------------- Gary: cost_check

test('Gary cost_check: asked once the card is requested at influence 25+, right answer is not first', () => {
    const s = open(JSONS.gary, { locals: { gary_influence: 30 }, path: 'keycard_request' });
    const r = run(s);
    assert.equal(r.choices.length, 4);
    assert.ok(r.text.some(l => /What did I cost it at/.test(l)));
    assert.ok(!/Eighty-five/.test(r.choices[0]), 'the right answer is not the top option');
    assert.ok(r.choices.some(c => /Eighty-five/.test(c)));
    assert.equal(v(s, 'cost_checked'), false, 'nothing is marked answered before the player picks');
});

test('Gary cost_check: a reload mid-choice resumes at the same question without replaying it', () => {
    const s = open(JSONS.gary, { locals: { gary_influence: 30 }, path: 'keycard_request' });
    const before = run(s);
    const s2 = reload(JSONS.gary, s);
    assert.equal(s2.canContinue, false, 'nothing is left to print on the resumed story');
    assert.deepEqual(s2.currentChoices.map(c => c.text), before.choices, 'same four choices');
    const r = pick(s2, 'Eighty-five');
    assert.ok(r.tags.some(t => t.startsWith('give_item:keycard')), 'the card is handed over');
    assert.equal(v(s2, 'cost_checked'), true);
    assert.equal(v(s2, 'gave_keycard'), true);
});

test('Gary cost_check: Esc then a fresh talk asks again; a wrong answer drops the tier', () => {
    // Esc leaves cost_checked unset, so a re-talk that reaches the card question gets the same question
    const again = open(JSONS.gary, { locals: { gary_influence: 30, cost_checked: false }, path: 'keycard_request' });
    assert.equal(run(again).choices.length, 4, 'asked again after Esc');

    const wrong = open(JSONS.gary, { locals: { gary_influence: 30 }, path: 'keycard_request' });
    run(wrong);
    const r = pick(wrong, 'A hundred and fifty thousand');
    assert.equal(v(wrong, 'cost_checked'), true);
    assert.equal(v(wrong, 'gary_influence'), 20, 'a wrong figure drops him to the conditional tier');
    assert.equal(v(wrong, 'cost_failed'), true);
    assert.ok(r.tags.some(t => t.startsWith('give_item:keycard')), 'still gets the card, on conditions');
    assert.ok(!r.text.some(l => /sticky note/.test(l)), 'no password pointer in the conditional card scene');
});

test('Gary cost_check: once answered, it is not asked again on the same story', () => {
    const s = open(JSONS.gary, { locals: { gary_influence: 30 }, path: 'keycard_request' });
    run(s);
    pick(s, "I don't know the figure");
    assert.equal(v(s, 'cost_checked'), true);
    s.ChoosePathString('keycard_request');
    const r = run(s);
    assert.ok(!r.text.some(l => /What did I cost it at/.test(l)), 'the question is not repeated');
});

// ---------------------------------------------------------------- Bernie: key_on_badge

const BERNIE_WITHHELD = { bernie_key_withheld: true, has_countersigned_badge: true, bernie_gave_key: false, it_door_open: false };
const BADGE = "Kim's signed my badge";

test('Bernie key_on_badge: offered when the key was withheld and Kim has countersigned', () => {
    const s = open(JSONS.bernie, { globals: BERNIE_WITHHELD, locals: { gave_key: true } });
    const r = run(s);
    assert.ok(r.choices.some(c => c.includes(BADGE)), 'the badge option is on the hub');
});

test('Bernie key_on_badge: absent without the badge, once the door is open, or when the key was never withheld', () => {
    for (const override of [{ has_countersigned_badge: false }, { it_door_open: true }, { bernie_key_withheld: false }, { bernie_gave_key: true }]) {
        const s = open(JSONS.bernie, { globals: { ...BERNIE_WITHHELD, ...override }, locals: { gave_key: true } });
        const r = run(s);
        assert.ok(!r.choices.some(c => c.includes(BADGE)), `not offered with ${JSON.stringify(override)}`);
    }
});

test('Bernie key_on_badge: a reload mid-choice resumes with the option, and picking it gives the key once', () => {
    const s = open(JSONS.bernie, { globals: BERNIE_WITHHELD, locals: { gave_key: true } });
    const before = run(s);
    const s2 = reload(JSONS.bernie, s);
    assert.equal(s2.canContinue, false);
    assert.deepEqual(s2.currentChoices.map(c => c.text), before.choices);
    const r = pick(s2, BADGE);
    assert.ok(r.tags.includes('give_item:key:it_override_key'), 'the key is handed over');
    assert.ok(r.tags.includes('set_global:bernie_gave_key:true'));
    assert.equal(v(s2, 'bernie_gave_key'), true);
    assert.ok(!s2.currentChoices.some(c => c.text.includes(BADGE)), 'the option retires in the same story');
    // a fresh conversation after the sync (bernie_gave_key now true in the globals) cannot offer it again
    const s3 = open(JSONS.bernie, { globals: { ...BERNIE_WITHHELD, bernie_gave_key: true }, locals: { gave_key: true } });
    const r3 = run(s3);
    assert.ok(!r3.choices.some(c => c.includes(BADGE)), 'not offered again on a later visit');
    assert.ok(!r3.tags.some(t => t.startsWith('give_item')), 'no second key');
});

// ---------------------------------------------------------------- Val: found_pass_pretext / found_agency_pass

const COVER_BURNED = { cover_burned: true, cover_restored: false, staff_lanyard_obtained: true, val_challenged: true, val_met: true };
const SHOW = 'Show her the lanyard';

test('Val found_pass_pretext: a found contractor pass asks for a pretext, right answer is last', () => {
    const s = open(JSONS.val, { globals: { ...COVER_BURNED, holds_contractor_pass: true } });
    run(s);
    const r = pick(s, SHOW);
    assert.ok(r.text.some(l => /Blank IT pass/.test(l)));
    assert.equal(r.choices.length, 3);
    assert.ok(/server room reader/.test(r.choices[2]), 'the right answer is third');
    assert.ok(!/server room reader/.test(r.choices[0] + r.choices[1]));
    assert.ok(/IT\. I'm resetting/.test(r.choices[0]), 'the first option is a wrong IT story');
});

test('Val found_pass_pretext: reload mid-choice resumes; a wrong answer sends her away, a re-talk allows the right one', () => {
    const g = { ...COVER_BURNED, holds_contractor_pass: true };
    const s = open(JSONS.val, { globals: g });
    run(s);
    const asked = pick(s, SHOW);
    const s2 = reload(JSONS.val, s);
    assert.equal(s2.canContinue, false);
    assert.deepEqual(s2.currentChoices.map(c => c.text), asked.choices);

    const wrong = pick(s2, 'Estates');
    assert.ok(wrong.tags.includes('exit_conversation'));
    assert.equal(v(s2, 'cover_restored'), false, 'the wrong story does not restore the cover');

    // re-talk: a fresh story from the same globals offers the lanyard and the question again
    const s3 = open(JSONS.val, { globals: g });
    run(s3);
    const again = pick(s3, SHOW);
    assert.equal(again.choices.length, 3, 'the question comes back on the next talk');
    const right = pick(s3, 'server room reader');
    assert.ok(right.tags.includes('set_global:cover_restored:true'));
    assert.equal(v(s3, 'cover_restored'), true);
    assert.equal(v(s3, 'cleared_after_burn'), true);
});

test('Val found_agency_pass: refuses, and the refusal persists across re-talks and reloads', () => {
    const g = { ...COVER_BURNED, holds_agency_pass: true };
    const s = open(JSONS.val, { globals: g });
    const hub = run(s);
    assert.ok(hub.choices.some(c => c.includes(SHOW)));
    const saved = s.state.toJson();
    const r = pick(s, SHOW);
    assert.ok(r.text.some(l => /Doyle didn't open it for you/.test(l)));
    assert.ok(r.tags.includes('exit_conversation'));
    assert.equal(v(s, 'agency_pass_refused'), true);
    assert.equal(v(s, 'cover_restored'), false);

    // within this story the option is gone from the options list
    s.ChoosePathString('cover_challenge_options');
    assert.ok(!run(s).choices.some(c => c.includes(SHOW)), 'hidden after the refusal');

    // NPC-local variables are saved and seeded back (npc-conversation-state.js), so a later
    // talk or a page reload restores agency_pass_refused and the option stays hidden
    const kept = agencyRefusedLocals(s);
    const s2 = open(JSONS.val, { globals: g, locals: kept });
    assert.ok(!run(s2).choices.some(c => c.includes(SHOW)), 'still hidden on a later talk after the saved locals are restored');

    // a contractor pass arriving later reopens the option
    const s4 = open(JSONS.val, { globals: { ...g, holds_contractor_pass: true }, locals: kept });
    assert.ok(run(s4).choices.some(c => c.includes(SHOW)), 'a contractor pass makes the option available again');

    // and a save taken before the refusal replays to the same refusal
    const s3 = open(JSONS.val, { saved });
    const r3 = pick(s3, SHOW);
    assert.ok(r3.text.some(l => /Away from my door/.test(l)));
});

// What the engine keeps for an NPC across a page reload: the local ink variables only.
function agencyRefusedLocals(s) {
    return { agency_pass_refused: v(s, 'agency_pass_refused'), pretext_story_told: v(s, 'pretext_story_told'), influence: v(s, 'influence') };
}
/** A page reload: a fresh story seeded with the saved globals and locals, restarted at `start`. */
const pageReload = (json, s, names, globals = {}) => {
    const locals = {};
    for (const n of names) locals[n] = v(s, n);
    return open(json, { globals, locals });
};

test('Val: holding both passes asks the contractor pretext, not the agency refusal', () => {
    const s = open(JSONS.val, { globals: { ...COVER_BURNED, holds_agency_pass: true, holds_contractor_pass: true } });
    run(s);
    const r = pick(s, SHOW);
    assert.ok(r.text.some(l => /Blank IT pass/.test(l)));
});

// ---------------------------------------------------------------- saved games

test('old save: lanyard keys absent (not false) still clear Val through the legacy branch', () => {
    // A real old save has staff_lanyard_obtained but none of the keys this build added.
    const oldGlobals = { cover_burned: true, cover_restored: false, staff_lanyard_obtained: true, val_challenged: true, val_met: true };
    for (const k of ['lanyard_issued', 'gary_lanyard_issued', 'holds_contractor_pass', 'holds_agency_pass']) {
        assert.ok(!(k in oldGlobals), `${k} is absent from the save`);
    }
    const s = open(JSONS.val, { globals: oldGlobals });
    const hub = run(s);
    assert.ok(hub.choices.some(c => c.includes(SHOW)), 'the lanyard option is offered on staff_lanyard_obtained alone');
    const r = pick(s, SHOW);
    assert.ok(r.text.some(l => /Hospital pass\. Blank, no photo/.test(l)), 'legacy branch text');
    assert.ok(r.tags.includes('set_global:cover_restored:true'), 'the cover is restored');
    assert.equal(v(s, 'cleared_after_burn'), true);
    assert.ok(!r.text.some(l => /Blank IT pass|Doyle/.test(l)), 'no pretext question or agency refusal for an old save');
});

// ---------------------------------------------------------------- once-only mappings

const dir = mkdtempSync(join(tmpdir(), 'm02-handovers-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'), readFileSync(join(js, 'minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

function renderedScenario() {
    const script = `$stdout = File.open(File::NULL, 'w'); $stderr = File.open(File::NULL, 'w')
      require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      json, = render_erb_to_json(File.join(${JSON.stringify(root)}, 'scenarios/m02_ransomed_trust/scenario.json.erb'))
      STDOUT.puts JSON.generate(json)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', maxBuffer: 1 << 26 });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const findNpc = (node, id) => {
    if (Array.isArray(node)) { for (const x of node) { const r = findNpc(x, id); if (r) return r; } return null; }
    if (node && typeof node === 'object') {
        if (node.id === id && Array.isArray(node.eventMappings)) return node;
        for (const x of Object.values(node)) { const r = findNpc(x, id); if (r) return r; }
    }
    return null;
};

test('save from before the build: the once-only HaX mappings stay spent, the appended ones are live', async () => {
    const before = JSON.parse(readFileSync(join(here, 'fixtures/m02_hax_mappings_before_handovers.json'), 'utf8'));
    const hax = findNpc(renderedScenario(), before.npc);
    assert.ok(hax, 'Agent HaX is in the scenario');
    assert.ok(hax.eventMappings.length > before.mappings.length, 'the build appended mappings');

    globalThis.window = { gameState: { globalVariables: {} } };
    hush();
    const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
    const m = new NPCManager({ on() {}, off() {}, emit() {} }, null);
    // the save: every once-only mapping the old scenario had has fired
    const save = {};
    before.mappings.forEach((b, i) => { if (b.onceOnly) save[`${before.npc}:${b.eventPattern}:${i}`] = 1; });
    m.restoreTriggeredEvents(save);
    // data that satisfies the appended mappings' conditions (item id for the badge pickup, value for the global change,
    // the keypad safe and its room for the first-look aim unlock)
    const EVENT = { itemId: 'kim_countersigned_badge', value: true, objectType: 'safe', roomId: 'emergency_equipment_storage' };
    const norm = m._normalizeEventMappings(hax.eventMappings);
    const wouldFire = i => m._mappingWouldFire(before.npc, norm[i].eventPattern, m._buildMappingConfig(norm[i], i), EVENT).fire;
    const old = before.mappings.map((b, i) => ({ b, i, pattern: norm[i].eventPattern, fires: wouldFire(i) }));
    const added = norm.slice(before.mappings.length).map((a, k) => ({ a, fires: wouldFire(before.mappings.length + k) }));
    loud();

    for (const { b, i, pattern, fires } of old) {
        assert.equal(pattern, b.eventPattern, `index ${i} keeps its event pattern`);
        if (b.onceOnly) assert.equal(fires, false, `${b.eventPattern} (index ${i}) does not fire again`);
    }
    assert.ok(added.length >= 4);
    for (const { a, fires } of added) assert.equal(fires, true, `appended mapping ${a.eventPattern} is not blocked by the old save`);
});

// ---------------------------------------------------------------- Kim's badge, old and new games

test("Kim's badge: the give_item tag selects by name, so a game made before the build still receives it", async () => {
    const s = open(JSONS.kim, { path: 'access_problem' });
    const r = run(s);
    const tag = r.tags.find(t => t.startsWith('give_item:'));
    assert.equal(tag, 'give_item:id_badge:Visitor Badge (Countersigned)');

    globalThis.window = globalThis.window || {};
    hush();
    const { processGameActionTags } = await import(pathToFileURL(join(js, 'minigames/helpers/chat-helpers.js')).href);
    const { NPCGameBridge } = await import(pathToFileURL(join(sys, 'npc-game-bridge.js')).href);
    const results = [];
    for (const [label, badge] of [
        ['old copy (no id)', { type: 'id_badge', name: 'Visitor Badge (Countersigned)', takeable: true }],
        ['new copy (with id)', { type: 'id_badge', id: 'kim_countersigned_badge', name: 'Visitor Badge (Countersigned)', takeable: true }]
    ]) {
        const npc = { id: 'sarah_kim', itemsHeld: [{ type: 'id_badge', name: 'Other badge' }, badge, { type: 'notes', name: "Dr. Kim's Signed Statement" }] };
        const given = [];
        const bridge = Object.create(NPCGameBridge.prototype);
        bridge._logAction = () => {};
        bridge._receiveNote = () => {};
        window.NPCGameBridge = bridge;
        window.currentConversationNPCId = 'sarah_kim';
        window.npcManager = { getNPC: id => (id === 'sarah_kim' ? npc : null) };
        window.addToInventory = async sprite => { given.push(sprite.scenarioData); return { ok: true }; };
        window.playUISound = () => {};
        await processGameActionTags([tag], { showNotification() {} });
        results.push({ label, given, badge, left: npc.itemsHeld.includes(badge) });
    }
    loud();
    for (const { label, given, badge, left } of results) {
        assert.equal(given.length, 1, `${label}: one item reaches the player`);
        assert.equal(given[0], badge, `${label}: it is the countersigned badge`);
        assert.equal(left, false, `${label}: it leaves Kim's inventory`);
    }
});


// ---------------------------------------------------------------- R2 m5: Val's pretext costs something

test('Val found_pass_pretext: a wrong story costs influence and a second story is not heard', () => {
    const g = { ...COVER_BURNED, holds_contractor_pass: true };
    const s = open(JSONS.val, { globals: g, locals: { influence: 12 } });
    run(s);
    pick(s, SHOW);
    pick(s, 'Estates');
    assert.equal(v(s, 'influence'), 2, 'a wrong story costs 10');
    assert.equal(v(s, 'pretext_story_told'), true);
    assert.equal(v(s, 'cover_restored'), false);
    // later talk (locals restored): the lanyard option is gone, so no second story can be tried
    const s2 = pageReload(JSONS.val, s, ['influence', 'pretext_story_told'], g);
    assert.ok(!run(s2).choices.some(c => c.includes(SHOW)), 'no second story');
    // the other routes are still on offer (argument, Bernie when he trusts, the fight)
    assert.ok(s2.currentChoices.some(c => /Who benefits/.test(c.text)), 'the argument route remains');
    assert.ok(s2.currentChoices.some(c => /Fight her/.test(c.text)), 'so does the hard way');
    // Gary handing over a pass later reopens the option
    const s3 = pageReload(JSONS.val, s, ['influence', 'pretext_story_told'], { ...g, lanyard_issued: true, gary_lanyard_issued: true });
    assert.ok(run(s3).choices.some(c => c.includes(SHOW)), 'an issued pass is still accepted');
});

// ---------------------------------------------------------------- R2 m2: page reload, not just in-session restore

test('page reload restarts at start and re-asks Gary cost_check once, not duplicated', () => {
    const s = open(JSONS.gary, { locals: { gary_influence: 30, met_gary: true }, path: 'keycard_request' });
    run(s);
    // the page reloads: only the local variables come back, and the story starts at `start`
    const s2 = pageReload(JSONS.gary, s, ['gary_influence', 'met_gary', 'cost_checked', 'cost_failed']);
    const hub = run(s2);
    assert.ok(hub.text.some(l => /Yeah\?|What now\?|Any joy\?/.test(l)), 'start -> returning -> hub');
    assert.equal(hub.choices.filter(c => c.includes('I need into the server room')).length, 1, 'one card option on the hub');
    const asked = pick(s2, 'I need into the server room');
    assert.equal(asked.text.filter(l => /What did I cost it at/.test(l)).length, 1, 'the question is asked once');
    assert.equal(asked.choices.length, 4, 'four options');
    assert.equal(new Set(asked.choices).size, 4, 'none duplicated');
    assert.equal(v(s2, 'cost_checked'), false);
    const done = pick(s2, 'Eighty-five');
    assert.ok(done.tags.some(t => t.startsWith('give_item:keycard')));
});

test('page reload: Val found_pass_pretext is offered once from start, with no duplicate lanyard option', () => {
    const g = { ...COVER_BURNED, holds_contractor_pass: true };
    const s = open(JSONS.val, { globals: g });
    run(s);
    const s2 = pageReload(JSONS.val, s, ['influence', 'agency_pass_refused', 'pretext_story_told'], g);
    const hub = run(s2);
    assert.equal(hub.choices.filter(c => c.includes(SHOW)).length, 1, 'one lanyard option');
    const asked = pick(s2, SHOW);
    assert.equal(asked.choices.length, 3);
    assert.ok(asked.text.some(l => /Blank IT pass/.test(l)));
    assert.equal(asked.text.filter(l => /Blank IT pass/.test(l)).length, 1, 'asked once');
});

test('page reload: Bernie key_on_badge is offered once from start', () => {
    const s = open(JSONS.bernie, { globals: BERNIE_WITHHELD, locals: { gave_key: true } });
    run(s);
    const s2 = pageReload(JSONS.bernie, s, ['gave_key', 'bernie_influence'], BERNIE_WITHHELD);
    const r = run(s2);
    assert.equal(r.choices.filter(c => c.includes(BADGE)).length, 1, 'one badge option');
    const got = pick(s2, BADGE);
    assert.ok(got.tags.includes('give_item:key:it_override_key'));
});

// ---------------------------------------------------------------- R2 m2: Bernie's offer_key decision

test('Bernie offer_key: a rude player (influence 0) is signed in but gets no key', () => {
    const s = open(JSONS.bernie, { locals: { bernie_influence: 0 }, path: 'offer_key' });
    const r = run(s);
    assert.ok(r.tags.includes('set_global:bernie_key_withheld:true'));
    assert.equal(v(s, 'bernie_key_withheld'), true);
    assert.equal(v(s, 'bernie_gave_key'), false);
    assert.ok(!r.tags.some(t => t.startsWith('give_item')), 'no key');
    assert.ok(r.text.some(l => /The keys stay on my hook/.test(l)));
    assert.ok(!r.text.some(l => /find IT on your own/.test(l)), 'the old put-down is gone');
});

test('Bernie offer_key: a civil player (influence above 0) gets the key', () => {
    const s = open(JSONS.bernie, { locals: { bernie_influence: 2 }, path: 'offer_key' });
    const r = run(s);
    assert.ok(r.tags.includes('give_item:key:it_override_key'));
    assert.ok(r.tags.includes('set_global:bernie_gave_key:true'));
    assert.equal(v(s, 'bernie_gave_key'), true);
    assert.equal(v(s, 'bernie_key_withheld'), false);
});

test('Bernie offer_key: after a burn she is not withholding (met_after_burn)', () => {
    const s = open(JSONS.bernie, { locals: { bernie_influence: 0, met_after_burn: true }, path: 'offer_key' });
    const r = run(s);
    assert.ok(r.tags.includes('give_item:key:it_override_key'));
});

// ---------------------------------------------------------------- HaX wall-safe hint, debrief Nightshade line

test('HaX hint_wall_safe: with the cracker it says the answer is already in hand', () => {
    const s = open(JSONS.hax, { locals: { pin_cracker_found: true }, path: 'hint_wall_safe' });
    const r = run(s);
    assert.ok(r.text.some(l => /You're already carrying the answer/.test(l)));
    assert.ok(!r.text.some(l => /Nobody to ask, so don't/.test(l)));
});

test('HaX hint_wall_safe: without the cracker it points at the sealed case', () => {
    const s = open(JSONS.hax, { locals: { pin_cracker_found: false }, path: 'hint_wall_safe' });
    const r = run(s);
    assert.ok(r.text.some(l => /Nobody to ask, so don't/.test(l)));
    assert.ok(!r.text.some(l => /You're already carrying the answer/.test(l)));
});

test('HaX support hub: the wall-safe option is offered only while the safe is unopened', () => {
    const base = { seen_wall_safe: true, reeves_safe_opened: false };
    const open1 = open(JSONS.hax, { locals: base, path: 'support_hub' });
    assert.ok(run(open1).choices.some(c => /keypad safe in Val's office/.test(c)));
    const open2 = open(JSONS.hax, { locals: { ...base, reeves_safe_opened: true }, path: 'support_hub' });
    assert.ok(!run(open2).choices.some(c => /keypad safe in Val's office/.test(c)));
});

const NIGHT = /You turned it on their own man's wall safe, I hear/;
test('debrief q_pin_cracker: Nightshade mentions the wall safe right after "Mastermind, in silicon" when it was opened', () => {
    const s = open(JSONS.debrief, { locals: { pin_cracker_found: true, reeves_safe_opened: true }, path: 'q_pin_cracker' });
    const r = run(s);
    const i = r.text.findIndex(l => /Mastermind, in silicon/.test(l));
    assert.notEqual(i, -1);
    assert.match(r.text[i + 1], NIGHT);
    assert.equal(r.text.filter(l => NIGHT.test(l)).length, 1);
});

test('debrief q_pin_cracker: the wall-safe line is skipped when the safe was never opened', () => {
    const s = open(JSONS.debrief, { locals: { pin_cracker_found: true, reeves_safe_opened: false }, path: 'q_pin_cracker' });
    const r = run(s);
    const i = r.text.findIndex(l => /Mastermind, in silicon/.test(l));
    assert.notEqual(i, -1);
    assert.ok(!r.text.some(l => NIGHT.test(l)));
    assert.match(r.text[i + 1], /The firmware is how I know/);
});

// ---------------------------------------------------------------- Gary: apology route after the lanyard refusal

const WRONG = 'I was wrong';
test('Gary defensive: after the blame opener and a refused lanyard, a resume at the hub still offers the apology', () => {
    const s = open(JSONS.gary, { path: 'open_blame' });
    run(s);
    pick(s, 'Take the card back');
    pick(s, 'pulled my booking');
    const out = pick(s, 'Fair');
    assert.ok(out.tags.includes('exit_conversation'));
    assert.equal(v(s, 'gary_defensive'), true);
    // The engine reopens the knot the pending choices belong to and replays it from the top.
    const resumed = open(JSONS.gary, { locals: { gary_defensive: true, gave_keycard: true, cover_burned: true, lanyard_refused: true, gary_influence: -8 }, path: 'hub' });
    const r = run(resumed);
    assert.ok(r.choices.some(c => c.includes(WRONG)), `apology offered (got ${JSON.stringify(r.choices)})`);
    const thaw = pick(resumed, WRONG);
    assert.equal(v(resumed, 'gary_defensive'), false);
    assert.ok(thaw.text.some(l => /call it square/.test(l)));
});

test('Gary not defensive: the hub does not offer the apology', () => {
    const s = open(JSONS.gary, { locals: { gave_keycard: true, met_gary: true, gary_influence: 10 }, path: 'hub' });
    assert.ok(!run(s).choices.some(c => c.includes(WRONG)));
});

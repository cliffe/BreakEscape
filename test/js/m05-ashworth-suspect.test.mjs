// m05 D136 a (2026-11-18): Ben Ashworth is a live third suspect. A third vetting folder and a
// final-demand notice point at him; the badge log rules him out. Patricia (in person and by phone)
// and HaX (the KO route) each take the name. Without the log it is a free pointer to it; with the
// log it is a guess (trust cost in person, torres_reason_guessed everywhere). Torres stays the
// true insider and the naming still works afterwards.
// Run with: node --test test/js/m05-ashworth-suspect.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const ink = f => readFileSync(join(root, 'scenarios/m05_insider_trading/ink', f), 'utf8').replace(/^﻿/, '');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function render() {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      d, _ = render_erb_to_json(${JSON.stringify(join(root, 'scenarios/m05_insider_trading/scenario.json.erb'))}, {}, include_rendered: true)
      puts JSON.generate(d)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }, maxBuffer: 64 * 1024 * 1024 });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const scenario = skip ? null : render();
const rooms = scenario ? scenario.rooms : {};
const allNpcs = Object.values(rooms).flatMap(r => r.npcs || []);
const patricia = allNpcs.find(n => n.id === 'patricia_morgan');
const hax = allNpcs.find(n => (n.eventMappings || []).some(m => m.eventPattern === 'conversation_closed:opening_briefing'));

function play(file, knot, vars, picks = []) {
    const s = new inkjs.Story(ink(file));
    ['player_name', 'current_mission_id', 'npc_location', 'mission_phase', 'operational_stress_level', 'equipment_status']
        .forEach(n => { try { s.BindExternalFunction(n, () => 'x'); } catch (e) { /* not declared */ } });
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    const lines = [], tags = [];
    const pump = () => { while (s.canContinue) { const t = s.Continue().trim(); if (t) lines.push(t); tags.push(...s.currentTags); } };
    pump();
    for (const p of picks) {
        const c = s.currentChoices.find(x => x.text.includes(p));
        assert.ok(c, `choice "${p}" missing; have ${JSON.stringify(s.currentChoices.map(x => x.text))}`);
        s.ChooseChoiceIndex(c.index); pump();
    }
    return { s, lines, tags, choices: s.currentChoices.map(c => c.text), v: k => s.variablesState[k] };
}
const CAN_NAME = { torres_identified: false };
const has = (arr, re) => arr.some(l => re.test(l));

test('scenario: third folder, notice, globals, and the KO drop', { skip }, () => {
    const held = patricia.itemsHeld.map(i => i.id);
    assert.ok(held.includes('ashworth_vetting_file') && held.includes('torres_vetting_file') && held.includes('halloran_vetting_file'));
    const f = patricia.itemsHeld.find(i => i.id === 'ashworth_vetting_file');
    assert.match(f.text, /Ben Ashworth/);
    assert.match(f.text, /#4419/);
    assert.equal(f.onRead.setVariable.found_ashworth_vetting, true);
    const notice = (rooms.open_office_area.objects || []).find(o => o.id === 'ashworth_final_notice');
    assert.ok(notice && notice.readable && notice.takeable);
    assert.equal(notice.onRead.setVariable.found_ashworth_notice, true);
    for (const g of ['found_ashworth_vetting', 'found_ashworth_notice', 'ashworth_lead_texted', 'ashworth_named']) assert.equal(scenario.globalVariables[g], false, g);
    // ids and names unique across every item (the server resolves by id OR name)
    const seen = new Map();
    const walk = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk);
        if (o.id && o.name && o.type) { for (const k of [o.id, o.name]) { assert.ok(!seen.has(k) || seen.get(k) === o.id, `duplicate ${k}`); seen.set(k, o.id); } }
        Object.values(o).forEach(walk); };
    walk(rooms);
});

test('scenario: one HaX reaction to the lead, latched once, dash-free, no culprit named', { skip }, () => {
    const latches = hax.eventMappings.filter(m => m.setGlobal && m.setGlobal.ashworth_lead_texted);
    assert.deepEqual(latches.map(m => m.eventPattern).sort(), ['global_variable_changed:found_ashworth_notice', 'global_variable_changed:found_ashworth_vetting']);
    latches.forEach(m => assert.ok(m.onceOnly));
    const r = hax.eventMappings.filter(m => m.eventPattern === 'global_variable_changed:ashworth_lead_texted');
    assert.equal(r.length, 1);
    assert.ok(r[0].onceOnly);
    assert.equal(r[0].sendTimedMessage.skipIfGlobal, 'torres_identified');
    assert.doesNotMatch(r[0].sendTimedMessage.message, /[–—]|Torres|Halloran/);
    assert.ok(r[0].sendTimedMessage.message.split(/\s+/).length <= 30);
});

test('Patricia in person: lead only, no log: a free pointer to the log', () => {
    const r = play('m05_npc_patricia_morgan.json', 'share_findings_who', { ...CAN_NAME, found_ashworth_notice: true }, ['Ben Ashworth', 'broke']);
    assert.ok(has(r.lines, /lead, not a case/) && has(r.lines, /badge readers/));
    assert.equal(r.v('patricia_influence'), 5);
    assert.equal(r.v('torres_reason_guessed'), false);
    assert.ok(r.tags.includes('exit_conversation'));
});

test('Patricia in person: with the log the name is a guess and costs trust, both reasons', () => {
    for (const reason of ['broke', 'badge is on the server hallway']) {
        const r = play('m05_npc_patricia_morgan.json', 'share_findings_who', { ...CAN_NAME, found_door_log: true, found_ashworth_vetting: true }, ['Ben Ashworth', reason]);
        assert.ok(has(r.lines, /4419|own badge/) && has(r.lines, /4471/), reason);
        assert.equal(r.v('patricia_influence'), 4, reason);
        assert.equal(r.v('torres_reason_guessed'), true, reason);
        assert.ok(r.tags.includes('influence_decreased') && r.tags.includes('exit_conversation'));
        assert.equal(r.v('torres_identified'), false);
        assert.equal(r.v('halloran_accused'), false);
    }
});

test('Patricia in person: the name is offered on a lead or the log, never on nothing', () => {
    assert.ok(!play('m05_npc_patricia_morgan.json', 'share_findings_who', { ...CAN_NAME }).choices.some(c => /Ben/.test(c)));
    assert.ok(play('m05_npc_patricia_morgan.json', 'share_findings_who', { ...CAN_NAME, found_ashworth_vetting: true }).choices.some(c => /Ben/.test(c)));
    assert.ok(play('m05_npc_patricia_morgan.json', 'share_findings_who', { ...CAN_NAME, found_door_log: true }).choices.some(c => /Ben/.test(c)));
});

test('Patricia in person: after the wrong guess Torres is still named and finished', () => {
    const r = play('m05_npc_patricia_morgan.json', 'share_findings_who', { ...CAN_NAME, found_door_log: true, found_ashworth_vetting: true, found_medical_bills: true, found_manifest: true, flag3_submitted: true, torres_reason_guessed: true },
        ['David Torres', 'badge comes in the front door']);
    assert.ok(has(r.lines, /Every night/));
    assert.equal(r.v('door_log_reasoned'), true);
});

test('Patricia hands over three folders', () => {
    const r = play('m05_npc_patricia_morgan.json', 'request_authorization', { found_door_log: true }, ['vetting files']);
    assert.ok(r.tags.some(t => /give_item:notes:ashworth_vetting_file/.test(t)));
    assert.ok(has(r.lines, /three folders/) && has(r.lines, /Ben Ashworth/));
    assert.equal(r.v('found_ashworth_vetting'), true);
});

test('Patricia by phone: same lead and log behaviour', () => {
    const a = play('m05_phone_patricia.json', 'phone_who', { ...CAN_NAME, found_ashworth_vetting: true }, ['Ben Ashworth', 'broke']);
    assert.ok(has(a.lines, /lead, not a case/));
    assert.equal(a.v('torres_reason_guessed'), false);
    const b = play('m05_phone_patricia.json', 'phone_who', { ...CAN_NAME, found_door_log: true }, ['Ben Ashworth', 'server hallway']);
    assert.ok(has(b.lines, /4471/));
    assert.equal(b.v('torres_reason_guessed'), true);
    assert.ok(b.tags.includes('exit_conversation'));
});

test('HaX (Patricia KO): lead only points at the log; with the log it is a guess; Torres still namable', () => {
    const a = play('m05_phone_agent_0x99.json', 'name_to_hax_who', { ...CAN_NAME, patricia_ko: true, found_ashworth_notice: true }, ['Ben Ashworth']);
    assert.ok(has(a.lines, /lead, not a case/));
    assert.equal(a.v('torres_reason_guessed'), false);
    const b = play('m05_phone_agent_0x99.json', 'name_to_hax_who', { ...CAN_NAME, patricia_ko: true, found_door_log: true }, ['Ben Ashworth']);
    assert.ok(has(b.lines, /two till four/));
    assert.equal(b.v('torres_reason_guessed'), true);
    const c = play('m05_phone_agent_0x99.json', 'name_to_hax_who', { ...CAN_NAME, patricia_ko: true, found_door_log: true, found_ashworth_vetting: true });
    assert.ok(c.choices.some(x => /David Torres/.test(x)) && c.choices.some(x => /Ben/.test(x)));
});

test('the Ashworth lines carry no em dash', () => {
    const src = ['m05_npc_patricia_morgan.ink', 'm05_phone_patricia.ink', 'm05_phone_agent_0x99.ink'].map(ink).join('\n');
    const block = src.split('\n').filter((l, i, a) => /ashworth|Ben/i.test(l) && !/^\s*(\/\/|VAR)/.test(l));
    for (const l of block) assert.doesNotMatch(l, /—|–/);
});

test('debrief: no Ashworth praise for a player who named him, praise for one who held the lead and did not', () => {
    const praise = /never spent a name on him/;
    const picks = ['And the research portal?', 'Whose job was it to fix that?'];
    const base = { found_pamphlet: true, found_door_log: true };
    const run = v => play('m05_closing_debrief.json', 'the_night', { ...base, ...v }, picks);
    const named = run({ ashworth_lead_texted: true, ashworth_named: true, torres_reason_guessed: true });
    assert.ok(has(named.lines, /wrong name or a wrong reason/));
    assert.ok(!has(named.lines, praise) && !has(named.lines, /Ben Ashworth/));
    const held = run({ ashworth_lead_texted: true, ashworth_named: false });
    assert.ok(has(held.lines, praise));
    assert.ok(!has(run({}).lines, praise));
});

test('debrief: other wrong names or reasons silence the praise too', () => {
    const praise = /never spent a name on him/;
    const picks = ['And the research portal?', 'Whose job was it to fix that?'];
    const run = v => play('m05_closing_debrief.json', 'the_night', { found_pamphlet: true, found_door_log: true, ...v }, picks);
    assert.ok(!has(run({ ashworth_lead_texted: true, halloran_accused: true }).lines, praise));
    assert.ok(!has(run({ ashworth_lead_texted: true, torres_reason_guessed: true }).lines, praise));
    assert.ok(has(run({ ashworth_lead_texted: true }).lines, praise));
});

test('naming Ben WITHOUT the log still sets ashworth_named (Patricia, her phone, HaX) so no praise follows', () => {
    const picks = ['And the research portal?', 'Whose job was it to fix that?'];
    const a = play('m05_npc_patricia_morgan.json', 'share_findings_who', { ...CAN_NAME, found_ashworth_notice: true }, ['Ben Ashworth', 'broke']);
    const b = play('m05_phone_patricia.json', 'phone_who', { ...CAN_NAME, found_ashworth_vetting: true }, ['Ben Ashworth', 'broke']);
    const c = play('m05_phone_agent_0x99.json', 'name_to_hax_who', { ...CAN_NAME, patricia_ko: true, found_ashworth_notice: true }, ['Ben Ashworth']);
    // Closing the chat at "Ben. Why?" must also count.
    const d = play('m05_npc_patricia_morgan.json', 'share_findings_who', { ...CAN_NAME, found_ashworth_notice: true }, ['Ben Ashworth']);
    const e = play('m05_phone_patricia.json', 'phone_who', { ...CAN_NAME, found_ashworth_vetting: true }, ['Ben Ashworth']);
    for (const r of [a, b, c, d, e]) {
        assert.equal(r.v('ashworth_named'), true);
        assert.equal(r.v('torres_reason_guessed'), false);
        const deb = play('m05_closing_debrief.json', 'the_night', { found_pamphlet: true, found_door_log: true, ashworth_lead_texted: true, ashworth_named: r.v('ashworth_named') }, picks);
        assert.ok(!has(deb.lines, /never spent a name on him/));
    }
});

test('scenario: the Ashworth latch mappings stop once Torres is named', { skip }, () => {
    const latches = hax.eventMappings.filter(m => m.setGlobal && m.setGlobal.ashworth_lead_texted);
    assert.equal(latches.length, 2);
    for (const m of latches) assert.equal(m.condition, 'value === true && globalVars.torres_identified !== true');
});

test('HaX KO route: naming Ben with the log sets ashworth_named', () => {
    const c = play('m05_phone_agent_0x99.json', 'name_to_hax_who', { ...CAN_NAME, patricia_ko: true, found_door_log: true, found_ashworth_vetting: true }, ['Ben Ashworth']);
    assert.equal(c.v('ashworth_named'), true);
});

test('scenario: the Ashworth mappings are the LAST HaX mappings, so no saved once-index moves', { skip }, () => {
    // Later mappings go AFTER these (append-only keeps saved once-indexes stable); when you add one, extend this list rather than moving Ashworth to the end again.
    // m05 blind fixes: the transfer-log and upload-schedule task ticks are appended after them.
    const tail = hax.eventMappings.slice(-5).map(m => m.eventPattern);
    assert.deepEqual(tail, ['global_variable_changed:found_ashworth_notice', 'global_variable_changed:found_ashworth_vetting', 'global_variable_changed:ashworth_lead_texted', 'global_variable_changed:found_transfer_log', 'global_variable_changed:found_upload_schedule']);
});

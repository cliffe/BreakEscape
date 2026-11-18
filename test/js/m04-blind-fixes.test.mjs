// m04 blind-playtest fixes:
//   - Vance's ally choices offer the evacuation topic straight after he commits.
//   - HaX's debrief line about the unsounded alarm only when Vance is an ally, not
//     knocked out, and the alarm was not sounded.
//   - Static's forced chat: the three options that make him hostile carry a tone hint,
//     the one that de-escalates reads differently.
//   - The ESD station is wallMounted, and the reach maths gives a fair range.
// Run with: node test/js/m04-blind-fixes.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import { reachX, reachY } from '../../public/break_escape/js/systems/interaction-reach.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const inkjs = require(join(root, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);
const ink = (n) => readFileSync(join(root, 'scenarios/m04_critical_failure/ink', n + '.json'), 'utf8').replace(/^﻿/, '');

function story(file, vars, path) {
    const s = new Story(ink(file));
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    if (path) s.ChoosePathString(path);
    return s;
}
function drain(s) {
    const lines = [];
    while (s.canContinue) lines.push(s.Continue().trim());
    return lines;
}
const labels = (s) => s.currentChoices.map((c) => c.text.trim());

const VANCE_LINE = 'Vance had the evacuation alarm on his desk all night.';
const quietNight = { crew_warned: false, crew_lost: false, racks_vented: false, vented_by_trigger: false,
    disclosure_choice: 'partial' };

test('Vance: the evacuation topic is offered straight after he commits', () => {
    const s = story('m04_npc_robert_vance', { anomaly_detected: true, vance_provided_keycard: true }, 'vance_commits_choices');
    drain(s);
    const l = labels(s);
    assert.ok(l.some((x) => /Is anyone working in the halls tonight/.test(x)), 'crew topic offered: ' + l.join(' | '));
    assert.ok(l.some((x) => /I'm going/.test(x)));
});

test('Vance: after the cost is explained, the alarm itself is offered', () => {
    const s = story('m04_npc_robert_vance', { anomaly_detected: true, crew_discussed: true }, 'vance_commits_choices');
    drain(s);
    assert.ok(labels(s).some((x) => /Sound the evacuation/.test(x)));
});

test('Vance: no crew topic before there is a hazard, or once it is moot', () => {
    for (const v of [{}, { anomaly_detected: true, crew_warned: true }, { anomaly_detected: true, attack_prevented: true },
        { anomaly_detected: true, racks_vented: true }]) {
        const s = story('m04_npc_robert_vance', v, 'vance_commits_choices');
        drain(s);
        assert.ok(!labels(s).some((x) => /Is anyone working|Sound the evacuation/.test(x)), JSON.stringify(v));
    }
});

function debrief(vars) {
    const s = story('m04_closing_debrief', { ...quietNight, ...vars }, 'task_force_accepted');
    const out = [];
    for (let i = 0; i < 40; i++) {
        out.push(...drain(s));
        if (!s.currentChoices.length) break;
        s.ChooseChoiceIndex(0);
    }
    return out;
}

test('debrief: the alarm line shows for an ally who was not knocked out and never sounded it', () => {
    assert.ok(debrief({ vance_is_ally: true, robert_vance_ko: false }).some((x) => x.includes(VANCE_LINE)));
});

test('debrief: the alarm line is absent without the ally, with him knocked out, or once the alarm went', () => {
    for (const v of [{ vance_is_ally: false }, { vance_is_ally: true, robert_vance_ko: true },
        { vance_is_ally: true, crew_warned: true }]) {
        assert.ok(!debrief(v).some((x) => x.includes(VANCE_LINE)), JSON.stringify(v));
    }
});

test('debrief: crew lost keeps its own copy of the line (no double)', () => {
    const lines = debrief({ vance_is_ally: true, crew_lost: true });
    assert.equal(lines.filter((x) => x.includes(VANCE_LINE)).length, 1);
});

test('Static: the three hostile options hint at their tone; the quiet way reads differently', () => {
    const s = story('m04_npc_operative_static', {}, 'static_standoff');
    drain(s);
    const l = labels(s);
    assert.equal(l.length, 4);
    const hostile = l.filter((x) => !/not here for you/.test(x));
    assert.equal(hostile.length, 3);
    for (const h of hostile) assert.match(h, /^\((Press|Needle|Shove)/, h);
    const calm = l.find((x) => /not here for you/.test(x));
    assert.match(calm, /^\(Stand down\.\)/);
    // The tone hints do not give the outcome away
    for (const x of l) assert.ok(!/hostile|fight|attack/i.test(x), x);
});

test('Static: only the calm option stands him aside; the others turn him hostile', () => {
    for (let i = 0; i < 4; i++) {
        const s = story('m04_npc_operative_static', {}, 'static_standoff');
        drain(s);
        const calm = labels(s).findIndex((x) => /not here for you/.test(x));
        s.ChooseChoiceIndex(i);
        let tags = [];
        while (s.canContinue) { s.Continue(); tags.push(...(s.currentTags || [])); }
        if (i === calm) assert.ok(tags.includes('set_global:static_stood_aside:true'), 'calm tags ' + tags);
        else assert.ok(tags.includes('hostile'), `option ${i} tags ` + tags);
    }
});

// ESD pushbutton: 20x25 station at top-left (161, 65). Reach is INTERACTION_RANGE (32 px).
const RANGE = 32;
const esd = { x: 161, y: 65, displayWidth: 20, displayHeight: 25, originX: 0, originY: 0,
    scenarioData: { id: 'esd_pushbutton', wallMounted: true } };
const dist = (s, px, py) => Math.hypot(reachX(s, px) - px, reachY(s, py) - py);

test('ESD: the scenario marks the station wallMounted', () => {
    const erb = readFileSync(join(root, 'scenarios/m04_critical_failure/scenario.json.erb'), 'utf8');
    const i = erb.indexOf('"id": "esd_pushbutton",\n          "name"');
    assert.ok(i > 0, 'object found');
    assert.match(erb.slice(i, i + 4000), /"wallMounted": true/);
});

test('ESD: reach to the station is fair, front-on and from the side', () => {
    // Before: measured to the top edge (y 65), so a player at the station's front (y ~100) was 35 px out.
    const plain = { ...esd, scenarioData: { id: 'esd_pushbutton' } };
    assert.ok(dist(plain, 171, 100) > RANGE, 'old reach was out of range at y 100');
    // After: the clamp measures to the nearest part of the 25 px body.
    assert.ok(dist(esd, 171, 100) <= RANGE, 'in range at y 100');
    assert.ok(dist(esd, 171, 112) <= RANGE, 'in range at y 112');
    assert.ok(dist(esd, 150, 85) <= RANGE, 'in range from the left');
    assert.ok(dist(esd, 195, 85) <= RANGE, 'in range from the right');
    assert.ok(dist(esd, 171, 130) > RANGE, 'still refuses a far player');
    // Never longer than before
    for (let y = 40; y <= 140; y += 4) assert.ok(dist(esd, 171, y) <= dist(plain, 171, y) + 1e-9, 'y ' + y);
});

test('ESD: from the Hall 2 side (above) the reach is unchanged, so Relay cannot use it from there', () => {
    const plain = { ...esd, scenarioData: { id: 'esd_pushbutton' } };
    for (const y of [20, 33, 45, 60]) assert.equal(dist(esd, 171, y), dist(plain, 171, y), 'y ' + y);
});

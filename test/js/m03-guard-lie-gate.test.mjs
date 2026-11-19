// m03 D187: the HaX debrief line and the credits line about Terry believing a lie.
// Gate: guard_waved_on (set when Terry's hub is reached) and neither the truth (told SAFETYNET) nor a bribe.
// Run with: node test/js/m03-guard-lie-gate.test.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const json = readFileSync(join(root, 'scenarios/m03_ghost_in_the_machine/ink/m03_closing_debrief.json'), 'utf8');
const erb = readFileSync(join(root, 'scenarios/m03_ghost_in_the_machine/scenario.json.erb'), 'utf8');

const HAX = "The guard believed you. That's one more reason to stop trusting a torch and a good story.";
const CREDIT = 'THE GUARD: LIED TO, AND BELIEVED';

function debriefText(vars) {
    const story = new inkjs.Story(json);
    // Globals the debrief ink does not declare (guard_waved_on) are simply not visible to it.
    for (const [k, v] of Object.entries(vars)) { try { story.variablesState[k] = v; } catch (e) { /* undeclared */ } }
    const lines = [];
    for (let i = 0; i < 40 && story.canContinue; i++) lines.push(story.Continue());
    return lines.join('\n');
}

function creditShows(globalVars) {
    const m = erb.match(new RegExp('"text": "' + CREDIT + '"[^\\n]*"condition": "([^"]+)"'));
    assert.ok(m !== null, 'credits line missing from scenario');
    return new Function('globalVars', 'return !!(' + m[1] + ');')(globalVars) === true;
}

const cases = [
    ['lied and was believed', { guard_lie_believed: true }, true],
    ['never spoke to him', {}, false],
    ['waved on but never believed (notebook mismatch, or Restart after a turn-away)', { guard_waved_on: true }, false],
    ['told him the truth', { guard_lie_believed: true, guard_told_safetynet: true }, false],
    ['paid him', { guard_lie_believed: true, guard_bribed: true }, false],
    ['believed, caught later', { guard_lie_believed: true, guard_detection_count: 1 }, true],
];

for (const [name, vars, want] of cases) {
    test('HaX debrief line: ' + name, () => {
        assert.ok(debriefText(vars).includes(HAX) === want, 'debrief line ' + (want ? 'missing' : 'present'));
    });
    test('credits line: ' + name, () => {
        assert.ok(creditShows(vars) === want, 'credits line ' + (want ? 'hidden' : 'shown'));
    });
}

// Terry's hub sets guard_waved_on only when he has not ordered the player out.
function terryWaved(ordered) {
    const tj = readFileSync(join(root, 'scenarios/m03_ghost_in_the_machine/ink/m03_npc_terry_mott.json'), 'utf8');
    const story = new inkjs.Story(tj);
    const vars = { player_warned: true, excuse_given: true, mission_phase: 'act2_infiltration', ordered_out: ordered };
    for (const [k, v] of Object.entries(vars)) story.variablesState[k] = v;
    let waved = false;
    for (let i = 0; i < 30 && story.canContinue; i++) {
        story.Continue();
        if ((story.currentTags || []).some((t) => /guard_waved_on/.test(t))) waved = true;
    }
    return waved;
}

test('hub sets guard_waved_on after a believed story', () => {
    assert.ok(terryWaved(false) === true, 'hub should set the flag');
});

test('hub does not set guard_waved_on when Terry ordered the player out', () => {
    assert.ok(terryWaved(true) === false, 'ordered-out re-entry must not count as believed');
});

// A wave-on is withdrawn when he turns the player away (failed bribe, favour refused, caught picking, hostile).
function terryTags(knot, vars, choice) {
    const tj = readFileSync(join(root, 'scenarios/m03_ghost_in_the_machine/ink/m03_npc_terry_mott.json'), 'utf8');
    const story = new inkjs.Story(tj);
    for (const [k, v] of Object.entries(vars)) story.variablesState[k] = v;
    story.ChoosePathString(knot);
    const tags = [];
    for (let i = 0; i < 30 && story.canContinue; i++) {
        story.Continue();
        for (const t of story.currentTags || []) tags.push(t);
    }
    return tags;
}

for (const knot of ['bribe_response_low', 'trespass_warning', 'hostile_count', 'on_lockpick_detected']) {
    test(`${knot} withdraws guard_waved_on`, () => {
        const tags = terryTags(knot, { mission_phase: 'act2_infiltration' });
        assert.ok(tags.some((t) => /guard_waved_on:false/.test(t)), 'expected set_global guard_waved_on false, got ' + JSON.stringify(tags));
    });
}


// Route checks: drive Terry's ink through real choices and fold the set_global tags into a globals map.
function runTerry(startKnot, vars, picks) {
    const tj = readFileSync(join(root, 'scenarios/m03_ghost_in_the_machine/ink/m03_npc_terry_mott.json'), 'utf8');
    const story = new inkjs.Story(tj);
    for (const [k, v] of Object.entries(vars)) story.variablesState[k] = v;
    const globals = {};
    const fold = () => {
        for (const t of story.currentTags || []) {
            const m = /^set_global:(\w+):(true|false)$/.exec(t.trim());
            if (m) globals[m[1]] = m[2] === 'true';
        }
    };
    story.ChoosePathString(startKnot);
    for (const pick of picks.concat([null])) {
        for (let i = 0; i < 40 && story.canContinue; i++) { story.Continue(); fold(); }
        if (pick === null) break;
        const idx = story.currentChoices.findIndex((c) => pick.test(c.text));
        assert.ok(idx >= 0, 'choice not found: ' + pick + ' in ' + JSON.stringify(story.currentChoices.map((c) => c.text)));
        story.ChooseChoiceIndex(idx);
    }
    return globals;
}

const NIGHT = { mission_phase: 'act2_infiltration', player_warned: true };

test('Sterling-files story that he believes sets guard_lie_believed', () => {
    const g = runTerry('excuse_menu', { ...NIGHT, ffion_night_story: 'brushoff' }, [/Sterling asked me/, /Training programme enrolment forms/]);
    assert.ok(g.guard_lie_believed === true, 'expected guard_lie_believed true, got ' + JSON.stringify(g));
});

test('"Notebook, files. Make your mind up" does not set guard_lie_believed', () => {
    const g = runTerry('excuse_menu', { ...NIGHT, ffion_night_story: 'notebook' }, [/Sterling asked me/]);
    assert.ok(g.guard_lie_believed !== true, 'he does not believe that one: ' + JSON.stringify(g));
    assert.ok(g.guard_waved_on === true, 'he still lets the player carry on (sighting skip)');
});

test('Restart after a turn-away gives no credit', () => {
    // Believed, then turned away (failed bribe path), then a Restart re-wave through the hub.
    const believed = runTerry('excuse_menu', { ...NIGHT, ffion_night_story: 'brushoff' }, [/Sterling asked me/, /Training programme enrolment forms/]);
    const away = runTerry('trespass_warning', NIGHT, []);
    const rewave = runTerry('hub', { ...NIGHT, fight_was_reset: true }, []);
    const globalsNow = { ...believed, ...away, ...rewave };
    assert.ok(globalsNow.guard_waved_on === true, 'hub re-wave sets the sighting skip');
    assert.ok(globalsNow.guard_lie_believed !== true, 'but no believed lie: ' + JSON.stringify(globalsNow));
    assert.ok(creditShows(globalsNow) === false, 'credit must not show');
    assert.ok(debriefText(globalsNow).includes(HAX) === false, 'debrief line must not play');
});

for (const knot of ['bribe_response_low', 'trespass_warning', 'hostile_count', 'on_lockpick_detected']) {
    test(`${knot} clears guard_lie_believed`, () => {
        const g = runTerry(knot, NIGHT, []);
        assert.ok(g.guard_lie_believed === false, 'expected a clear tag, got ' + JSON.stringify(g));
    });
}

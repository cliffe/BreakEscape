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
    for (const [k, v] of Object.entries(vars)) story.variablesState[k] = v;
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
    ['lied and was believed', { guard_waved_on: true }, true],
    ['never spoke to him', {}, false],
    ['told him the truth', { guard_waved_on: true, guard_told_safetynet: true }, false],
    ['paid him', { guard_waved_on: true, guard_bribed: true }, false],
    ['waved on, caught later', { guard_waved_on: true, guard_detection_count: 1 }, true],
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

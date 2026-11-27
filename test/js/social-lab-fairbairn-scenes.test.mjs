// Lab Fairbairn: the sign and payoff scenes fire on an engine-resumed hub reopen (lab R4 D1/A6).
//
// The engine resumes a reopened person-chat at the knot that held the last choices, which for
// Fairbairn is `hub`. Before the fix his sign/payoff checks ran only from `start`, so a student
// who spoke to him before signing (the most natural detour) never got the signature scene, its
// Computer Misuse Act line or the condition, and the no-names payoff could be missed entirely.
// The fix runs the checks as a `scenecheck` tunnel at the top of `hub` (Ruth's recheck/keys
// pattern). This drives the compiled fairbairn.json the way the loader does and asserts each
// scene fires exactly once on the reopen that first makes it due, and never again.
//
// Run with: bundle exec node --test test/js/social-lab-fairbairn-scenes.test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const inkPath = join(root, 'scenarios/lab_social_engineering/ink/fairbairn.json');
const vendor = join(root, 'public/break_escape/assets/vendor/ink.js');
const skip = !existsSync(vendor) && 'vendored ink.js not found';
const require = createRequire(import.meta.url);
const inkjs = skip ? null : require(vendor);
const Story = inkjs && (inkjs.Story || inkjs.default?.Story);
const json = skip ? null : readFileSync(inkPath, 'utf8');

// Continue to the next rest point, collecting lines and tags seen on the way.
function drain(story) {
    const lines = [];
    const tags = [];
    while (story.canContinue) {
        const text = story.Continue();
        if (text && text.trim()) lines.push(text.trim());
        for (const t of story.currentTags) tags.push(t);
    }
    return { lines, tags };
}

// A reopen the way person-chat-minigame.js does it: restore the saved state, sync the current
// globals, then ChoosePathString the knot that owns the current choices (hub for Fairbairn).
function reopen(saved, globalsToSet) {
    const s = new Story(json);
    s.state.LoadJson(saved);
    for (const [k, v] of Object.entries(globalsToSet)) {
        if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = v;
    }
    const first = s.currentChoices[0];
    const src = first && (first.sourcePath || (first._sourcePath && first._sourcePath.toString()));
    const knot = src ? src.split('.')[0] : 'hub';
    s.ChoosePathString(knot);
    const out = drain(s);
    return { ...out, saved: s.state.ToJson() };
}

const text = (out) => out.lines.join(' ');

test('Fairbairn plays the sign scene after signing even when first met before signing', { skip }, () => {
    // Fresh open before signing: the intro, then the hub — no sign scene, no condition set.
    const s = new Story(json);
    s.ChoosePathString('start');
    const opening = drain(s);
    assert.ok(!opening.tags.includes('set_global:fairbairn_condition_heard:true'), 'condition not set before signing');
    assert.doesNotMatch(text(opening), /Computer Misuse Act/, 'no sign scene before signing');
    let saved = s.state.ToJson();

    // Reopen after the sheet is signed: the sign scene fires on the hub reopen.
    let r = reopen(saved, { roe_signed: true });
    assert.ok(r.tags.includes('set_global:fairbairn_condition_heard:true'), 'condition set on the hub reopen');
    assert.match(text(r), /Computer Misuse Act/, 'sign scene plays on the reopen');
    assert.match(text(r), /No names in anything I read/, 'the one condition is heard');
    saved = r.saved;

    // Reopen again: the once-flag means the sign scene does not replay.
    r = reopen(saved, { roe_signed: true });
    assert.ok(!r.tags.includes('set_global:fairbairn_condition_heard:true'), 'sign scene not replayed');
    assert.doesNotMatch(text(r), /Computer Misuse Act/, 'no second sign scene');
    saved = r.saved;

    // Reopen after the report is filed: the payoff fires on the hub reopen, once.
    r = reopen(saved, { roe_signed: true, report_filed: true });
    assert.ok(r.tags.includes('set_global:fairbairn_payoff_heard:true'), 'payoff set on the hub reopen');
    assert.match(text(r), /Not one name in it/, 'payoff plays on the reopen');
    saved = r.saved;

    r = reopen(saved, { roe_signed: true, report_filed: true });
    assert.ok(!r.tags.includes('set_global:fairbairn_payoff_heard:true'), 'payoff not replayed');
    assert.doesNotMatch(text(r), /Not one name in it/, 'no second payoff');
});

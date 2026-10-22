// Ruth's stale-after-payoff lines (lab R5 J1 and dialogue review C3 item 5), proven on
// the compiled ruth.json and ruth_phone.json the way the loader drives them.
//  - ruth.ink `keys`: the blue-team hand-over line branches on fairbairn_payoff_heard.
//  - ruth_phone.ink: the "see Gareth" choices disappear once the payoff is heard.
// Run with: bundle exec node --test test/js/social-lab-ruth-payoff-lines.test.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const vendor = join(root, 'public/break_escape/assets/vendor/ink.js');
const skip = !existsSync(vendor) && 'vendored ink.js not found';
const require = createRequire(import.meta.url);
const inkjs = skip ? null : require(vendor);
const Story = inkjs && (inkjs.Story || inkjs.default?.Story);
const load = (p) => readFileSync(join(root, p), 'utf8');

function set(story, globals) {
    for (const [k, v] of Object.entries(globals)) {
        if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
    }
}
function drainText(story) {
    let text = '';
    while (story.canContinue) { story.Continue(); text += story.currentText; }
    return text;
}
const choiceLabels = (story) => story.currentChoices.map((c) => c.text);

test('J1: Ruth\'s blue-team hand-over line is payoff-aware', { skip }, () => {
    const json = load('scenarios/lab_social_engineering/ink/ruth.json');

    // Payoff not yet heard: she still sends the student to Gareth.
    const before = new Story(json);
    set(before, { report_filed: true, fairbairn_payoff_heard: false });
    before.ChoosePathString('hub');
    const t1 = drainText(before);
    assert.match(t1, /give_item:key:blue_team_key|Report's filed/, 'the key still hands over');
    assert.match(t1, /go and see him/, 'unheard payoff: points at Gareth');

    // Payoff already heard: no "go and see him".
    const after = new Story(json);
    set(after, { report_filed: true, fairbairn_payoff_heard: true });
    after.ChoosePathString('hub');
    const t2 = drainText(after);
    assert.doesNotMatch(t2, /go and see him/, 'heard payoff: does not send back to Gareth');
    assert.match(t2, /Gareth's read it/, 'heard payoff: acknowledges he has read it');
});

test('C3 item 4: Fairbairn\'s goodbye after the report points to Tomasz, not "go gently"', { skip }, () => {
    const json = load('scenarios/lab_social_engineering/ink/fairbairn.json');
    const s = new Story(json);
    // Signed, payoff already played, report filed: the hub is idle and the only exit is the goodbye.
    set(s, { roe_signed: true, report_filed: true, met: true, signed_scene: true, said_payoff: true });
    s.ChoosePathString('hub');
    drainText(s);
    const i = choiceLabels(s).findIndex((l) => /I'll leave you to it/.test(l));
    assert.ok(i >= 0, 'the leave choice is offered');
    s.ChooseChoiceIndex(i);
    const t = drainText(s);
    assert.match(t, /Tomasz is through there/, 'report filed: goodbye points onward to Tomasz');
    assert.doesNotMatch(t, /Go gently with them/, 'the pre-report goodbye is not used after the report');
});

test('C3 item 5: Ruth\'s phone drops the "see Gareth" choices once the payoff is heard', { skip }, () => {
    const json = load('scenarios/lab_social_engineering/ink/ruth_phone.json');
    // Stage 7: report filed, defender flip not yet done.
    const stage7 = {
        roe_signed: true, plan_done: true, osint_done: true, se_intel_username_convention: true,
        phish_pierce_landed: true, landing_payroll_login_built: true, pretext_call_done: true,
        phish_lord_landed: true, report_filed: true, triage_pass: false, profile_done: false
    };

    const before = new Story(json);
    set(before, { ...stage7, fairbairn_payoff_heard: false });
    before.ChoosePathString('hub'); drainText(before);
    assert.ok(choiceLabels(before).some((l) => /Has Gareth seen the report\?/.test(l)),
        'unheard payoff: the Gareth choice is offered');

    const after = new Story(json);
    set(after, { ...stage7, fairbairn_payoff_heard: true });
    after.ChoosePathString('hub'); drainText(after);
    assert.ok(!choiceLabels(after).some((l) => /Has Gareth seen the report\?/.test(l)),
        'heard payoff: the Gareth choice is gone');
});

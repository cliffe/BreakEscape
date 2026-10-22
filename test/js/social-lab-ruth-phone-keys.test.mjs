// Lab Ruth phone hub: each stage's opener names the next key to collect from Ruth, so a
// student stuck at a locked door is pointed back to her (fix round F, F17). Also checks the
// stage-4 "Dev flagged that last call" line stops once the call has actually succeeded.
//
// Drives the compiled ruth_phone.json the way phone-chat does: set the globals, then
// ChoosePathString('start'), which routes the hub to the current stage and prints its opener.
//
// Run with: bundle exec node --test test/js/social-lab-ruth-phone-keys.test.mjs

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const inkPath = join(root, 'scenarios/lab_social_engineering/ink/ruth_phone.json');
const vendor = join(root, 'public/break_escape/assets/vendor/ink.js');
const skip = !existsSync(vendor) && 'vendored ink.js not found';
const require = createRequire(import.meta.url);
const inkjs = skip ? null : require(vendor);
const Story = inkjs && (inkjs.Story || inkjs.default?.Story);
const json = skip ? null : readFileSync(inkPath, 'utf8');

// Route the hub with these globals and return the text printed before the choices (the opener).
function opener(globals) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(globals)) {
        if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = v;
    }
    s.ChoosePathString('start');
    let text = '';
    while (s.canContinue) text += s.Continue();
    return text;
}

const base = {
    roe_signed: false, plan_done: false, fairbairn_condition_heard: false, osint_done: false, se_intel_username_convention: false,
    se_intel_email_pattern: false, se_intel_hampshire_cv_backlog: false, phish_hampshire_landed: false,
    phish_pierce_landed: false, acct_freemail: false, landing_payroll_login_built: false,
    pretext_call_done: false, pretext_call_reported: false, se_intel_lord_payslip_date: false,
    phish_lord_landed: false, report_filed: false, triage_pass: false, profile_done: false
};

test('stage 2 (Recon) opener points the student to Ruth for the key, not "you already have it"', { skip }, () => {
    const t = opener({ ...base, roe_signed: true, plan_done: true, fairbairn_condition_heard: true });
    assert.match(t, /key/i, 'names the key');
    assert.match(t, /come and see me|I've got the key/i, 'points back to Ruth');
    assert.doesNotMatch(t, /you've the key already/i, 'does not assume the key is held');
});

test('stage 3 (Operations) opener points the student to Ruth for the key', { skip }, () => {
    const t = opener({ ...base, roe_signed: true, plan_done: true, fairbairn_condition_heard: true, osint_done: true, se_intel_username_convention: true });
    assert.match(t, /key/i);
    assert.match(t, /come and see me|I've got the key/i, 'points back to Ruth');
});

test('stage 7 (Blue Team) opener points to Tomasz and does NOT re-offer the key the student already holds (R6 F3)', { skip }, () => {
    // Stage 7 is only reached once report_filed is true, and Ruth hands the Blue Team key
    // at report_filed, so the key is in the ring by now. The opener must not tell the
    // student to come to Ruth for a key they already have (lab R6 F3).
    const t = opener({ ...base,
        roe_signed: true, plan_done: true, fairbairn_condition_heard: true, osint_done: true, se_intel_username_convention: true,
        phish_hampshire_landed: true, phish_pierce_landed: true, landing_payroll_login_built: true, pretext_call_done: true,
        phish_lord_landed: true, report_filed: true });
    assert.match(t, /Blue Team|Tomasz/i, 'points to the Blue Team room / Tomasz');
    assert.doesNotMatch(t, /come and see me|I've got the key|if that door's locked/i,
        'does not re-offer the key, which was handed at report_filed');
});

test('stage 4: the "Dev flagged" lockout shows while reported with no Dev fact yet, and clears once any fact is in (R11 F1 / M-C3-1)', { skip }, () => {
    // Reported, and no Dev fact held yet: the lockout line shows.
    const stuck = opener({ ...base,
        roe_signed: true, plan_done: true, fairbairn_condition_heard: true, osint_done: true, se_intel_username_convention: true,
        phish_hampshire_landed: true, phish_pierce_landed: true, pretext_call_reported: true, pretext_call_done: false,
        landing_payroll_login_built: false });
    assert.match(stuck, /flagged that last call/i, 'lockout shows while reported with no fact yet');

    // A later call got one fact (the date): "give the desk a minute, then ring back softer" is
    // now stale (they just rang back), so M-C3-1 narrowed the gate to zero-facts and the lockout
    // clears. Stage 4 falls through to the page steer; stage 5 gives the specific missing-fact
    // guidance once the page is built.
    const oneFact = opener({ ...base,
        roe_signed: true, plan_done: true, fairbairn_condition_heard: true, osint_done: true, se_intel_username_convention: true,
        phish_hampshire_landed: true, phish_pierce_landed: true, pretext_call_reported: true, pretext_call_done: true,
        se_intel_lord_payslip_date: true, se_intel_lord_portal_name: false,
        landing_payroll_login_built: false });
    assert.doesNotMatch(oneFact, /flagged that last call/i, 'lockout clears once a Dev fact is in');
    assert.match(oneFact, /Now the page/i, 'falls through to the page steer');

    // Both facts held: lockout still clear.
    const recovered = opener({ ...base,
        roe_signed: true, plan_done: true, fairbairn_condition_heard: true, osint_done: true, se_intel_username_convention: true,
        phish_hampshire_landed: true, phish_pierce_landed: true, pretext_call_reported: true, pretext_call_done: true,
        se_intel_lord_portal_name: true, se_intel_lord_payslip_date: true,
        landing_payroll_login_built: false });
    assert.doesNotMatch(recovered, /flagged that last call/i, 'lockout clears once both Dev facts are held');
});

const allDone = {
    roe_signed: true, plan_done: true, fairbairn_condition_heard: true, osint_done: true, se_intel_username_convention: true,
    phish_hampshire_landed: true, phish_pierce_landed: true, landing_payroll_login_built: true, pretext_call_done: true,
    phish_lord_landed: true, report_filed: true, triage_pass: true, profile_done: true
};

test('once the engagement is closed the phone stops pointing at Tomasz, with a closed line instead (R6 F2)', { skip }, () => {
    // Before the debrief: both halves done but not yet closed — it still sends you to Tomasz.
    const open_ = opener({ ...base, ...allDone });
    assert.match(open_, /let Tomasz close it out/i, 'before the debrief it still points at Tomasz');
    // After Tomasz's debrief sets engagement_closed, the phone no longer points at him.
    const closed = opener({ ...base, ...allDone, engagement_closed: true });
    assert.doesNotMatch(closed, /let Tomasz close it out|That's the lot/i, 'no longer sends you to Tomasz');
    assert.match(closed, /engagement closed/i, 'a closed-engagement line instead');
});

test('stage 7 pointer is printed once, not after every reply (R6 F3)', { skip }, () => {
    const s = new Story(json);
    const g = { ...base,
        roe_signed: true, plan_done: true, fairbairn_condition_heard: true, osint_done: true, se_intel_username_convention: true,
        phish_hampshire_landed: true, phish_pierce_landed: true, landing_payroll_login_built: true, pretext_call_done: true,
        phish_lord_landed: true, report_filed: true };
    for (const [k, v] of Object.entries(g)) {
        if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = v;
    }
    s.ChoosePathString('start');
    let all = '';
    const drain = () => { while (s.canContinue) all += s.Continue(); };
    drain();
    // Ask a few hint questions in a row; the standalone pointer must not reprint each time.
    for (let i = 0; i < 3; i++) {
        const idx = s.currentChoices.findIndex((c) => !/Thanks\./.test(c.text));
        if (idx < 0) break;
        s.ChooseChoiceIndex(idx);
        drain();
    }
    const count = (all.match(/Blue Team room next/g) || []).length;
    assert.equal(count, 1, 'the Blue Team pointer appears exactly once across the thread');
});

test('C4 n4: Melanie landed before Careers keeps the phone on stage 3, with the Careers pointer', { skip }, () => {
    const g = { ...base, roe_signed: true, plan_done: true, fairbairn_condition_heard: true, osint_done: true, se_intel_username_convention: true,
        acct_freemail: true, phish_pierce_landed: true, phish_hampshire_landed: false };
    const s = new Story(json);
    for (const [k, v] of Object.entries(g)) if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = v;
    s.ChoosePathString('start');
    let t = '';
    while (s.canContinue) t += s.Continue();
    // M-C3-2: one easy target has landed, so the "Operations now / if that door's locked" opener
    // is suppressed (the student is well past first entry) in favour of the else-branch steer.
    assert.match(t, /still have to act in Operations/, 'still on stage 3, with the door-opener suppressed');
    assert.ok(s.currentChoices.some((c) => /Chris isn't biting/.test(c.text)), 'the Careers pointer is still offered');
    assert.doesNotMatch(t, /Sofia/, 'no Sofia advice yet');
});

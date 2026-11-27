// D173: sis01 and sis02 debriefs say what the lenient scoring let through.
// sis01 (Priya, root_cause): the SIEM timer ran out (siem_missed_alerts, not siem_escalated).
// sis02 (Priya, the_hall): the dial was read but no verdict given (same condition as the credits line).
// Run with: node test/js/sis-debrief-misses.test.mjs

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
const SIS01 = load('scenarios/sis01_healthcare/ink/npc_sharma.json');
const SIS02 = load('scenarios/sis02_energy/ink/npc_priya_s.json');

function textFrom(json, knot, vars) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    let out = '';
    for (let i = 0; i < 6; i++) {
        while (s.canContinue) out += s.Continue() + '\n';
        if (!s.currentChoices.length) break;
        s.ChooseChoiceIndex(0);
    }
    return out;
}

const SIEM_A = /the clock ran out before anyone escalated them/;
const SIEM_B = /An alert nobody passes on is no alert at all/;
const DIAL_A = /never said whether you believed it/;
const DIAL_B = /That's why the choice mattered/;

test('sis01: the SIEM miss lines play when the triage was missed', () => {
    const t = textFrom(SIS01, 'root_cause', { siem_missed_alerts: true, siem_escalated: false });
    assert.ok(SIEM_A.test(t) === true, 'first line');
    assert.ok(SIEM_B.test(t) === true, 'second line');
});

test('sis01: no SIEM miss lines when the alerts were escalated, or the console never opened', () => {
    const ok = textFrom(SIS01, 'root_cause', { siem_missed_alerts: false, siem_escalated: true });
    assert.ok(SIEM_A.test(ok) === false && SIEM_B.test(ok) === false, 'escalated');
    const never = textFrom(SIS01, 'root_cause', { siem_missed_alerts: false, siem_escalated: false });
    assert.ok(SIEM_A.test(never) === false && SIEM_B.test(never) === false, 'never opened');
    const both = textFrom(SIS01, 'root_cause', { siem_missed_alerts: true, siem_escalated: true });
    assert.ok(SIEM_A.test(both) === false, 'escalated wins');
});

test('sis02: the dial lines play when the dial was read and no verdict given', () => {
    const t = textFrom(SIS02, 'the_hall', { anomaly_detected: true, gauge_verdict: '', esd_before_dial: false });
    assert.ok(DIAL_A.test(t) === true, 'first line');
    assert.ok(DIAL_B.test(t) === true, 'second line');
});

test('sis02: no dial lines with a verdict, no dial reading, or an ESD before the dial', () => {
    for (const vars of [
        { anomaly_detected: true, gauge_verdict: 'dial' },
        { anomaly_detected: true, gauge_verdict: 'screen' },
        { anomaly_detected: false, gauge_verdict: '' },
        { anomaly_detected: true, gauge_verdict: '', esd_before_dial: true },
    ]) {
        const t = textFrom(SIS02, 'the_hall', vars);
        assert.ok(DIAL_A.test(t) === false && DIAL_B.test(t) === false, JSON.stringify(vars));
    }
});

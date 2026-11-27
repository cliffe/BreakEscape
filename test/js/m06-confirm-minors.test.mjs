// m06 confirm minors: Dani's optional task stays reachable, hub siblings stay on the hub,
// and HaX's fund call closes the freeze/watch choice once the fund is decided.
// Run with: node test/js/m06-confirm-minors.test.mjs

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
const dir = join(root, 'scenarios/m06_follow_the_money/ink');
const load = (n) => readFileSync(join(dir, n), 'utf8').replace(/^﻿/, '');

// Drive a story: run to the next choice point, collecting text and tags.
function runTo(s) {
    let text = '';
    const tags = [];
    while (s.canContinue) { text += s.Continue(); tags.push(...(s.currentTags || [])); }
    return { text, tags };
}
function pick(s, re) {
    const i = s.currentChoices.findIndex((c) => re.test(c.text));
    assert.ok(i >= 0, 'choice present: ' + re + ' in [' + s.currentChoices.map((c) => c.text).join(' | ') + ']');
    s.ChooseChoiceIndex(i);
    return runTo(s);
}
const has = (s, re) => s.currentChoices.some((c) => re.test(c.text));

function dani() {
    const s = new Story(load('m06_npc_trader.json'));
    s.ChoosePathString('start');
    runTo(s);
    return s;
}

test('trader: Monero then mixing leaves the launder question on the hub, and it completes the task', () => {
    const s = dani();
    pick(s, /standard audit/);
    pick(s, /Monero/);
    pick(s, /How does the mixing work/);
    assert.ok(has(s, /Is this place being used to launder/), 'launder option kept on the hub');
    pick(s, /Is this place being used to launder/);
    pick(s, /noticed something/);
    assert.ok(s.variablesState['trader_flagged'] === true, 'flag set');
    assert.ok(!has(s, /Is this place being used to launder/), 'gone once taken through');
});

test('trader: the complete_task tag fires on the flagged-wallets knot', () => {
    const s = dani();
    pick(s, /standard audit/);
    pick(s, /Monero/);
    pick(s, /launder/);
    const r = pick(s, /noticed something/);
    assert.ok(r.tags.some((t) => /complete_task:question_the_trader/.test(t)), 'task tag emitted');
});

test('trader: "Fair enough" does not lose the branch', () => {
    const s = dani();
    pick(s, /standard audit/);
    pick(s, /Monero/);
    pick(s, /launder/);
    pick(s, /Fair enough/);
    assert.ok(has(s, /Is this place being used to launder/), 'still offered after Fair enough');
});

test('trader: the privacy-coin route does not hide the Monero question', () => {
    const s = dani();
    pick(s, /What does this place actually do/);
    pick(s, /privacy coins/);
    pick(s, /religion/);
    assert.ok(has(s, /Why is so much of this in Monero/), 'Monero question still on the hub');
    assert.ok(has(s, /Privacy also hides crime/), 'untaken sibling kept');
    assert.ok(!has(s, /religion/), 'taken sibling gone');
});

test('analyst: forensics and pattern siblings stay on the hub', () => {
    const s2 = new Story(load('m06_npc_analyst.json'));
    s2.ChoosePathString('start');
    runTo(s2);
    pick(s2, /What transactions/);
    pick(s2, /Show me/);
    pick(s2, /reported this/);
    assert.ok(has(s2, /forensics side/), 'hub reached');
    pick(s2, /forensics side/);
    pick(s2, /Monero/);
    pick(s2, /logs can see/);
    assert.ok(has(s2, /What patterns indicate illegal activity/), 'untaken forensics sibling kept');
    assert.ok(!has(s2, /Can you trace privacy coins/), 'taken forensics sibling gone');
    pick(s2, /Has anything in the flow/);
    pick(s2, /What do you think it means/);
    assert.ok(has(s2, /Can you identify the source wallets/), 'untaken pattern sibling kept');
});

test('HaX fund call: freeze or watch is closed once the fund is decided', () => {
    const open = new Story(load('m06_phone_agent_0x99.json'));
    open.ChoosePathString('on_architects_fund_discovered');
    let t = runTo(open).text;
    assert.ok(/still in the wallet/.test(t), 'undecided: the pending line plays');
    t += pick(open, /advances already went/).text;
    assert.ok(/Which leaves you a choice/.test(t), 'undecided: the choice is offered');

    const done = new Story(load('m06_phone_agent_0x99.json'));
    done.variablesState['assets_decided'] = true;
    done.ChoosePathString('on_architects_fund_discovered');
    let d = runTo(done).text;
    assert.ok(!/still in the wallet/.test(d), 'decided: no pending line');
    d += pick(done, /advances already went/).text;
    assert.ok(!/Which leaves you a choice|Freeze it|Or watch it/.test(d), 'decided: no freeze or watch offer');
    assert.ok(!/only touches what hasn/.test(d), 'decided: no open-decision line');
    assert.ok(done.currentChoices.length === 0, 'decided: no choices left');
});

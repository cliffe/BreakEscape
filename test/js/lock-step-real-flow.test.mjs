// A lock's second step, from the pad to the open, on the real client (ops layer S8c unit 27).
//
// Nothing here stands in for a game module on the lock path: the real unlock-system.js,
// minigame-starters.js, the PIN pad on the real base scene, ApiClient.unlock, lock-step.js, the pane
// with the push part inside it, mfa-client.js, the wiring and the state sync run together in jsdom.
// Only the network is stubbed, and every server answer is read from the shared fixture
// (test/fixtures/files/lock_step/answers.json). The object is built from the room payload the real
// server sent (test/js/fixtures/lock_step_room_payloads.json).
// Run with: bin/test-js test/js/lock-step-real-flow.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAnswer } from './helpers/lock-step-answers.mjs';
import { buildStack, makeNetwork, settle, quickTimers, bootPage, payloads, deep } from './helpers/lock-step-real-stack.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const S = await buildStack();
const net = makeNetwork();
quickTimers();

const roomObject = (id) => deep(payloads.startRoom.objects.find((o) => o.id === id));
const npcItem = (npc, id) => deep(payloads.startRoom.npcs.find((n) => n.id === npc).itemsHeld.find((i) => i.id === id));
const phoneOf = (id, owner) => ({ scenarioData: { id, type: 'phone_friendface', owner, name: `${owner}'s phone` } });
const sprite = (id) => ({ scenarioData: roomObject(id), objectId: id, layer: 'L' });
const layer = () => document.querySelector('.lock-step-layer');
const pad = () => window.MinigameFramework.currentMinigame;
const PIN = '4821';
// The fixture's code gate is for moira_locker; the safe is Priya's, so the same answer names her
const gateForPriya = { name: 'gate_code', patch: (b) => { b.targetId = 'priya_safe'; b.npcId = 'priya'; } };
async function typePin(code = PIN) {
    for (const d of code) pad().handleNumberInput(d);
    await settle(10);
}
const paneState = () => window.__test.lockStep.state();
const labels = () => paneState().controls.map((c) => c.label);
const noPaneText = (log) => log.toasts.map((t) => t[0]);

// The two answers a fresh gate needs before the pad's own answer comes back
function pushRoutes({ prompt = ['prompt_passed'], after = ['open_object'] } = {}) {
    return { '/unlock': ['gate_push', ...after], '/mfa/prompt': prompt };
}

test('a gated PIN locker: the pad posts, the pane opens over it, the owner approves, the pad gets ONE ordinary success', async () => {
    const log = bootPage(S);
    net.reset(pushRoutes());
    const locker = sprite('moira_locker');
    window.handleUnlock(locker, 'item');
    await settle();
    assert.equal(pad().constructor.name, 'PinMinigame', 'the real pad is up');
    await typePin();
    await settle(20);
    // the pad posted, the gate answered, the request went out when the pane mounted, the pass reposted the same body
    const unlocks = net.posted('/unlock');
    assert.equal(unlocks.length, 2);
    // interactions.js sends every object lock through handleUnlock(sprite, 'item'), so the pad posts targetType "item"
    assert.deepEqual(unlocks[0].body, { targetType: 'item', targetId: 'moira_locker', attempt: PIN, method: 'pin' });
    assert.deepEqual(unlocks[1].body, unlocks[0].body);
    assert.deepEqual(net.posted('/mfa/prompt').map((p) => p.body), [{ target_type: 'object', target_id: 'moira_locker' }]);
    assert.equal(layer(), null, 'the pane closed');
    // the pad completed once, as a plain success, and the object opened once
    assert.equal(window.MinigameFramework.ended.length, 1);
    assert.equal(window.MinigameFramework.ended[0].success, true);
    assert.equal(locker.scenarioData.locked, false);
    assert.deepEqual(locker.scenarioData.contents, loadAnswer('open_object').body.contents);
    assert.equal(log.events.filter(([n]) => n === 'item_unlocked').length, 1);
    assert.equal(noPaneText(log).filter((t) => /Correct PIN/.test(t)).length, 1);
    assert.equal(noPaneText(log).some((t) => t === 'Not approved.'), false);
    // the lock's approval named its owner
    assert.ok(log.mfaEvents.some((e) => e.name === 'mfa_approved:moira' && e.detail.targetId === 'moira_locker'));
});

test('the pane shows what the code says it shows (push, nobody holds the phone)', async () => {
    bootPage(S);
    net.reset({ '/unlock': ['gate_push'], '/mfa/prompt': ['prompt_waiting'] });
    window.handleUnlock(sprite('moira_locker'), 'item');
    await settle();
    await typePin();
    await settle(20);
    const st = paneState();
    assert.equal(st.open, true);
    assert.equal(st.kind, 'push');
    assert.equal(st.title, 'Staff locker', 'the lock is named by its scenario name');
    assert.match(st.text, /A request was sent to moira's phone\./, 'the owner is named by id when no NPC record is loaded');
    assert.match(st.text, /Requests sent: 1/);
    assert.deepEqual(labels(), ['X', 'Send again']);
    assert.equal(st.controls[1].disabled, true, 'Send again waits for the gap');
    // the pad stays beneath, unanswered
    assert.equal(window.MinigameFramework.ended.length, 0);
});

for (const waiting of ['owner', 'held_phone']) {
    test(`prompt_waiting with waiting "${waiting}" is a waiting push, not an error; the held phone's Approve passes`, async () => {
        const log = bootPage(S, { inventory: { items: [phoneOf('moira_phone', 'moira')] } });
        net.reset({
            '/unlock': ['gate_push', 'open_object'],
            '/mfa/prompt': [{ name: 'prompt_waiting', patch: (b) => { b.waiting = waiting; } }],
            '/mfa/phone': ['phone_one_request'],
            '/mfa/approve': ['approve_passed']
        });
        const locker = sprite('moira_locker');
        window.handleUnlock(locker, 'item');
        await settle();
        await typePin();
        await settle(20);
        let st = paneState();
        assert.equal(st.open, true);
        assert.equal(/That did not work/.test(st.text), false, 'no error line');
        assert.deepEqual(labels(), ['X', 'Send again', "Check moira's phone"]);
        window.__test.lockStep.click("Check moira's phone");
        await settle(10);
        st = paneState();
        assert.deepEqual(labels(), ['X', 'Send again', "Check moira's phone", 'Approve', 'Deny']);
        assert.match(st.text, /Moira's locker/, 'the card carries the name the phone sent');
        window.__test.lockStep.click('Approve');
        await settle(20);
        assert.equal(layer(), null);
        assert.equal(net.posted('/unlock').length, 2);
        assert.equal(window.MinigameFramework.ended.length, 1);
        assert.equal(locker.scenarioData.locked, false);
        assert.equal(log.toasts.some((t) => t[0] === 'Not approved.'), false);
    });
}

test('a denial: Deny closes the pane, the pad takes no attempt and no "PIN Rejected", "Not approved." once, reject tone once, nothing reposted', async () => {
    const log = bootPage(S, { inventory: { items: [phoneOf('moira_phone', 'moira')] } });
    net.reset({ '/unlock': ['gate_push'], '/mfa/prompt': ['prompt_waiting'], '/mfa/phone': ['phone_one_request'], '/mfa/approve': ['approve_cancelled'] });
    const locker = sprite('moira_locker');
    window.handleUnlock(locker, 'item');
    await settle();
    await typePin();
    await settle(20);
    const p = pad();
    window.__test.lockStep.click("Check moira's phone");
    await settle(10);
    log.sounds.length = 0;
    window.__test.lockStep.click('Deny');
    await settle(20);
    assert.equal(layer(), null);
    assert.equal(net.posted('/unlock').length, 1, 'no second post');
    assert.equal(log.toasts.filter((t) => t[0] === 'Not approved.').length, 1);
    assert.equal(log.sounds.filter((s) => s === 'reject').length, 1, 'one reject tone (the pad adds none: a cancel is no wrong PIN)');
    assert.equal(log.toasts.some((t) => /PIN Rejected|Incorrect PIN|Correct PIN/.test(String(t[0]) + String(t[2]))), false);
    assert.equal(p.attemptCount, 0, 'the first factor was right: no attempt is spent on a cancel');
    assert.equal(locker.scenarioData.locked, true);
    // the pad closes itself after its message, as a cancel
    await settle(20);
    assert.equal(window.MinigameFramework.ended.length, 1);
    assert.equal(window.MinigameFramework.ended[0].success, false);
    assert.equal(window.MinigameFramework.ended[0].result.cancelled, true);
    assert.equal(log.events.some(([n]) => n === 'item_unlocked'), false);
});

test('the player closing the pane with X is silent: no toast, no tone, no repost, pad closes as a cancel', async () => {
    const log = bootPage(S);
    net.reset({ '/unlock': ['gate_push'], '/mfa/prompt': ['prompt_waiting'] });
    const locker = sprite('moira_locker');
    window.handleUnlock(locker, 'item');
    await settle();
    await typePin();
    await settle(20);
    log.sounds.length = 0;
    window.__test.lockStep.close();
    await settle(20);
    assert.equal(layer(), null);
    assert.deepEqual(log.toasts.map((t) => t[0]).filter((t) => /approved/i.test(t)), []);
    assert.equal(log.sounds.includes('reject'), false);
    assert.equal(net.posted('/unlock').length, 1);
    assert.equal(window.MinigameFramework.ended[0].result.cancelled, true);
    assert.equal(locker.scenarioData.locked, true);
});

test('a code lock: the pane takes six digits (Enter verifies), then the same body is posted again and the pad completes once', async () => {
    const log = bootPage(S);
    net.reset({ '/unlock': [gateForPriya, 'open_object'], '/mfa/verify': ['verify_passed'] });
    const safe = sprite('priya_safe');
    window.handleUnlock(safe, 'item');
    await settle();
    await typePin();
    await settle(10);
    let st = paneState();
    assert.equal(st.kind, 'code');
    assert.equal(st.title, safe.scenarioData.name);
    assert.deepEqual(st.lines.slice(0, 1), ["Enter the code from priya's device."]);
    assert.deepEqual(labels(), ['X', 'Verify']);
    await window.__test.lockStep.type('123456', { enter: true });
    await settle(20);
    assert.deepEqual(net.posted('/mfa/verify').map((v) => v.body), [{ target_type: 'object', target_id: 'priya_safe', code: '123456' }]);
    assert.equal(net.posted('/unlock').length, 2);
    assert.equal(window.MinigameFramework.ended.length, 1);
    assert.equal(window.MinigameFramework.ended[0].success, true);
    assert.equal(log.toasts.some((t) => t[0] === 'Not approved.'), false);
});

test('a wrong code keeps the pane open with "Incorrect code" and costs the pad nothing', async () => {
    const log = bootPage(S);
    net.reset({ '/unlock': [gateForPriya], '/mfa/verify': ['verify_wrong'] });
    window.handleUnlock(sprite('priya_safe'), 'item');
    await settle();
    await typePin();
    await settle(10);
    await window.__test.lockStep.type('000000', { enter: true });
    await settle(10);
    const st = paneState();
    assert.equal(st.open, true);
    assert.ok(st.lines.includes('Incorrect code'));
    assert.equal(pad().attemptCount, 1, 'the PIN attempt stands; the code adds none');
    assert.equal(net.posted('/unlock').length, 1);
    assert.equal(log.toasts.some((t) => t[0] === 'Not approved.'), false);
});

// ---- the shapes the real gate sends (unit 13 and 15), read by the pane and the push part -------
async function openNumberLock(log, routes) {
    net.reset({ '/unlock': ['gate_number'], '/mfa/prompt': ['prompt_waiting'], ...routes });
    const safe = sprite('priya_safe');
    window.handleUnlock(safe, 'item');
    await settle();
    await typePin();
    await settle(20);
    return safe;
}

test('a number match: the number shows, and the phone card lists the numbers as the server sorted them (n is 0 before any prompt)', async () => {
    const log = bootPage(S, { inventory: { items: [phoneOf('priya_phone', 'priya')] } });
    const gateNumber = loadAnswer('gate_number').body.number;
    const safe = await openNumberLock(log, {
        '/mfa/phone': [{ name: 'phone_number_request', patch: (b) => { b.requests[0].n = 0; b.requests[0].numbers = [gateNumber, 31, 82].sort((a, c) => a - c); } }],
        '/mfa/approve': ['approve_passed'],
        '/unlock': ['gate_number', 'open_object']
    });
    assert.match(paneState().text, new RegExp(`Number: ${gateNumber}`));
    window.__test.lockStep.click("Check priya's phone");
    await settle(10);
    const st = paneState();
    const numberButtons = st.controls.map((c) => c.label).filter((l) => /^\d+$/.test(l));
    assert.deepEqual(numberButtons, [gateNumber, 31, 82].sort((a, c) => a - c).map(String), 'ascending, as sent');
    assert.ok(st.controls.some((c) => c.label === 'Deny'));
    assert.equal(st.controls.some((c) => c.label === 'Approve'), false, 'a number match has no plain Approve');
    window.__test.lockStep.click(String(gateNumber));
    await settle(20);
    assert.deepEqual(net.posted('/mfa/approve').map((a) => a.body), [{ target_type: 'object', target_id: 'priya_safe', number: gateNumber }]);
    assert.equal(layer(), null);
    assert.equal(safe.scenarioData.locked, false);
});

test('a phone request with no numbers and n 0 still draws (a plain push card)', async () => {
    const log = bootPage(S, { inventory: { items: [phoneOf('moira_phone', 'moira')] } });
    net.reset({ '/unlock': ['gate_push'], '/mfa/prompt': ['prompt_waiting'], '/mfa/phone': [{ name: 'phone_one_request', patch: (b) => { b.requests[0].n = 0; } }] });
    window.handleUnlock(sprite('moira_locker'), 'item');
    await settle();
    await typePin();
    await settle(20);
    window.__test.lockStep.click("Check moira's phone");
    await settle(10);
    assert.deepEqual(labels().slice(-2), ['Approve', 'Deny']);
});

for (const [where, routes, ready] of [
    ['a prompt', { '/mfa/prompt': ['prompt_expired'] }, null],
    ['an approve (the live record is gone, or already passed)', { '/mfa/prompt': ['prompt_waiting'], '/mfa/phone': ['phone_one_request'], '/mfa/approve': ['approve_expired'] }, 'approve']
]) {
    test(`expired: ${where} answered 422 {expired:true} closes the pane and the pad hears one cancel with "Not approved."`, async () => {
        const log = bootPage(S, { inventory: { items: [phoneOf('moira_phone', 'moira')] } });
        net.reset({ '/unlock': ['gate_push'], ...routes });
        const locker = sprite('moira_locker');
        window.handleUnlock(locker, 'item');
        await settle();
        await typePin();
        await settle(20);
        if (ready === 'approve') {
            window.__test.lockStep.click("Check moira's phone");
            await settle(10);
            window.__test.lockStep.click('Approve');
            await settle(20);
        }
        assert.equal(layer(), null, 'the pane does not stay open on a step that has ended');
        assert.equal(log.toasts.filter((t) => t[0] === 'Not approved.').length, 1);
        assert.equal(net.posted('/unlock').length, 1);
        assert.equal(locker.scenarioData.locked, true);
    });
}

test('expired: a code verified after the record is gone (verify_dropped) closes the pane with "Not approved."', async () => {
    const log = bootPage(S);
    net.reset({ '/unlock': [{ name: 'gate_code', patch: (b) => { b.targetId = 'priya_safe'; b.npcId = 'priya'; } }], '/mfa/verify': ['verify_dropped'] });
    window.handleUnlock(sprite('priya_safe'), 'item');
    await settle();
    await typePin();
    await settle(10);
    await window.__test.lockStep.type('123456', { enter: true });
    await settle(20);
    assert.equal(layer(), null);
    assert.equal(log.toasts.filter((t) => t[0] === 'Not approved.').length, 1);
});

test('the server\'s generic refusal on a first request leaves the pane open with "That did not work", no "was sent", and none of the server wording', async () => {
    const log = bootPage(S);
    net.reset({ '/unlock': ['gate_push'], '/mfa/prompt': ['generic_refusal'] });
    window.handleUnlock(sprite('moira_locker'), 'item');
    await settle();
    await typePin();
    await settle(20);
    const st = paneState();
    assert.equal(st.open, true);
    assert.match(st.text, /That did not work\. Try again\./);
    assert.equal(/was sent/.test(st.text), false);
    assert.equal(/Requests sent/.test(st.text), false);
    const shown = JSON.stringify(log.toasts) + document.body.textContent;
    assert.equal(/Incorrect username or password/.test(shown), false);
});

test('a prompt that comes back too soon holds Send again and says so, and does not end the step', async () => {
    const log = bootPage(S);
    net.reset({ '/unlock': ['gate_push'], '/mfa/prompt': ['prompt_too_soon'] });
    window.handleUnlock(sprite('moira_locker'), 'item');
    await settle();
    await typePin();
    await settle(20);
    const st = paneState();
    assert.equal(st.open, true);
    assert.match(st.text, /Wait a moment before sending another request\./);
});

// S8c playtest: "Send again" is greyed after a request and works again when the server's gap is over
test('Send again is greyed right after a request and enabled when the wait timer fires', async () => {
    const log = bootPage(S);
    net.reset({ '/unlock': ['gate_push'], '/mfa/prompt': ['prompt_waiting'] });
    window.handleUnlock(sprite('moira_locker'), 'item');
    await settle();
    await typePin();
    await settle(20);
    const again = () => paneState().controls.find((c) => c.label === 'Send again');
    assert.ok(again(), 'the pane has Send again');
    assert.equal(again().disabled, true, 'greyed while the gap runs');
    const waits = log.timers.filter((t) => t.ms === 2000);
    assert.ok(waits.length >= 1, 'a two second timer holds it');
    waits[waits.length - 1].fn();
    assert.equal(again().disabled, false, 'works again after the gap');
});

// S8c: the open answer of a gated lock names its lock (targetType, targetId); the client reads past both
test('an open answer that carries targetType and targetId opens the object as before, and the keys are not applied to it', async () => {
    assert.equal(loadAnswer('open_object').body.targetType, 'object', 'the fixture carries the keys');
    assert.equal(loadAnswer('open_door').body.targetId, 'records_room');
    bootPage(S);
    net.reset(pushRoutes());
    const locker = sprite('moira_locker');
    window.handleUnlock(locker, 'item');
    await settle();
    await typePin();
    await settle(20);
    assert.equal(locker.scenarioData.locked, false);
    assert.equal('targetId' in locker.scenarioData, false);
    assert.equal('targetType' in locker.scenarioData, false);
});

// shell-x-check open wait: pure condition logic, the decision function and the wait loop with a fake
// clock and sampler (the in-page sampler is proven live by the full run).
import assert from 'node:assert/strict';
import { unmetConditions, openTimeoutMessage, openOutcome, waitForOpen, OPEN_TIMEOUT_MS, HIT_TIMEOUT_MS } from '../../tools/playtest/shell-x-check.mjs';

const ready = { shell: true, visible: true, stable: true, xStable: true, noX: false, hitOk: true, hitHtml: '<button>' };
assert.ok(unmetConditions(ready).length === 0, 'a visible, stable shell with the X on top is ready');
assert.ok(unmetConditions({ shell: false }).length === 1, 'no shell is unmet');
assert.ok(/does not exist/.test(unmetConditions(null)[0]), 'null sample means no shell');
const covered = { ...ready, hitOk: false, hitHtml: '<div id="game-container"></div>' };
assert.ok(/X centre/.test(unmetConditions(covered).join()), 'game-container under the X is unmet');
assert.ok(/shell rect/.test(unmetConditions({ ...ready, stable: false }).join()), 'moving shell is named as the shell');
assert.ok(/X rect/.test(unmetConditions({ ...ready, xStable: false }).join()) && !/shell rect/.test(unmetConditions({ ...ready, xStable: false }).join()), 'moving X is named as the X, not the shell');
assert.ok(unmetConditions({ ...ready, visible: false }).length === 1, 'hidden shell is unmet');
assert.ok(unmetConditions({ ...ready, noX: true, hitOk: false }).length === 0, 'a shell with no X skips the hit test');
const msg = openTimeoutMessage('bluetooth-scanner', covered, unmetConditions(covered), 'boom');
assert.ok(msg.includes('bluetooth-scanner') && msg.includes('X centre') && msg.includes('id="game-container"') && msg.includes('open threw: boom'), 'message names the scene, the condition, the outerHTML and the error');
assert.ok(OPEN_TIMEOUT_MS === 5000 && HIT_TIMEOUT_MS === 1500 && HIT_TIMEOUT_MS < OPEN_TIMEOUT_MS, 'hit wait is shorter than the shell wait');

// openOutcome: pure decision
const none = { hardExpired: false, hitExpired: false };
assert.ok(openOutcome('s', ready, null, none).kind === 'ready', 'ready sample is ready');
assert.ok(openOutcome('s', { ...ready, noX: true, hitOk: false }, null, none).kind === 'ready', 'no-X shell is ready');
assert.ok(openOutcome('s', covered, null, none).kind === 'wait', 'covered keeps waiting before the hit deadline');
assert.ok(openOutcome('s', covered, null, { hardExpired: true, hitExpired: true }).kind === 'report', 'only the hit test unmet at its deadline hands over to xReport');
assert.ok(openOutcome('s', { ...ready, stable: false }, null, { hardExpired: true, hitExpired: true }).kind === 'fail', 'unstable at the deadline fails');
assert.ok(openOutcome('s', { shell: false }, null, { hardExpired: true, hitExpired: true }).kind === 'fail', 'no shell and no error fails');
assert.ok(openOutcome('s', { shell: false }, 'bad', none).kind === 'notOpen', 'no shell with an error is notOpen at once');
const thrown = openOutcome('s', ready, 'ctor threw', none);
assert.ok(thrown.kind === 'fail' && thrown.message.includes('ctor threw'), 'an error with a shell left behind fails and names the error');

// waitForOpen with a fake clock: each sample costs 20 ms, each sleep advances the clock
function harness(sampleAt, openError = null) {
    let t = 0, samples = 0;
    const run = waitForOpen({
        scene: 's', openError,
        sampleFn: async () => { samples++; t += 20; return sampleAt(t); },
        now: () => t, sleep: async (ms) => { t += ms; }
    });
    return run.then(o => ({ ...o, t, samples }));
}
const permanent = await harness(() => covered);
assert.ok(permanent.kind === 'report', 'permanent cover ends in the xReport hand-over, which the caller counts as a failure');
assert.ok(permanent.t >= HIT_TIMEOUT_MS && permanent.t < HIT_TIMEOUT_MS + 200, 'permanent cover costs about the hit window, not the full 5 s');
assert.ok(permanent.message.includes('id="game-container"'), 'the hand-over carries the covering element');
const transient = await harness((t) => (t < 600 ? covered : ready));
assert.ok(transient.kind === 'ready', 'cover that clears inside the hit window passes');
const slowCover = await harness((t) => (t < 2500 ? covered : ready));
assert.ok(slowCover.kind === 'report', 'cover that outlasts the hit window is not waited out');
const lateShell = await harness((t) => (t < 4000 ? { shell: false } : ready));
assert.ok(lateShell.kind === 'ready', 'a shell that appears inside the 5 s wait passes');
const hitClock = await harness((t) => (t < 4000 ? { shell: false } : covered));
assert.ok(hitClock.kind === 'report' && hitClock.t >= 4000 + HIT_TIMEOUT_MS, 'the hit window starts once the shell is steady');
const never = await harness(() => ({ shell: false }));
assert.ok(never.kind === 'fail' && never.t >= OPEN_TIMEOUT_MS, 'no shell and no error fails after the full wait');
const notOpen = await harness(() => ({ shell: false }), 'unknown scene');
assert.ok(notOpen.kind === 'notOpen' && notOpen.samples === 1, 'no shell with an error is notOpen on the first sample');
const moving = await harness(() => ({ ...ready, xStable: false }));
assert.ok(moving.kind === 'fail' && /X rect/.test(moving.message), 'an X that never settles fails with the X message');
console.log('playtest-shellx-open-wait ok');

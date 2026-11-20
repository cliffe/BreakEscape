// shell-x-check open wait: pure condition logic, the decision function and the wait loop with a fake
// clock and sampler (the in-page sampler is proven live by the full run).
import assert from 'node:assert/strict';
import { unmetConditions, openTimeoutMessage, openOutcome, waitForOpen, OPEN_TIMEOUT_MS, HIT_TIMEOUT_MS, SETTLE_MS, MIN_AFTER_OPEN_MS, withTimeout, makeMissingGuard, tally, MISSING_LIMIT, isMissingCase, timedEval } from '../../tools/playtest/shell-x-check.mjs';

const ready = { shell: true, visible: true, stable: true, xStable: true, rects: 'same', noX: false, hitOk: true, hitHtml: '<button>' };
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
const none = { hardExpired: false, hitExpired: false, settled: true };
assert.ok(openOutcome('s', ready, null, none).kind === 'ready', 'ready sample is ready');
assert.ok(openOutcome('s', { ...ready, noX: true, hitOk: false }, null, none).kind === 'ready', 'no-X shell is ready');
assert.ok(openOutcome('s', covered, null, none).kind === 'wait', 'covered keeps waiting before the hit deadline');
assert.ok(openOutcome('s', covered, null, { hardExpired: true, hitExpired: true, settled: true }).kind === 'report', 'only the hit test unmet at its deadline hands over to xReport');
assert.ok(openOutcome('s', { ...ready, stable: false }, null, { hardExpired: true, hitExpired: true, settled: true }).kind === 'fail', 'unstable at the deadline fails');
assert.ok(openOutcome('s', { shell: false }, null, { hardExpired: true, hitExpired: true, settled: true }).kind === 'fail', 'no shell and no error fails');
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
const transient = await harness((t) => (t < 1000 ? covered : ready));
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


// m5: settle floor. Ready only once the rects held 400 ms and 600 ms passed since open.
assert.ok(SETTLE_MS === 400 && MIN_AFTER_OPEN_MS === 600, 'settle constants');
assert.ok(openOutcome('s', ready, null, { ...none, settled: false }).kind === 'wait', 'ready but not settled waits');
assert.ok(openOutcome('s', ready, null, { hardExpired: true, hitExpired: false, settled: false }).kind === 'fail', 'never settled by the deadline fails');
const quick = await harness(() => ready);
assert.ok(quick.kind === 'ready' && quick.t >= MIN_AFTER_OPEN_MS && quick.t < MIN_AFTER_OPEN_MS + 150, 'a steady shell is measured at about 600 ms, not at the first sample');
const shifting = await harness((t) => ({ ...ready, rects: t < 1000 ? `x${t}` : 'final' }));
assert.ok(shifting.kind === 'ready' && shifting.t >= 1000 + SETTLE_MS, 'rects that keep changing restart the 400 ms still window');
const lateShift = await harness((t) => ({ ...ready, rects: t < 500 ? 'a' : 'b' }));
assert.ok(lateShift.kind === 'ready' && lateShift.t >= 500 + SETTLE_MS, 'a shift at 500 ms (late content) is waited out, then measured');
const jitter = await harness((t) => ({ ...ready, rects: `r${t}` }));
assert.ok(jitter.kind === 'fail' && jitter.t >= OPEN_TIMEOUT_MS, 'rects that never hold still fail at the deadline');

// m2: tally. Counting of the main loop.
const okReport = { open: true, results: [{ issues: [] }, { issues: [], scrollsY: true }] };
const badReport = { open: true, results: [{ issues: ['too low'], label: 'top' }, { issues: [] }] };
const T = (o, r, i) => tally(o, r, i);
assert.deepEqual(T({ ready: true }, okReport), { checked: 1, fail: false, text: 'ok (shell scrolls y)' }, 'clean case is checked and not failed');
assert.ok(T({ ready: true }, badReport, ['top: too low']).fail === true, 'xReport issues fail');
assert.ok(T({ ready: false, message: 'm' }, null).fail && T({ ready: false, message: 'm' }, null).checked === 1, 'open wait failure counts');
const hOnly = T({ ready: false, hitOnly: true, message: 'cover' }, okReport);
assert.ok(hOnly.fail && hOnly.checked === 1 && /cover/.test(hOnly.text), 'hit-only hand-over with no xReport issues is a counted failure (removing fails++ breaks this)');
assert.ok(T({ ready: false, hitOnly: true, message: 'cover' }, badReport, ['top: too low']).fail, 'hit-only with issues fails');
// m3
const gone = T({ ready: false, hitOnly: true, message: 'cover' }, { open: false });
assert.ok(gone.fail && gone.checked === 1 && /shell gone/.test(gone.text), 'hit-only then no shell is a failure');
const noX = T({ ready: false, hitOnly: true, message: 'cover' }, { open: true, noX: true });
assert.ok(noX.fail && /X hidden/.test(noX.text), 'hit-only then no X is a failure');
assert.ok(!T({ ready: true }, { open: true, noX: true }).fail && T({ ready: true }, { open: true, noX: true }).checked === 0, 'plain no-X scene still passes uncounted');
assert.ok(!T({ ready: false, notOpen: true }, { open: false }).fail, 'notOpen is not a failure');

// m4: per-sample timeout and the missing-shell guard
const hung = await withTimeout(new Promise(() => {}), 30, 'fallback');
assert.ok(hung === 'fallback', 'a sample that never answers resolves to the fallback');
assert.ok(await withTimeout(Promise.resolve('v'), 1000, 'fallback') === 'v', 'a prompt sample is returned as is');
assert.ok(/did not answer/.test(unmetConditions({ shell: false, sampleTimeout: true })[0]), 'a sample timeout is named');
const g = makeMissingGuard(MISSING_LIMIT);
let tripped = false; for (let i = 0; i < MISSING_LIMIT - 1; i++) tripped = g(true);
assert.ok(!tripped, 'one short of the limit does not trip');
assert.ok(g(true) === true, 'the tenth consecutive miss trips');
const g2 = makeMissingGuard(3); g2(true); g2(true); g2(false);
assert.ok(g2(true) === false, 'a case with a shell resets the run');
assert.ok(MISSING_LIMIT === 10, 'limit is 10');

// R3 m1: a ready case whose xReport finds no shell, or no X where the sample had one, is a failure
const lostShell = T({ ready: true, hadX: true }, { open: false });
assert.ok(lostShell.fail === true && lostShell.checked === 1 && /gone/.test(lostShell.text), 'ready then shell gone is a counted failure');
assert.ok(T({ ready: true }, null).fail === true, 'ready with no xReport result is a failure');
const lostX = T({ ready: true, hadX: true }, { open: true, noX: true });
assert.ok(lostX.fail === true && lostX.checked === 1 && /hidden/.test(lostX.text), 'ready then X hidden is a counted failure');
assert.ok(T({ ready: true, hadX: false }, { open: true, noX: true }).fail === false, 'a scene that never had an X still passes');
assert.ok(T({ ready: true, hadX: true }, { timedOut: true }).fail === true, 'an xReport timeout is a counted failure');

// R3 m2: page calls under a timeout
const t1 = await timedEval(new Promise(() => {}), 30);
assert.ok(t1.timedOut === true, 'a call that never answers reports timedOut');
const t2 = await timedEval(Promise.resolve(5), 1000);
assert.ok(t2.value === 5 && !t2.timedOut, 'a prompt call returns its value');
const t3 = await timedEval(Promise.reject(new Error('dead page')), 1000);
assert.ok(/dead page/.test(t3.error), 'a rejected call reports the error');
const t4 = await timedEval(Promise.resolve(undefined), 1000);
assert.ok(!t4.timedOut && !t4.error, 'an undefined result is not a timeout');

// R3 m3: the guard predicate, and a sample timeout counting as "no shell"
const timedOutCase = { kind: 'fail', sample: { shell: false, sampleTimeout: true }, message: 'm' };
assert.ok(isMissingCase(timedOutCase) === true, 'a sample timeout counts as no shell');
assert.ok(isMissingCase({ kind: 'fail', sample: { shell: true } }) === false, 'a failure with a shell does not count');
assert.ok(isMissingCase({ kind: 'notOpen' }) === false && isMissingCase({ kind: 'ready', sample: { shell: true } }) === false, 'notOpen and ready do not count');
const g3 = makeMissingGuard(MISSING_LIMIT);
let stop = false; for (let i = 0; i < MISSING_LIMIT; i++) stop = g3(isMissingCase(timedOutCase));
assert.ok(stop === true, 'ten sample timeouts in a row give the guard stop');
const g4 = makeMissingGuard(MISSING_LIMIT);
let stop4 = false; for (let i = 0; i < MISSING_LIMIT - 1; i++) stop4 = g4(isMissingCase(timedOutCase));
assert.ok(stop4 === false && g4(isMissingCase({ kind: 'ready', sample: { shell: true } })) === false, 'nine then a good case does not stop');
console.log('playtest-shellx-open-wait ok');

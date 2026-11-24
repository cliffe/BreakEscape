// shell-x-check open wait: pure condition logic, the decision function and the wait loop with a fake
// clock and sampler (the in-page sampler is proven live by the full run).
import assert from 'node:assert/strict';
import * as SX from '../../tools/playtest/shell-x-check.mjs';
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
assert.ok(!T({ ready: true, noXAllowed: true }, { open: true, noX: true }).fail && T({ ready: true, noXAllowed: true }, { open: true, noX: true }).checked === 0, 'an allowlisted no-X scene still passes uncounted');
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
assert.ok(T({ ready: true, hadX: false, noXAllowed: true }, { open: true, noX: true }).fail === false, 'an allowlisted scene that never had an X still passes');
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

// R4 m3: the allowlist. A no-X scene passes only when it disables close by design.
const notListed = T({ ready: true, hadX: false }, { open: true, noX: true });
assert.ok(notListed.fail === true && notListed.checked === 1 && /allowlist/.test(notListed.text), 'a no-X scene that is not on the allowlist fails');
assert.ok(T({ ready: true, hadX: false, noXAllowed: false }, { open: true, noX: true }).fail === true, 'noXAllowed false fails');
assert.ok(T({ ready: true, hadX: false, noXAllowed: 'yes' }, { open: true, noX: true }).fail === true, 'only a true allowlist flag passes');
const idx = "registerScene('a', A);\nregisterScene('b', B);\nregisterScene('c', C);\nregisterScene('t-s', T);";
const derived = SX.parseNoXScenes(idx, ['class A extends SocialOverlayScene {}', 'class B extends A {}', 'class C extends MinigameScene {}', 'class T extends MinigameScene {}', 'class Z extends SocialOverlayScene {}']);
assert.ok(derived.join() === 'a,b,title-screen', 'derived: direct and inherited overlay scenes plus the explicit extra only, unregistered classes and plain scenes left out (' + derived.join() + ')');
const real = SX.loadNoXScenes();
// S8a added code-device (its own steel X in the frame) and authenticator-live (the phone's window bar Close,
// inherited from authenticator): both extend SocialOverlayScene and start through socialOverlayParams (disableClose)
assert.ok(real.length === 17, 'the real tree gives exactly 17 scenes (' + real.join() + ')');
assert.ok(!real.includes('concern-form'), 'concern-form shows the framework X, so it is not on the list');
for (const n of ['mail-client', 'intel-board', 'osint-browser', 'inbox-triage', 'episode-runner', 'consequence-sandbox', 'pretext-prep', 'landing-page-builder', 'sort-drill', 'privacy-panel', 'password-guesser', 'assistant-chat', 'engagement-report', 'authenticator', 'authenticator-live', 'code-device', 'title-screen']) assert.ok(real.includes(n), 'the allowlist has ' + n);
for (const n of ['pin', 'notes', 'lockpicking', 'phone-chat', 'person-chat']) assert.ok(!real.includes(n), 'the allowlist has no ' + n);

// R4 m3: openScene glue, caseFromOutcome and reportFromEval
const rdyX = SX.caseFromOutcome({ kind: 'ready', sample: { shell: true, noX: false } }, false);
assert.ok(rdyX.ready === true && rdyX.hadX === true && rdyX.noXAllowed === false, 'a ready sample with an X sets hadX');
const rdyNo = SX.caseFromOutcome({ kind: 'ready', sample: { shell: true, noX: true } }, true);
assert.ok(rdyNo.ready === true && rdyNo.hadX === false && rdyNo.noXAllowed === true, 'a ready sample with no X clears hadX and carries the allowlist flag');
assert.ok(SX.caseFromOutcome({ kind: 'ready', sample: { shell: true, noX: true } }).noXAllowed === false, 'no allowlist flag means not allowed');
assert.ok(SX.caseFromOutcome({ kind: 'notOpen' }).notOpen === true, 'notOpen maps through');
const rep = SX.caseFromOutcome({ kind: 'report', message: 'cover' });
assert.ok(rep.hitOnly === true && rep.ready === false && rep.message === 'cover', 'report maps to hitOnly');
const fl = SX.caseFromOutcome({ kind: 'fail', message: 'late' });
assert.ok(fl.ready === false && fl.message === 'late' && !fl.hitOnly && !fl.notOpen, 'fail maps to a plain failed case');
assert.ok(SX.reportFromEval({ timedOut: true }).timedOut === true, 'a timed-out eval is a timedOut report');
assert.ok(SX.reportFromEval({ error: 'page crashed' }).open === false, 'an eval error is open:false');
assert.ok(SX.reportFromEval({ value: { open: true, noX: true } }).noX === true, 'a value passes through');
// end to end through tally: a crashed page after a ready case is a counted failure; a missing X on an unlisted scene fails
assert.ok(T(SX.caseFromOutcome({ kind: 'ready', sample: { shell: true, noX: false } }, false), SX.reportFromEval({ error: 'x' })).fail === true, 'crashed page after ready fails through the glue');
assert.ok(T(SX.caseFromOutcome({ kind: 'ready', sample: { shell: true, noX: true } }, false), SX.reportFromEval({ value: { open: true, noX: true } })).fail === true, 'unlisted no-X scene fails through the glue');
assert.ok(T(SX.caseFromOutcome({ kind: 'ready', sample: { shell: true, noX: true } }, true), SX.reportFromEval({ value: { open: true, noX: true } })).fail === false, 'listed no-X scene passes through the glue');

// R4 m2: per-call tokens against a late open
function fakePage() {
    const boxes = [];
    const doc = { querySelectorAll: () => ({ forEach: (f) => boxes.slice().forEach(f) }) };
    const mk = () => { const b = { dataset: {}, removed: false, remove() { this.removed = true; const i = boxes.indexOf(this); if (i >= 0) boxes.splice(i, 1); } }; boxes.push(b); return b; };
    const win = { __openError: null, MinigameFramework: { currentMinigame: null, forceCloseMinigame() { this.currentMinigame = null; } } };
    return { boxes, doc, win, mk };
}
const savedWin = globalThis.window, savedDoc = globalThis.document;
try {
    const f = fakePage();
    globalThis.window = f.win; globalThis.document = f.doc;
    let release;
    const slow = new Promise(r => { release = r; });
    f.win.MinigameFramework.startMinigame = async (name) => {
        if (name === 'slow') { await slow; const b = f.mk(); f.win.MinigameFramework.currentMinigame = { container: b, name }; return f.win.MinigameFramework.currentMinigame; }
        if (name === 'boom') throw new Error('next case threw');
        const b = f.mk(); f.win.MinigameFramework.currentMinigame = { container: b, name }; return f.win.MinigameFramework.currentMinigame;
    };
    const first = SX.pageOpen({ s: 'slow', p: {}, token: 'slow#1' });
    await new Promise(r => setTimeout(r, 300));
    await SX.pageOpen({ s: 'boom', p: {}, token: 'boom#2' });
    assert.ok(SX.pageOpenError('boom#2') === 'next case threw', 'the current call error is read by its own token');
    release();
    await first;
    assert.ok(f.boxes.length === 0, 'the late scene from the stale call is torn down (' + f.boxes.length + ' containers left)');
    assert.ok(SX.pageOpenError('boom#2') === 'next case threw', 'a late open does not overwrite the next case error');
    assert.ok(SX.pageOpenError('slow#1') === null, 'a stale token reads no error');
    // a late open that throws must not write __openError either
    let rel2; const slow2 = new Promise(r => { rel2 = r; });
    f.win.MinigameFramework.startMinigame = async (name) => { if (name === 'late-throw') { await slow2; throw new Error('late boom'); } const b = f.mk(); f.win.MinigameFramework.currentMinigame = { container: b }; return f.win.MinigameFramework.currentMinigame; };
    const a = SX.pageOpen({ s: 'late-throw', p: {}, token: 'lt#3' });
    await new Promise(r => setTimeout(r, 300));
    await SX.pageOpen({ s: 'fine', p: {}, token: 'fine#4' });
    rel2(); await a;
    assert.ok(SX.pageOpenError('fine#4') === null && f.win.__openError === null, 'a late throw does not write __openError over the next case');
    assert.ok(f.boxes.length === 1 && f.boxes[0].dataset.openToken === 'fine#4', 'the live scene keeps its own token and stays open');
    // an old container from a prior token is swept before the next open
    f.win.__openToken = 'old'; const old = f.mk(); old.dataset.openToken = 'old';
    await SX.pageOpen({ s: 'fine', p: {}, token: 'fine#5' });
    assert.ok(old.removed === true, 'an older token container is torn down before the next case opens');
} finally { globalThis.window = savedWin; globalThis.document = savedDoc; }

// R1 M1, m3, m4, m5: parser rules
const idx2 = "registerScene('a', A);\nregisterScene('concern-form', CF);";
assert.ok(SX.parseNoXScenes(idx2, ['class A extends SocialOverlayScene {}', "class CF extends SocialOverlayScene { m() { this.q('#minigame-close').style.display = ''; } }"]).join() === 'a,title-screen', 'an overlay class that turns the X back on is not listed');
assert.throws(() => SX.parseNoXScenes('nothing here', []), /no registerScene/, 'an index with no registrations is a setup error');
assert.throws(() => SX.parseNoXScenes("registerScene('p', P);", ['class P extends MinigameScene {}']), /derivation is broken/, 'no overlay scenes found is a setup error even though title-screen is an extra');
assert.ok(SX.parseNoXScenes('registerScene("q", Q);', ['class Q extends SocialOverlayScene {}']).join() === 'q,title-screen', 'double quotes parse');
assert.ok(SX.parseNoXScenes("// registerScene('x', A);\n/* registerScene('y', A); */\nregisterScene('a', A);", ['class A extends SocialOverlayScene {}']).join() === 'a,title-screen', 'commented registrations are ignored');
assert.ok(SX.parseNoXScenes("registerScene('a', A);\nregisterScene('pin', P);", ['class A extends SocialOverlayScene {}\n// class P extends SocialOverlayScene {}\nclass P extends MinigameScene {}']).join() === 'a,title-screen', 'a commented class is ignored');
assert.throws(() => SX.parseNoXScenes("registerScene('a', A);", ['class A extends SocialOverlayScene {}', 'class A extends SocialOverlayScene {}']), /more than one file/, 'a duplicate class name is a setup error');
const noXSet = new Set(['mail-client']);
assert.ok(SX.caseFor({ kind: 'ready', sample: { noX: true } }, 'mail-client', noXSet).noXAllowed === true, 'a listed scene is allowed by its name');
assert.ok(SX.caseFor({ kind: 'ready', sample: { noX: true } }, 'pin', noXSet).noXAllowed === false, 'an unlisted scene is not');
assert.ok(SX.caseFor({ kind: 'ready', sample: { noX: true } }, 'mail-client 915x412', noXSet).noXAllowed === false, 'the size tag is not the key');

// R1 m1 (real path) and m2: startMinigame is synchronous; the next open's sweep protects the next case
{
    const boxes = [];
    const doc = { querySelectorAll: () => ({ forEach: (f) => boxes.slice().forEach(f) }) };
    const mk = () => { const b = { dataset: {}, removed: false, remove() { this.removed = true; const i = boxes.indexOf(this); if (i >= 0) boxes.splice(i, 1); } }; boxes.push(b); return b; };
    const win = { __openError: null, MinigameFramework: { currentMinigame: null, forceCloseMinigame() { this.currentMinigame = null; } } };
    const sw = globalThis.window, sd = globalThis.document;
    try {
        globalThis.window = win; globalThis.document = doc;
        win.MinigameFramework.startMinigame = (name) => {
            if (name === 'boom') throw new Error('boom');
            if (name === 'unregistered') return null;
            const inst = { container: mk() }; win.MinigameFramework.currentMinigame = inst; return inst;
        };
        await SX.pageOpen({ s: 'slow', p: {}, token: 'slow#1' });
        assert.ok(boxes.length === 1 && boxes[0].dataset.openToken === 'slow#1', 'a synchronous open finishes as the current token and tags its box');
        const slowBox = boxes[0];
        await SX.pageOpen({ s: 'boom', p: {}, token: 'boom#2' });
        assert.ok(slowBox.removed === true && boxes.length === 0, 'the next open sweeps the previous scene before it opens');
        assert.ok(SX.pageOpenError('boom#2') === 'boom' && SX.pageOpenError('slow#1') === null, 'only the current token error is read');
        // stale call whose startMinigame returns null must leave the later case scene alone
        let rel; const gate = new Promise(r => { rel = r; });
        win.MinigameFramework.startMinigame = async (name) => { if (name === 'late-null') { await gate; return null; } const inst = { container: mk() }; win.MinigameFramework.currentMinigame = inst; return inst; };
        const late = SX.pageOpen({ s: 'late-null', p: {}, token: 'ln#3' });
        await new Promise(r => setTimeout(r, 300));
        await SX.pageOpen({ s: 'live', p: {}, token: 'live#4' });
        const liveBox = boxes[0], liveInst = win.MinigameFramework.currentMinigame;
        rel(); await late;
        assert.ok(liveBox.removed === false && win.MinigameFramework.currentMinigame === liveInst, 'a stale call that returns null does not close the later case scene');
    } finally { globalThis.window = sw; globalThis.document = sd; }
}

// R2 m1: the exception list and the source scan must agree
assert.ok(SX.NO_X_EXCEPT.join() === 'concern-form', 'concern-form is the explicit exception');
const cfSrc = "class CF extends SocialOverlayScene { m() { this.q('#minigame-close').style.display = ''; } }";
assert.throws(() => SX.parseNoXScenes("registerScene('a', A);\nregisterScene('other', CF);", ['class A extends SocialOverlayScene {}', cfSrc]), /disagree/, 'a scene that shows the X but is not in the exception list is a setup error');
assert.throws(() => SX.parseNoXScenes("registerScene('a', A);\nregisterScene('concern-form', CF);", ['class A extends SocialOverlayScene {}', 'class CF extends SocialOverlayScene {}']), /disagree/, 'an exception whose source no longer shows the X is a setup error');
assert.ok(SX.parseNoXScenes("registerScene('a', A);\nregisterScene('concern-form', CF);", ['class A extends SocialOverlayScene {}', cfSrc.replace("''", '""')]).join() === 'a,title-screen', 'a double-quoted blank display is read too');
// R2 m2: duplicates matter only on an overlay chain
assert.ok(SX.parseNoXScenes("registerScene('a', A);", ['class A extends SocialOverlayScene {}', 'class Inner extends Phaser.Scene {}', 'class Inner extends Phaser.Scene {}']).join() === 'a,title-screen', 'unrelated duplicate inner classes do not throw');
assert.throws(() => SX.parseNoXScenes("registerScene('a', A);", ['class A extends Base {}', 'class A extends Base {}', 'class Base extends SocialOverlayScene {}']), /more than one file/, 'a duplicate on an overlay chain still throws');
// R2 gap: the runtime setup error closes the browser first
{
    let closed = 0, code = null; const logs = [];
    await SX.failSetup({ browser: { close: async () => { closed++; } }, message: 'm', log: (x) => logs.push(x), exit: (c) => { code = c; } });
    assert.ok(closed === 1 && code === 2 && logs[0] === 'm', 'failSetup closes the browser once, then exits 2');
    closed = 0; code = null;
    await SX.failSetup({ browser: { close: () => new Promise(() => {}) }, message: 'm', log: () => {}, exit: (c) => { code = c; }, timeoutMs: 50 });
    assert.ok(code === 2, 'a browser that never closes is raced and still exits 2');
}
console.log('playtest-shellx-open-wait ok');

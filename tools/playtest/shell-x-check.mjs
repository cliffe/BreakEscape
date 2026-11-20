// Shell X check (UI shell review m2, m8): the behaviour the source-text tests could not see.
// For each minigame scene and size it opens the scene, scrolls the shell (and the notes page)
// to the end both ways, and asserts that
//   - the close X's box is wholly inside the viewport (M1, M2),
//   - the X does not sit on the shell's own scrollbar or on the scrollbar of the box under it
//     (M3: the notes page),
//   - for scenes that put the X in a frame, the X's box is inside that frame's border (R2 B1), and
//   - document.elementFromPoint at the X's centre returns the X: it is visible, on top and can be
//     clicked (R2 B1: a clip-path cut it away),
// and, for the PIN pad, that showing a wrapped wrong-code message does not move the keys (m2).
//
//   node tools/playtest/shell-x-check.mjs --port 3450 --game 3084 [--scenes a,b] [--sizes 915x412,800x600,390x844]
//
// Open wait budget: a case is never measured sooner than 600 ms after the open, and only once the shell
// rect and the X rect have held still for 400 ms (a late async paint can still shift the X; the old fixed
// wait was 1.2 s). It waits up to 5 s for the shell to exist, be visible and settle, then up to 1.5 s more
// (from when it first held) for the X to be hit-testable: at most about 6.5 s a case, typically about
// 0.65 s. If only the hit test is unmet then, the run hands over to the X report so an off-screen,
// frame-clipped or covered X gets its specific message, and counts as a failure. This keeps --legacy
// (which moves the X on most of the 180 X cases of 240) well under the 900 s test limit.
// Each case's page calls have a timeout, so a stalled scene cannot hang the run: a sample 2 s, startMinigame 30 s,
// the openError read 5 s, xReport 10 s (all counted failures), forceClose 5 s (logged, the run carries on)
// the PIN message probe 10 s, and browser.close() 10 s on the way out. Viewport resizes and the one-off setup
// (load, Mission Brief) are not timed. 10 cases in a row with no shell and no thrown error
// (including samples that timed out) stop the run with exit 2 (a broken build, a knocked-out player or
// a page that has stopped answering).
// Trade-off: an X covered by something that clears within the 1.5 s hit window passes (the old fixed
// 1.2 s wait failed it if still covered at 1.2 s); an X covered for longer fails.
//
// Late opens (R4 m2): startMinigame is synchronous, so a 30 s stall is a blocked page. The next case's
// open runs only after the stalled one has finished, and its sweep (every .minigame-container removed
// and __openError cleared before anything opens) is what protects it. Each open call also carries its
// own token, kept on the scene it opened and on __openError, as a guard against an asynchronous
// startMinigame in future: a call that returns after a later one has started removes only the container
// it opened and writes nothing, and the error read ignores any token but the current one.
// No-X allowlist (R4 m3): a scene with no X passes only if it disables close by design. The list is
// derived from the scene sources: every registered scene whose class extends SocialOverlayScene (which
// switches the framework X off), minus classes whose source turns #minigame-close back on
// (concern-form shows it as its one Close), plus NO_X_EXTRA (title-screen). A failed or empty
// derivation, a disagreement with NO_X_EXCEPT, or a listed scene that is not registered at runtime, is a
// setup error (exit 2; the runtime one closes the browser first). A scene with no X that is not on the list fails.
//
// Exits 1 on any failure, 2 on a setup error. A scene that throws from startMinigame and leaves no shell
// is reported as "not open" and does not fail the run (the audit's --strict is the gate for those).
// A scene that never opens and throws nothing (an unregistered --scenes name, or a knocked-out player)
// now FAILS after the 5 s wait; a thrown error with a shell left behind also FAILS ("open threw").
// Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE picks the browser. Runs in a merge batch on a keyless server:
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE=... node tools/playtest/shell-x-check.mjs --port 3001 --game <id>
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const PORT = opt('port', '3001');
const GID = opt('game', null);
const SIZES = opt('sizes', '1400x1000,915x412,800x600,390x844').split(',').map(s => s.split('x').map(Number));
const IS_MAIN = import.meta.url === pathToFileURL(process.argv[1] || '').href;

const LONG = Array.from({ length: 14 }, (_, i) => `${i + 1}. Rules of engagement: stay inside the agreed scope, log every action with a time, and stop and report if you find personal data you were not cleared to see.`).join('\n');
export const PARAMS = {
    pin: { title: 'Keypad', correctPin: '1234', pinLength: 4, maxAttempts: 3 },
    notes: { title: 'Rules of engagement', noteContent: LONG, observationText: 'Pinned by the door.' },
    'text-file': { title: 'notes.txt', fileName: 'notes.txt', fileContent: 'Line one.\nLine two.', content: 'Line one.\nLine two.' },
    combination: { title: 'Padlock', combination: [7, 21, 39], dials: 3 },
    cryptex: { title: 'Cryptex', password: 'CIPHER', wheels: 6 },
    'phone-chat': { title: 'Phone', npcId: 'test_npc' },
    'alarm-panel': { lockable: { scenarioData: { minigameData: { lamps: [{ label: 'FRONT DOOR', offStatus: 'CLOSED' }, { label: 'FIRE ZONE 2', offStatus: 'CLEAR' }, { label: 'MAINS POWER', offStatus: 'NORMAL' }, { label: 'SERVER ROOM NETWORK', offStatus: 'LINK UP' }] } } } },
    'ble-scanner': { title: 'BLE scanner', devices: [{ name: 'Printer', mac: 'AA:BB:CC:00:11:22', rssi: -48 }] },
    'bluetooth-scanner': { title: 'Bluetooth scanner', devices: [{ name: 'Printer', mac: 'AA:BB:CC:00:11:22', rssi: -48 }] }
};

// Pure check, run in the page: where is the X, and is it clear of the scrollbars?
export function xReport() {
    const mg = document.querySelector('.minigame-container');
    const x = mg && mg.querySelector('.minigame-close-button');
    if (!mg) return { open: false };
    if (!x || getComputedStyle(x).display === 'none') return { open: true, noX: true };
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const scrollAll = () => {
        // shell to the far corner, and every scroll box under the X to its end
        mg.scrollTop = mg.scrollHeight; mg.scrollLeft = mg.scrollWidth;
        for (const el of mg.querySelectorAll('*')) {
            const cs = getComputedStyle(el);
            if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight;
            if (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth;
        }
    };
    const measure = (label) => {
        const b = x.getBoundingClientRect();
        const issues = [];
        if (b.left < 0 || b.top < 0 || b.right > vw + 0.5 || b.bottom > vh + 0.5) issues.push(`X outside the viewport (${Math.round(b.left)},${Math.round(b.top)}-${Math.round(b.right)},${Math.round(b.bottom)} in ${vw}x${vh})`);
        // B1: inside the frame it belongs to (not on or past the border), and clickable
        if (x.classList.contains('minigame-close-in-frame')) {
            const frame = window.MinigameFramework?.currentMinigame?.closeAnchor?.();
            if (frame) {
                const f = frame.getBoundingClientRect();
                const l = f.left + frame.clientLeft, t = f.top + frame.clientTop;
                const rr = l + frame.clientWidth, bb = t + frame.clientHeight;
                if (b.left < l - 0.5 || b.top < t - 0.5 || b.right > rr + 0.5 || b.bottom > bb + 0.5) issues.push(`X not inside its frame (X ${Math.round(b.left)},${Math.round(b.top)}-${Math.round(b.right)},${Math.round(b.bottom)}; frame inner ${Math.round(l)},${Math.round(t)}-${Math.round(rr)},${Math.round(bb)})`);
            }
        }
        const hit = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2);
        if (!hit || !(hit === x || x.contains(hit))) issues.push(`X not clickable: elementFromPoint at its centre returns ${hit ? hit.tagName.toLowerCase() + '.' + String(hit.className).split(' ')[0] : 'nothing'}`);
        const barW = Math.max(0, mg.offsetWidth - mg.clientWidth);
        if (barW && b.right > vw - barW + 0.5) issues.push(`X over the shell scrollbar (right ${Math.round(b.right)}, bar from ${vw - barW})`);
        // any scroll box under the X whose own scrollbar the X covers
        for (const el of mg.querySelectorAll('*')) {
            if (el === x || el.contains(x)) continue;
            const cs = getComputedStyle(el);
            if (!/(auto|scroll)/.test(cs.overflowY) || !(el.offsetWidth - el.clientWidth - parseFloat(cs.borderLeftWidth || 0) - parseFloat(cs.borderRightWidth || 0) > 0)) continue;
            const eb = el.getBoundingClientRect();
            const bw = el.offsetWidth - el.clientWidth - (parseFloat(cs.borderLeftWidth) || 0) - (parseFloat(cs.borderRightWidth) || 0);
            const bar = { l: eb.right - (parseFloat(cs.borderRightWidth) || 0) - bw, r: eb.right - (parseFloat(cs.borderRightWidth) || 0), t: eb.top, b: eb.bottom };
            if (b.left < bar.r && b.right > bar.l && b.top < bar.b && b.bottom > bar.t) issues.push(`X over the scrollbar of ${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
        }
        return { label, issues, scrollsX: mg.scrollWidth > mg.clientWidth, scrollsY: mg.scrollHeight > mg.clientHeight };
    };
    const top = measure('top');
    scrollAll();
    return new Promise(res => setTimeout(() => {
        const end = measure('scrolled to the end');
        res({ open: true, results: [top, end] });
    }, 250));
}

// Open wait. Run in the page: sample the shell and the X over two animation frames.
export async function xSample() {
    const mg = document.querySelector('.minigame-container');
    const x = mg && mg.querySelector('.minigame-close-button');
    const rect = (el) => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
    const frame = () => new Promise(r => requestAnimationFrame(() => r()));
    if (!mg) return { shell: false };
    const r1 = rect(mg), x1 = x ? rect(x) : null;
    await frame(); await frame();
    const r2 = rect(mg), x2 = x ? rect(x) : null;
    const cs = getComputedStyle(mg);
    const visible = cs.display !== 'none' && cs.visibility !== 'hidden' && r2[2] > 0 && r2[3] > 0;
    const noX = !x || getComputedStyle(x).display === 'none';
    let hitOk = false, hitHtml = '';
    if (!noX) {
        const hit = document.elementFromPoint(x2[0] + x2[2] / 2, x2[1] + x2[3] / 2);
        hitOk = !!hit && (hit === x || x.contains(hit));
        hitHtml = hit ? hit.outerHTML.slice(0, 300) : '(nothing under the X)';
    }
    // stable = the shell rect held still; xStable = the X rect held still (reported separately, m3)
    return { shell: true, visible, noX, rects: JSON.stringify([r2, x2]), stable: r1.every((v, i) => v === r2[i]), xStable: !x1 || x1.every((v, i) => v === x2[i]), hitOk, hitHtml };
}

// Pure: the "hard" open conditions still unmet (shell exists, visible, shell and X rects stable).
// These wait up to OPEN_TIMEOUT_MS and a miss at the deadline is a timeout failure.
export function hardUnmet(sample) {
    if (sample && sample.sampleTimeout) return ['the page did not answer a sample within the sample timeout'];
    if (!sample || !sample.shell) return ['the minigame shell (.minigame-container) does not exist'];
    const unmet = [];
    if (!sample.visible) unmet.push('the minigame shell is not visible (hidden or zero size)');
    if (!sample.stable) unmet.push('the shell rect is still changing across two animation frames');
    if (sample.xStable === false) unmet.push('the X rect is still changing across two animation frames');
    return unmet;
}

// Pure: every unmet condition, hit test included. A shell with no X (disableClose scene) has
// nothing to hit-test, so it is ready once visible and stable.
export function unmetConditions(sample) {
    const unmet = hardUnmet(sample);
    if (sample && sample.shell && !sample.noX && !sample.hitOk) unmet.push('the element at the X centre is not the X or inside it');
    return unmet;
}

export function openTimeoutMessage(scene, sample, unmet, openError) {
    return `${scene}: open wait timed out; unmet: ${unmet.join('; ')}.${openError ? ` (open threw: ${openError})` : ''} Element under the X: ${sample && sample.hitHtml ? sample.hitHtml : '(not measured)'}`;
}

// Pure decision for one sample. state = { hardExpired, hitExpired, settled } says which waits have run
// out and whether the settle floor (SETTLE_MS still, MIN_AFTER_OPEN_MS since open) has been met.
//   ready    open and the X is on top (and startMinigame threw nothing)
//   wait     keep sampling
//   notOpen  no shell and startMinigame said why: the "(not open)" report, not a failure
//   fail     counted failure; message says why
//   report   shell, visibility and stability are fine and only the hit test is unmet at its
//            deadline: hand over to xReport for the specific reason (off-screen, clipped, covered)
export function openOutcome(scene, sample, openError, state) {
    const hard = hardUnmet(sample);
    const hasShell = !!(sample && sample.shell);
    if (!hasShell && openError) return { kind: 'notOpen' };
    if (hard.length) {
        if (!state.hardExpired) return { kind: 'wait' };
        return { kind: 'fail', message: openTimeoutMessage(scene, sample, hard, openError) };
    }
    // Shell is open and steady. A constructor or init() throw leaves the container behind (m2):
    // that is a failure, not a disableClose skip.
    if (openError) return { kind: 'fail', message: `${scene}: open threw: ${openError}` };
    // m5: not measured until the rects held still for SETTLE_MS and MIN_AFTER_OPEN_MS have passed.
    if (!state.settled) {
        if (!state.hardExpired) return { kind: 'wait' };
        return { kind: 'fail', message: `${scene}: open wait timed out; unmet: the shell and X did not hold still for ${SETTLE_MS} ms and ${MIN_AFTER_OPEN_MS} ms did not pass. Element under the X: ${sample.hitHtml || '(not measured)'}` };
    }
    if (sample.noX || sample.hitOk) return { kind: 'ready' };
    if (!state.hitExpired) return { kind: 'wait' };
    return { kind: 'report', message: openTimeoutMessage(scene, sample, unmetConditions(sample)) };
}

// Injectable wait loop: sampleFn() -> sample, now() -> ms, sleep(ms). Waits up to OPEN_TIMEOUT_MS for
// the hard conditions, then up to HIT_TIMEOUT_MS (counted from when they first held) for the hit test.
export async function waitForOpen({ scene, sampleFn, now, sleep, openError = null, openMs = OPEN_TIMEOUT_MS, hitMs = HIT_TIMEOUT_MS, settleMs = SETTLE_MS, minAfterOpenMs = MIN_AFTER_OPEN_MS }) {
    const start = now();
    const hardDeadline = start + openMs;
    let hitSince = null, stillSince = null, lastRects = null;
    for (;;) {
        const sample = await sampleFn();
        const t = now();
        if (sample && sample.shell && hardUnmet(sample).length === 0) {
            if (hitSince === null) hitSince = t;
            if (stillSince === null || sample.rects !== lastRects) stillSince = t;
            lastRects = sample.rects;
        } else { hitSince = null; stillSince = null; lastRects = null; }
        const settled = stillSince !== null && t - stillSince >= settleMs && t - start >= minAfterOpenMs;
        const out = openOutcome(scene, sample, openError, { hardExpired: t >= hardDeadline, hitExpired: hitSince !== null && t - hitSince >= hitMs, settled });
        if (out.kind !== 'wait') return { ...out, sample };
        await sleep(50);
    }
}

export const OPEN_TIMEOUT_MS = 5000;
export const HIT_TIMEOUT_MS = 1500;
export const SETTLE_MS = 400;
export const MIN_AFTER_OPEN_MS = 600;
export const SAMPLE_TIMEOUT_MS = 2000;
export const MISSING_LIMIT = 10;
export const START_TIMEOUT_MS = 30000;
export const OPENERR_TIMEOUT_MS = 5000;
export const REPORT_TIMEOUT_MS = 10000;
export const CLOSE_TIMEOUT_MS = 5000;
export const BROWSER_CLOSE_TIMEOUT_MS = 10000;

// Pure (m2): await a page call under a timeout. Resolves { value }, { timedOut: true } or { error }.
export async function timedEval(promise, ms) {
    const TIMED_OUT = Symbol('timeout');
    try {
        const v = await withTimeout(promise, ms, TIMED_OUT);
        return v === TIMED_OUT ? { timedOut: true } : { value: v };
    } catch (e) { return { error: String((e && e.message) || e) }; }
}

// Pure (m3): does this open result count towards the guard (no shell, no thrown error)? A sample that
// timed out has shell:false, so it counts too.
export function isMissingCase(o) {
    return !!o && o.kind === 'fail' && !(o.sample && o.sample.shell);
}

// Pure: race a promise against a timer (m4). Resolves with `fallback` if it takes longer than ms.
export function withTimeout(promise, ms, fallback) {
    let timer;
    const timeout = new Promise(res => { timer = setTimeout(() => res(fallback), ms); });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

// Pure (m4): a guard that trips after `limit` consecutive cases with no shell and no thrown error.
export function makeMissingGuard(limit = MISSING_LIMIT) {
    let run = 0;
    return (isMissing) => { run = isMissing ? run + 1 : 0; return run >= limit; };
}


// R4 m2: page-side open and its error read, run in the page (self-contained: playwright serialises them).
// Each call owns a token. A call that finds a later token when it returns is stale: it removes the scene
// it opened and leaves __openError alone.
export async function pageOpen({ s, p, token }) {
    const w = window;
    w.__openToken = token;
    w.__openError = null;
    const stale = () => w.__openToken !== token;
    try { w.MinigameFramework.forceCloseMinigame?.(); } catch { /* none */ }
    document.querySelectorAll('.minigame-container').forEach(n => n.remove());
    await new Promise(r => setTimeout(r, 250));
    if (stale()) return;
    let inst = null;
    try { inst = await w.MinigameFramework.startMinigame(s, null, p); } catch (e) {
        if (!stale()) w.__openError = { token, message: String((e && e.message) || e) };
        return;
    }
    if (stale()) {
        // a late scene from an older call: remove only what this call opened, never the later case's scene
        if (inst && inst.container) {
            try { if (w.MinigameFramework.currentMinigame === inst) w.MinigameFramework.forceCloseMinigame?.(); } catch { /* none */ }
            if (inst.container.remove) inst.container.remove();
        }
        return;
    }
    const cur = (inst && inst.container) ? inst : w.MinigameFramework.currentMinigame;
    const box = (cur && cur.container) || null;
    if (box && box.dataset) box.dataset.openToken = token;
}

export function pageOpenError(token) {
    const e = window.__openError;
    return e && e.token === token ? e.message : null;
}

// R4 m3: derive the scenes that disable close by design from the sources. indexSrc is minigames/index.js,
// sources is every other minigame source text. A registered scene counts when its class extends
// SocialOverlayScene, directly or through another class.
export const NO_X_EXTRA = ['title-screen'];
// Overlay scenes that show the framework X on purpose (concern-form: its shared bar Close). Source of truth;
// the source scan below must agree with it or the run stops with a setup error.
export const NO_X_EXCEPT = ['concern-form'];
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
export function parseNoXScenes(indexSrc, sources) {
    const reg = {};
    for (const m of stripComments(indexSrc).matchAll(/registerScene\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g)) reg[m[1]] = m[2];
    if (!Object.keys(reg).length) throw new Error('no registerScene calls found in minigames/index.js');
    const parent = {}, shows = {}, defs = {};
    for (const raw of sources) {
        const src = stripComments(raw);
        // a class whose file turns #minigame-close back on shows the framework X by design
        const showsX = /#minigame-close/.test(src) && /style\.display\s*=\s*(''|"")/.test(src);
        for (const m of src.matchAll(/class\s+(\w+)\s+extends\s+([\w.]+)/g)) {
            defs[m[1]] = (defs[m[1]] || 0) + 1;
            parent[m[1]] = m[2]; shows[m[1]] = showsX;
        }
    }
    const chain = (cls) => { const c = []; for (let d = 0; cls && d < 10; d++) { c.push(cls); cls = parent[cls]; } return c; };
    const isOverlay = (cls) => chain(cls).includes('SocialOverlayScene');
    const showsXOf = (cls) => chain(cls).some(c => shows[c] === true);
    // a duplicate class name matters only on the chain of an overlay scene (last-wins could change the list)
    for (const n of Object.keys(reg)) if (isOverlay(reg[n])) for (const c of chain(reg[n])) if (defs[c] > 1) throw new Error(`class ${c} is defined in more than one file`);
    const overlays = Object.keys(reg).filter(n => isOverlay(reg[n]));
    if (!overlays.length) throw new Error('no SocialOverlayScene scenes found: the derivation is broken');
    const scanned = overlays.filter(n => showsXOf(reg[n])).sort().join();
    if (scanned !== NO_X_EXCEPT.filter(n => overlays.includes(n)).sort().join()) throw new Error(`the sources and NO_X_EXCEPT disagree on which overlay scenes show the X (sources: ${scanned || 'none'}; list: ${NO_X_EXCEPT.join()})`);
    const out = overlays.filter(n => !NO_X_EXCEPT.includes(n));
    for (const n of NO_X_EXTRA) if (!out.includes(n)) out.push(n);
    return out.sort();
}

// A setup error that must still close the browser (raced) before exit 2.
export async function failSetup({ browser, message, log = console.error, exit = process.exit, timeoutMs = BROWSER_CLOSE_TIMEOUT_MS }) {
    log(message);
    const c = await timedEval(browser.close(), timeoutMs);
    if (c.timedOut) log('browser.close() did not return in time; exiting anyway');
    exit(2);
}

export function loadNoXScenes(root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'break_escape', 'js', 'minigames')) {
    const files = [];
    const walk = (d) => { for (const f of readdirSync(d)) { const q = join(d, f); if (statSync(q).isDirectory()) walk(q); else if (q.endsWith('.js')) files.push(q); } };
    walk(root);
    return parseNoXScenes(readFileSync(join(root, 'index.js'), 'utf8'), files.map(f => readFileSync(f, 'utf8')));
}

// R4 m5: the case main builds for a scene: the allowlist is looked up by the scene name.
export function caseFor(o, scene, noXSet) {
    return caseFromOutcome(o, noXSet.has(scene));
}

// R4 m3: the glue from a waitForOpen result to the case the main loop tallies (hadX, hand-over, allowlist).
export function caseFromOutcome(o, noXAllowed) {
    if (o.kind === 'ready') return { ready: true, hadX: !!(o.sample && !o.sample.noX), noXAllowed: noXAllowed === true };
    if (o.kind === 'notOpen') return { ready: false, notOpen: true };
    if (o.kind === 'report') return { ready: false, hitOnly: true, message: o.message };
    return { ready: false, message: o.message };
}

// R4 m3: the timedEval result of xReport as the main loop reads it (a crashed page is open:false).
export function reportFromEval(rr) {
    return rr.timedOut ? { timedOut: true } : rr.error ? { open: false } : rr.value;
}

// Pure (m2, m3): the main loop's counting for one case. o = the open result, r = the xReport result
// (or null when it was not run), issues = flattened xReport issues. Returns { checked, fail, text }.
// A hand-over from the hit-test wait (o.hitOnly) is always a failure, including when xReport then
// finds no shell or no X.
export function tally(o, r, issues = []) {
    if (!o.ready && !o.notOpen && !o.hitOnly) return { checked: 1, fail: true, text: `FAIL ${o.message}` };
    if (r && r.timedOut) return { checked: 1, fail: true, text: `FAIL xReport did not answer within ${REPORT_TIMEOUT_MS} ms` };
    // m1: a ready case had a shell and (unless hadX is false) an X a moment ago; losing either is a failure.
    if (o.ready && (!r || !r.open)) return { checked: 1, fail: true, text: 'FAIL the shell was gone when the X was measured' };
    if (o.ready && r.noX && o.hadX === true) return { checked: 1, fail: true, text: 'FAIL the X was hidden when it was measured' };
    if (!r || !r.open) {
        if (o.hitOnly) return { checked: 1, fail: true, text: `FAIL after the open wait: ${o.message} (shell gone when measured)` };
        return { checked: 0, fail: false, text: '(not open)' };
    }
    if (r.noX) {
        if (o.hitOnly) return { checked: 1, fail: true, text: `FAIL after the open wait: ${o.message} (X hidden when measured)` };
        if (o.noXAllowed !== true) return { checked: 1, fail: true, text: 'FAIL no X, and the scene is not on the disableClose allowlist' };
        return { checked: 0, fail: false, text: 'no X (disableClose scene)' };
    }
    if (o.hitOnly) return { checked: 1, fail: true, text: `FAIL after the open wait: ${issues.length ? issues.join('; ') : o.message}` };
    if (issues.length) return { checked: 1, fail: true, text: `FAIL ${issues.join('; ')}` };
    const last = r.results[1];
    return { checked: 1, fail: false, text: `ok${last.scrollsX || last.scrollsY ? ` (shell scrolls ${last.scrollsX ? 'x' : ''}${last.scrollsY ? 'y' : ''})` : ''}` };
}

async function main() {
    if (!GID) { console.error('--game is required'); process.exit(2); }
    let noXScenes;
    try { noXScenes = new Set(loadNoXScenes()); } catch (e) { console.error(`could not derive the disableClose scene list: ${e.message}`); process.exit(2); }
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] });
    const page = await browser.newPage({ viewport: { width: SIZES[0][0], height: SIZES[0][1] } });
    await page.addInitScript(() => { try { localStorage.setItem('tutorial_declined', 'true'); } catch { /* blocked */ } });
    await page.goto(`http://127.0.0.1:${PORT}/break_escape/games/${GID}?skip_resume=1`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => !!window.__test, null, { timeout: 240000 });
    await page.evaluate(() => window.__test.waitUntilReady({ timeoutMs: 90000 }));
    await page.evaluate(() => { try { window.game?.physics?.world?.setFPS?.(20); } catch { /* none */ } });
    // --legacy puts the X back to absolute inside the shell: the check must then fail (proof it bites)
    if (argv.includes('--legacy')) await page.addStyleTag({ content: '.minigame-container > .minigame-close-button { position: absolute !important; } .notes-minigame-content-area { top: 0 !important; height: 90% !important; }' });
    await page.waitForTimeout(2000);
    const registered = await page.evaluate(() => Object.keys(window.MinigameFramework.registeredScenes || {}));
    const scenes = opt('scenes', null)?.split(',') || registered;
    const skipped = new Set((opt('skip', 'person-chat,network-view') || '').split(','));
    let fails = 0, checked = 0;
    const missingGuard = makeMissingGuard();
    const stopIfGuard = async (o, s) => {
        if (!missingGuard(isMissingCase(o))) return false;
        console.error(`SHELL-X-CHECK stopped: ${MISSING_LIMIT} cases in a row had no minigame shell and no thrown error (last: ${s}). Broken build, knocked-out player or a page that stopped answering? ${checked} checked, ${fails} failed so far.`);
        const c = await timedEval(browser.close(), BROWSER_CLOSE_TIMEOUT_MS);
        if (c.timedOut) console.error('browser.close() did not return in time; exiting anyway');
        process.exit(2);
    };
    const missingScene = [...noXScenes].find(n => !registered.includes(n));
    if (missingScene) { await failSetup({ browser, message: `the derived disableClose list names '${missingScene}', which is not registered at runtime: stale or misparsed index.js` }); return; }
    let openSeq = 0;
    const openScene = async (s) => {
        const token = `${s}#${++openSeq}`;
        const started = await timedEval(page.evaluate(pageOpen, { s, p: PARAMS[s] || { title: s }, token }), START_TIMEOUT_MS);
        if (started.timedOut || started.error) {
            const why = started.timedOut ? `startMinigame did not return within ${START_TIMEOUT_MS} ms` : `the page call failed: ${started.error}`;
            const o = { kind: 'fail', sample: { shell: false } };
            if (await stopIfGuard(o, s)) return null;
            return { ready: false, message: `${s}: ${why}` };
        }
        // Condition wait in place of a fixed delay (budget in the header).
        const oe = await timedEval(page.evaluate(pageOpenError, token), OPENERR_TIMEOUT_MS);
        const openError = oe.value || null;
        const sampleFn = () => withTimeout(page.evaluate(xSample).catch(() => ({ shell: false, sampleTimeout: true })), SAMPLE_TIMEOUT_MS, { shell: false, sampleTimeout: true });
        const o = await waitForOpen({ scene: s, sampleFn, now: () => Date.now(), sleep: (ms) => page.waitForTimeout(ms), openError });
        if (await stopIfGuard(o, s)) return null;
        return caseFor(o, s, noXScenes);
    };
    for (const s of scenes) {
        if (skipped.has(s)) continue;
        for (const [w, h] of SIZES) {
            await page.setViewportSize({ width: w, height: h });
            const o = await openScene(s);
            const tag = `${s} ${w}x${h}`;
            let r = null;
            if (o.ready || o.hitOnly) {
                const rr = await timedEval(page.evaluate(xReport), REPORT_TIMEOUT_MS);
                r = reportFromEval(rr);
            }
            const issues = r && r.results ? r.results.flatMap(x => x.issues.map(i => `${x.label}: ${i}`)) : [];
            const t = tally(o, r, issues);
            checked += t.checked; if (t.fail) fails++;
            console.log(`${tag.padEnd(40)} ${t.text}`);
        }
        const fc = await timedEval(page.evaluate(() => window.MinigameFramework.forceCloseMinigame?.()), CLOSE_TIMEOUT_MS);
        if (fc.timedOut) console.log(`${s}: forceCloseMinigame did not return within ${CLOSE_TIMEOUT_MS} ms, carrying on`);
    }
    // PIN pad: a wrapped wrong-code message must not move the keys (m2)
    if (scenes.includes('pin')) {
        for (const [w, h] of SIZES) {
            await page.setViewportSize({ width: w, height: h });
            const o = await openScene('pin');
            const tag = `pin message ${w}x${h}`;
            if (o.notOpen) { checked++; console.log(`${tag.padEnd(40)} (not open)`); continue; }
            if (!o.ready) { checked++; fails++; console.log(`${tag.padEnd(40)} FAIL ${o.message}`); continue; }
            const pm = await timedEval(page.evaluate(async () => {
                const mg = window.MinigameFramework.currentMinigame;
                const pad = document.querySelector('.pin-minigame-keypad');
                if (!mg || !pad) return null;
                const before = pad.getBoundingClientRect().top;
                mg.showPinMessage('Incorrect PIN. 2 attempts remaining.', 'wrong');
                await new Promise(r => setTimeout(r, 200));
                const long = pad.getBoundingClientRect().top;
                mg.showPinMessage('Locked out. Your guesses are kept.', 'wrong');
                await new Promise(r => setTimeout(r, 200));
                const longer = pad.getBoundingClientRect().top;
                return { before, long, longer };
            }), REPORT_TIMEOUT_MS);
            checked++;
            if (!('value' in pm)) { fails++; console.log(`${tag.padEnd(40)} FAIL PIN probe ${pm.timedOut ? 'timed out' : 'threw: ' + pm.error}`); continue; }
            const m = pm.value;
            if (!m) { console.log(`${tag.padEnd(40)} (not open)`); continue; }
            if (Math.abs(m.before - m.long) > 0.5 || Math.abs(m.before - m.longer) > 0.5) { fails++; console.log(`${tag.padEnd(40)} FAIL keys moved ${m.before} -> ${m.long} -> ${m.longer}`); }
            else console.log(`${tag.padEnd(40)} ok keys stay at ${Math.round(m.before)}`);
        }
    }
    const bc = await timedEval(browser.close(), BROWSER_CLOSE_TIMEOUT_MS);
    if (bc.timedOut) console.error('browser.close() did not return in time');
    console.log(`SHELL-X-CHECK ${checked} checked, ${fails} failed`);
    if (fails) process.exit(1);
}

if (IS_MAIN) main().catch(e => { console.error(e); process.exit(2); });

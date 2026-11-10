// Error toasts are shown at least 5 s, every lock refusal lasts by length (5 s floor without
// a hint, 6 s with one), and a door's refusal is titled with its sign
// (PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md 7, review R2 n8 and n9).
// Run with: node test/js/error-toast-floor.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (rel) => readFileSync(join(js, rel), 'utf8');

globalThis.window = {};
const T = await import(dataUrl(read('systems/notifications.js')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
    .split("'../utils/overlay-open.js'").join(`'${dataUrl(read('utils/overlay-open.js'))}'`)));
const { lockedHintDuration, signTitle, doorRefusalTitle, REFUSAL_MIN_MS } = await import(dataUrl(read('utils/locked-hint.js')));

const children = [];
const container = {
    appendChild(n) { n.parentNode = container; children.push(n); },
    removeChild(n) { n.parentNode = null; children.splice(children.indexOf(n), 1); },
    querySelectorAll: (sel) => (sel === '.notification' ? [...children] : [])
};
function el() {
    const parts = {};
    return {
        classList: { add() {}, remove() {} }, style: {}, parentNode: null,
        set innerHTML(v) { this.html = v; },
        querySelector(sel) { return parts[sel] || (parts[sel] = { style: {}, addEventListener(_e, fn) { this.click = fn; } }); }
    };
}
globalThis.document = { getElementById: (id) => (id === 'notification-container' ? container : null), createElement: el };

test('toastDuration: an error between 0 and 5000 becomes 5000; 0, longer times and other types are kept', () => {
    assert.equal(T.ERROR_TOAST_MIN_MS, 5000);
    assert.equal(T.toastDuration('error', 3000), 5000);
    assert.equal(T.toastDuration('error', 2000), 5000);
    assert.equal(T.toastDuration('error', 4999), 5000);
    assert.equal(T.toastDuration('error', 0), 0);
    assert.equal(T.toastDuration('error', 8000), 8000);
    assert.equal(T.toastDuration('error', 5000), 5000);
    assert.equal(T.toastDuration('info', 3000), 3000);
    assert.equal(T.toastDuration('success', 2000), 2000);
    assert.equal(T.toastDuration('warning', 3000), 3000);
});

test('a 3 s error toast is shown with a 5 s countdown; an info toast keeps its time', () => {
    children.length = 0;
    const e = T.gameAlert('Access denied', 'error', 'Records Office', 3000);
    assert.equal(e._toast.duration, 5000);
    const i = T.gameAlert('Something', 'info', '', 3000);
    assert.equal(i._toast.duration, 3000);
    const z = T.showNotification('Stays', 'error', '', 0);
    assert.equal(z._toast.duration, 0);
    for (const n of [...children]) { clearTimeout(n._hideTimer); }
});

test('lock refusals: by length, 5 s floor with no hint, 6 s with one, 12 s at most', () => {
    assert.equal(REFUSAL_MIN_MS, 5000);
    assert.equal(lockedHintDuration({}, 4000, 'Requires RFID keycard'), 5000);
    assert.equal(lockedHintDuration({}, 3000, 'Access denied'), 5000);
    const hint = { doorProperties: { lockedHint: 'Ask at reception.' } };
    assert.equal(lockedHintDuration(hint, 4000, 'Requires RFID keycard'), 6000);
    const words = (n) => Array.from({ length: n }, () => 'w').join(' ');
    assert.equal(lockedHintDuration({}, 3000, words(20)), 6000);
    assert.equal(lockedHintDuration({}, 3000, words(80)), 12000);
});

test('signTitle cuts a sign at its first separator and keeps short signs and abbreviations whole', () => {
    assert.equal(signTitle('Server Riser'), 'Server Riser');
    assert.equal(signTitle('Records Office — Authorised Access Only'), 'Records Office');
    assert.equal(signTitle('Admin Office - Authorized Personnel Only'), 'Admin Office');
    assert.equal(signTitle('Director -- M. Sorensen'), 'Director');
    assert.equal(signTitle('Computing: Staff Only'), 'Computing');
    assert.equal(signTitle('Engineering Workshop. Authorised Access Only'), 'Engineering Workshop');
    assert.equal(signTitle('Dr. I. Volkova, CTO'), 'Dr. I. Volkova');
    assert.equal(signTitle('Open-Plan Office'), 'Open-Plan Office');
    assert.equal(signTitle('Kit & Briefing'), 'Kit & Briefing');
    assert.equal(signTitle(''), '');
    assert.equal(signTitle(null), '');
});

test('a sign still over 28 characters after the cut keeps the old title', () => {
    assert.equal(signTitle('BATTERY HALL 2 / INVERTER ROOM — PPE REQUIRED'), '');
    assert.equal(signTitle('A very long sign with no separator anywhere in it'), '');
    assert.equal(signTitle('Twenty-eight characters long'), 'Twenty-eight characters long');
    assert.equal(doorRefusalTitle({ doorProperties: { door_sign: 'A very long sign with no separator anywhere' } }, 'Access Denied'), 'Access Denied');
    assert.equal(doorRefusalTitle({ doorProperties: { door_sign: 'Records Office — Authorised Access Only' } }, 'Door'), 'Records Office');
});

test('doorRefusalTitle: the sign of a door, else the fallback', () => {
    assert.equal(doorRefusalTitle({ doorProperties: { door_sign: 'Server Riser' } }, 'Access Denied'), 'Server Riser');
    assert.equal(doorRefusalTitle({ doorProperties: { door_sign: null } }, 'Access Denied'), 'Access Denied');
    assert.equal(doorRefusalTitle({ scenarioData: { name: 'Safe' } }, 'Access Denied'), 'Access Denied');
    assert.equal(doorRefusalTitle(null, 'Door'), 'Door');
});

test('the door sign titles RFID and gate refusals only (review R2 n8)', () => {
    const u = read('systems/unlock-system.js');
    const titled = u.split('\n').filter(l => l.includes('doorRefusalTitle(lockable'));
    assert.equal(titled.length, 5, 'four RFID refusals and the RFID keycard server refusal');
    const start = u.indexOf("case 'rfid':");
    const end = u.indexOf('default:', start);
    for (const l of titled) {
        const at = u.indexOf(l);
        assert.ok(at > start && at < end, `inside the RFID branch: ${l.trim()}`);
    }
    assert.doesNotMatch(read('systems/minigame-starters.js'), /doorRefusalTitle/);
    assert.match(read('systems/doors.js'), /doorRefusalTitle\(hintSource, 'Door'\)/);
    assert.match(read('systems/door-gates.js'), /g\.doorSign = props\.door_sign/);
});

// Code review R1 m10 (engine feedback changes): a cancelled password pad is the player's own
// act, so it is a short info toast the floor leaves alone; a wrong password is still an error.
test('a cancelled password pad is a 3 s info toast; a wrong password stays an error', () => {
    const src = read('systems/minigame-starters.js');
    const start = src.indexOf('export function startPasswordMinigame');
    const block = src.slice(start, src.indexOf('export function', start + 10));
    assert.match(block, /if \(result\?\.cancelled\) \{\s*window\.gameAlert\(rej\.message, 'info', rej\.title, 3000\);\s*\} else \{\s*window\.gameAlert\(appendLockedHint\(rej\.message, lockable\), 'error', rej\.title, lockedHintDuration\(lockable, 3000, rej\.message\)\);/);
    assert.equal(T.toastDuration('info', 3000), 3000);
    children.length = 0;
    const c = T.gameAlert('Failed to enter correct password.', 'info', 'Password Rejected', 3000);
    assert.equal(c._toast.duration, 3000);
    for (const n of [...children]) { clearTimeout(n._hideTimer); }
});

test('the cloner\'s refusal panel holds 5 s', async () => {
    assert.match(read('minigames/rfid/rfid-minigame.js'), /export const DENIAL_HOLD_MS = 5000;/);
});

// Review R2 n9: the count of timed error toasts on one line. A fixed time under 5 s on one
// is now lifted by notifications.js; this keeps the number honest for the plan.
test('timed error toasts on one line: every literal time is lifted to at least 5 s by the floor', () => {
    const times = [];
    const walk = (dir) => {
        for (const name of readdirSync(dir)) {
            const p = join(dir, name);
            if (statSync(p).isDirectory()) { walk(p); continue; }
            if (!name.endsWith('.js')) continue;
            for (const line of readFileSync(p, 'utf8').split('\n')) {
                const m = line.match(/(gameAlert|showNotification)\??\.?\(.*['"]error['"].*,\s*(\d+)\s*\)/);
                if (m) times.push(Number(m[2]));
            }
        }
    };
    walk(js);
    assert.ok(times.length >= 60, `found ${times.length}`);
    for (const t of times) assert.ok(T.toastDuration('error', t) >= 5000 || t === 0);
});

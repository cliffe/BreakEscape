// The pane of a lock's second step (ops layer S8c unit 18): frame and code.
//
// openPane(ctx) builds ONE DOM layer on document.body, above the minigame container and any pad
// beneath it. It is not a framework scene and never starts a minigame, so the pad that asked for
// the second step stays alive and receives one ordinary answer when the pane settles.
//
// ctx (from systems/lock-step.js): { subject, targetType, targetId, kind, npcId, number, opener,
// fromDoor }. Optional extras a caller may add: { name, ownerName }.
// Returns { done: Promise<'passed'|'denied'|'expired'|'closed'>, close(), getTestState() }.
//
// Keys: while the pane is open one capture listener on `window` takes every keydown, keyup and
// keypress, so digits typed here never reach a PIN pad beneath, and Escape is the pane's own X.
// A pad listens on `document`, so a listener on `window` in the capture phase is the first to see
// the key. It is removed on close. Nothing typed in a field of the pane is blocked: the browser's
// default action (inserting the character) is left alone for keys that land in the layer.
//
// Server and author strings reach the DOM through textContent only.

import { mountPush } from './lock-step-push.js';

const POLL_MS = 400;
const CODE_RE = /^\d{6}$/;
const NOT_AVAILABLE = 'Sign-in is not available.';

let cfg = {};

/**
 * configure({ mfa, setTimer, clearTimer, now, lockName, ownerName, heldDevice, playSound })
 *   mfa            the multi-factor client (verify, readDevice); default window.mfaClient
 *   setTimer(fn, ms) a one-shot timer, as lock-step.js takes it; default setTimeout
 *   clearTimer(h)  default clearTimeout
 *   now()          milliseconds; default Date.now
 *   lockName(ctx)  the lock's display name; default looks in window.gameScenario
 *   ownerName(ctx) the owner's display name; default the NPC manager's record
 *   heldDevice(ctx) { id, name } of the owner's held code_device, or null; default window.inventory
 *   playSound(name) default window.playUISound
 */
export function configure(options = {}) {
    cfg = { ...options };
}

export function reset() {
    cfg = {};
}

const win = () => (typeof window !== 'undefined' ? window : {});

function mfaClient() {
    return cfg.mfa || win().mfaClient || null;
}

function sound(name) {
    try { (cfg.playSound || win().playUISound)?.(name); } catch (e) { /* cosmetic */ }
}

function findObject(list, id) {
    if (!Array.isArray(list)) return null;
    for (const o of list) {
        if (!o || typeof o !== 'object') continue;
        if (o.id === id) return o;
        const inner = findObject(o.contents, id);
        if (inner) return inner;
    }
    return null;
}

// The scenario object with this id, from where a real page holds it (S8c R1-CLIENT2). The page never
// puts a room's objects on gameScenario.rooms[*].objects: core/rooms.js makes sprites in
// window.rooms[room].objects (a map, objectId -> sprite with scenarioData). So, in order:
// (1) the lockable of the pad that is up (the one place a nested object, such as a zip inside a
// computer, is sure to be), (2) every room sprite and what it contains, (3) the held items.
export function findObjectData(w, id) {
    if (!id) return null;
    const m = w.MinigameFramework?.currentMinigame;
    for (const lockable of [m?.params?.lockable, m?.lockable]) {
        const d = lockable?.scenarioData;
        if (d && d.id === id) return d;
    }
    for (const room of Object.values(w.rooms || {})) {
        const objects = room?.objects;
        if (!objects || typeof objects !== 'object') continue;
        for (const sprite of Object.values(objects)) {
            const d = sprite?.scenarioData;
            if (!d) continue;
            if (d.id === id) return d;
            const inner = findObject(d.contents, id);
            if (inner) return inner;
        }
    }
    const items = w.inventory?.items;
    if (Array.isArray(items)) {
        for (const it of items) {
            const d = it && it.scenarioData ? it.scenarioData : it;
            if (d && d.id === id) return d;
        }
    }
    return null;
}

function defaultLockName(ctx) {
    const w = win();
    const id = ctx.targetId;
    if (ctx.targetType === 'door') {
        const room = (w.gameScenario?.rooms || {})[id];
        if (room && typeof room.name === 'string' && room.name) return room.name;
        return typeof id === 'string' && id ? id : 'this door';
    }
    const d = findObjectData(w, id);
    return d && typeof d.name === 'string' && d.name ? d.name : 'this lock';
}

function defaultOwnerName(ctx) {
    const m = win().npcManager;
    const rec = ctx.npcId && m ? (m.getNPC?.(ctx.npcId) || m.npcs?.get?.(ctx.npcId)) : null;
    const name = rec && (rec.displayName || rec.name);
    return typeof name === 'string' && name ? name : (ctx.npcId || 'the owner');
}

function defaultHeldDevice(ctx) {
    const items = win().inventory?.items;
    if (!ctx.npcId || !Array.isArray(items)) return null;
    for (const it of items) {
        const d = it && it.scenarioData ? it.scenarioData : it;
        if (d && d.type === 'code_device' && d.owner === ctx.npcId && d.id != null) {
            return { id: d.id, name: typeof d.name === 'string' && d.name ? d.name : 'code device' };
        }
    }
    return null;
}

function mk(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
}

function retryText(retryIn) {
    if (!Number.isFinite(retryIn) || retryIn <= 0) return ' Try again later.';
    return retryIn >= 90 ? ` Try again in ${Math.ceil(retryIn / 60)} minutes.` : ` Try again in ${Math.ceil(retryIn)} seconds.`;
}

export function openPane(ctx = {}) {
    const w = win();
    const named = (key, fallback) => {
        if (typeof ctx[key] === 'string' && ctx[key]) return ctx[key];
        const f = cfg[key === 'name' ? 'lockName' : 'ownerName'];
        return typeof f === 'function' ? f(ctx) : fallback(ctx);
    };
    const title = named('name', defaultLockName);
    const owner = named('ownerName', defaultOwnerName);
    const heldDevice = typeof cfg.heldDevice === 'function' ? cfg.heldDevice : defaultHeldDevice;
    const setTimer = typeof cfg.setTimer === 'function' ? cfg.setTimer : (fn, ms) => setTimeout(fn, ms);
    const clearTimer = typeof cfg.clearTimer === 'function' ? cfg.clearTimer : (h) => clearTimeout(h);
    const now = typeof cfg.now === 'function' ? cfg.now : () => Date.now();

    // What was open beneath us, noted before the layer exists
    const fw = w.MinigameFramework;
    const beneath = fw?.currentMinigame && !fw.currentMinigame._ending ? fw.currentMinigame : null;
    const pausedWorld = !beneath && typeof w.pauseKeyboardInput === 'function';
    if (pausedWorld) w.pauseKeyboardInput();

    let settled = false;
    let resolveDone;
    const done = new Promise((r) => { resolveDone = r; });
    let timerHandle = null;
    let mountedCleanup = null;

    const layer = mk('div', 'lock-step-layer');
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-label', title);
    const frame = mk('div', 'lock-step-frame');
    const bar = mk('div', 'lock-step-titlebar');
    const titleEl = mk('div', 'lock-step-title', title);
    const closeBtn = mk('button', 'lock-step-x', 'X');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    bar.append(titleEl, closeBtn);
    const body = mk('div', 'lock-step-body');
    const status = mk('div', 'lock-step-message');
    status.setAttribute('role', 'status');
    frame.append(bar, body, status);
    layer.appendChild(frame);

    const lines = [];
    const line = (text, cls) => {
        const n = mk('div', `lock-step-line${cls ? ` ${cls}` : ''}`, text);
        lines.push(n);
        body.appendChild(n);
        return n;
    };
    const say = (text, error) => {
        status.textContent = text || '';
        status.className = `lock-step-message${error ? ' lock-step-error' : ''}`;
    };

    let field = null;
    let verifyBtn = null;
    let deviceBtn = null;
    let deviceNote = null;
    let deviceState = null; // { code, endsAt }
    let busy = false;

    function settle(outcome) {
        if (settled) return;
        settled = true;
        if (timerHandle != null) { try { clearTimer(timerHandle); } catch (e) { /* gone */ } timerHandle = null; }
        w.removeEventListener?.('keydown', onKey, true);
        w.removeEventListener?.('keyup', onKey, true);
        w.removeEventListener?.('keypress', onKey, true);
        try { if (mountedCleanup && typeof mountedCleanup.destroy === 'function') mountedCleanup.destroy(); } catch (e) { /* torn down */ }
        layer.remove();
        if (pausedWorld && typeof w.resumeKeyboardInput === 'function') w.resumeKeyboardInput();
        resolveDone(outcome);
    }

    // ---- keys -------------------------------------------------------------------------------
    function focusables() {
        return [...layer.querySelectorAll('button, input, select, textarea, [tabindex]')]
            .filter((n) => !n.disabled && n.tabIndex >= 0 && !n.closest('[hidden]'));
    }

    function onKey(e) {
        if (settled) return;
        const inLayer = layer.contains(e.target);
        // Nothing reaches a pad, the world or any other listener
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (e.type === 'keydown') {
            if (e.key === 'Escape') { e.preventDefault(); settle('closed'); return; }
            if (e.key === 'Tab') {
                e.preventDefault();
                const list = focusables();
                if (list.length) {
                    const at = list.indexOf(document.activeElement);
                    const next = e.shiftKey ? (at <= 0 ? list.length - 1 : at - 1) : (at + 1) % list.length;
                    list[next].focus();
                }
                return;
            }
            if (e.key === 'Enter' && inLayer && field && e.target === field) { e.preventDefault(); submit(); return; }
        }
        // A key that lands outside the layer must not press a pad's focused button either. A browser key
        // (reload, developer tools, history, a shortcut with Ctrl, Cmd or Alt) keeps its default: the pane
        // stops it reaching the game, not the browser (S8c R1-CLIENT6).
        const browserKey = e.ctrlKey || e.metaKey || e.altKey || /^F\d+$/.test(e.key || '');
        if (!inLayer && !browserKey) e.preventDefault();
    }
    w.addEventListener?.('keydown', onKey, true);
    w.addEventListener?.('keyup', onKey, true);
    w.addEventListener?.('keypress', onKey, true);
    // Defence in depth: nothing typed inside the layer bubbles out of it
    for (const t of ['keydown', 'keyup', 'keypress']) layer.addEventListener(t, (e) => e.stopPropagation());
    // The backdrop takes every click
    for (const t of ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'contextmenu']) {
        layer.addEventListener(t, (e) => { e.stopPropagation(); });
    }
    closeBtn.addEventListener('click', () => settle('closed'));

    // ---- kind: code ---------------------------------------------------------------------------
    async function submit() {
        if (settled || busy || !field) return;
        const client = mfaClient();
        const code = (field.value || '').trim();
        if (!client || typeof client.verify !== 'function') { say(NOT_AVAILABLE, true); return; }
        if (!CODE_RE.test(code)) { say('Enter the six-digit code.', true); return; }
        say('Checking...');
        busy = true;
        verifyBtn.disabled = true;
        let result;
        try {
            result = await client.verify(ctx.subject, code);
        } catch (e) {
            result = { ok: false, reason: 'error' };
        }
        busy = false;
        if (settled) return;
        verifyBtn.disabled = false;
        if (result && result.ok && result.passed) { settle('passed'); return; }
        const reason = result && result.reason;
        if (reason === 'expired' || reason === 'gone') { sound('reject'); settle('expired'); return; }
        if (reason === 'cancelled') { sound('reject'); settle('denied'); return; }
        if (reason === 'wrong') {
            sound('reject');
            say('Incorrect code', true);
        } else if (reason === 'stale') {
            sound('reject');
            say(result.stale === 'used' ? 'That code has been used. Wait for the next one.' : 'That code has expired.', true);
        } else if (reason === 'locked') {
            sound('reject');
            say(`Too many wrong codes.${retryText(result.retryIn)}`, true);
        } else {
            sound('reject');
            say(reason === 'error' ? 'Could not check the code. Try again.' : 'That did not work. Try again.', true);
        }
        field.value = '';
        field.focus?.();
    }

    function drawDevice() {
        if (!deviceNote || !deviceBtn) return;
        if (!deviceState) { deviceBtn.textContent = 'Read code'; return; }
        const left = Math.max(0, Math.ceil((deviceState.endsAt - now()) / 1000));
        if (left <= 0) {
            deviceState = null;
            deviceNote.textContent = 'That code has rolled over. Read it again.';
            deviceBtn.textContent = 'Read code';
            return;
        }
        deviceNote.textContent = `${deviceState.code}  (${left}s left)`;
        deviceBtn.textContent = 'Use this code';
    }

    async function onDeviceButton(device) {
        if (settled || busy) return;
        if (deviceState) {
            // A second click fills the field; it is never submitted for the player
            field.value = deviceState.code;
            field.focus?.();
            return;
        }
        const client = mfaClient();
        if (!client || typeof client.readDevice !== 'function') { deviceNote.textContent = 'This device shows nothing.'; return; }
        busy = true;
        let res;
        try {
            res = await client.readDevice({ itemId: device.id });
        } catch (e) {
            res = { ok: false };
        }
        busy = false;
        if (settled) return;
        if (!res || !res.ok) { deviceNote.textContent = 'This device shows nothing.'; return; }
        if (res.enrolled === false) { deviceNote.textContent = 'No longer in use'; return; }
        if (res.used) { deviceNote.textContent = 'Wait for the next code'; return; }
        if (typeof res.code !== 'string' || !CODE_RE.test(res.code)) { deviceNote.textContent = 'This device shows nothing.'; return; }
        const left = Number.isFinite(res.secondsLeft) ? Math.max(0, res.secondsLeft) : 60;
        deviceState = { code: res.code, endsAt: now() + left * 1000 };
        drawDevice();
    }

    function buildCode() {
        line(`Enter the code from ${owner}'s device.`, 'lock-step-help');
        const device = heldDevice(ctx);
        if (device) {
            const strip = mk('div', 'lock-step-device');
            strip.appendChild(mk('div', 'lock-step-device-name', device.name));
            deviceNote = mk('div', 'lock-step-device-note');
            deviceBtn = mk('button', 'lock-step-btn lock-step-read', 'Read code');
            deviceBtn.type = 'button';
            deviceBtn.addEventListener('click', () => onDeviceButton(device));
            strip.append(deviceNote, deviceBtn);
            body.appendChild(strip);
        }
        const row = mk('div', 'lock-step-row');
        const label = mk('label', null, 'Code:');
        label.htmlFor = 'lock-step-code';
        field = mk('input', 'lock-step-field');
        field.type = 'text';
        field.id = 'lock-step-code';
        field.inputMode = 'numeric';
        field.maxLength = 6;
        field.autocomplete = 'off';
        field.spellcheck = false;
        field.placeholder = '000000';
        field.setAttribute('aria-label', 'Six-digit code');
        field.addEventListener('input', () => {
            const digits = field.value.replace(/\D/g, '').slice(0, 6);
            if (digits !== field.value) field.value = digits;
        });
        row.append(label, field);
        body.appendChild(row);
        verifyBtn = mk('button', 'lock-step-btn lock-step-verify', 'Verify');
        verifyBtn.type = 'button';
        verifyBtn.addEventListener('click', () => submit());
        body.appendChild(verifyBtn);
    }

    if (ctx.kind === 'code') {
        buildCode();
    } else {
        const host = mk('div', 'lock-step-push-host');
        body.appendChild(host);
        const settleFromPart = (outcome) => settle(outcome === 'passed' || outcome === 'denied' || outcome === 'expired' ? outcome : 'closed');
        try {
            mountedCleanup = mountPush(host, { ...ctx, name: title, lockName: title, ownerName: owner, mfa: mfaClient(), setTimer }, settleFromPart);
        } catch (e) {
            say('This second step is not available.', true);
        }
    }

    // ---- watch: knocked out, or the pad beneath has gone --------------------------------------
    function tick() {
        timerHandle = null;
        if (settled) return;
        const out = typeof w.playerIsKnockedOut === 'function' && w.playerIsKnockedOut() === true;
        const padGone = beneath && (w.MinigameFramework?.currentMinigame !== beneath || beneath._ending === true);
        if (out || padGone) { settle('closed'); return; }
        if (deviceState) drawDevice();
        timerHandle = setTimer(tick, POLL_MS);
    }
    timerHandle = setTimer(tick, POLL_MS);

    document.body.appendChild(layer);
    (field || closeBtn).focus?.();

    function getTestState() {
        const controls = [...layer.querySelectorAll('button')].map((b) => ({ label: b.textContent, disabled: !!b.disabled }));
        const fields = [...layer.querySelectorAll('input')].map((i) => ({ id: i.id, value: i.value, maxLength: i.maxLength }));
        return {
            open: !settled,
            kind: ctx.kind,
            title,
            lines: [...lines.map((n) => n.textContent), ...(deviceNote && deviceNote.textContent ? [deviceNote.textContent] : []),
                ...(status.textContent ? [status.textContent] : [])],
            fields,
            controls
        };
    }

    return { done, close: () => settle('closed'), getTestState };
}

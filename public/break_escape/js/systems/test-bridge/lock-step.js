/**
 * window.__test.lockStep: the pane of a lock's second step (ui/lock-step-pane.js), read and driven
 * the way a player drives it. Nothing here calls the server or the lock-step core: every move is a
 * real click or key event on the pane's own controls.
 *
 *   state()          the open pane's own getTestState() ({ open, kind, title, lines, fields,
 *                    controls }) plus `text`, everything the pane shows (the push part's lines and
 *                    number buttons included); `{ open: false }` with no pane open.
 *   click(label)     clicks the pane's button with that label (exact, ignoring case and spaces);
 *                    throws when there is none or it is disabled.
 *   type(text, opts) types into the code field, one key at a time; { enter: true } then presses
 *                    Enter in the field, as a player does.
 *   close()          clicks the pane's X.
 *
 * All JSON in and out.
 */

import { clickElement, typeInto, sleep } from './input.js';

const LAYER = '.lock-step-layer';
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

function layer() {
    return typeof document === 'undefined' ? null : document.querySelector(LAYER);
}

function need() {
    const el = layer();
    if (!el) throw new Error('lockStep: no second-step pane is open');
    return el;
}

function state() {
    const el = layer();
    const own = window.lockStep?.paneState?.();
    if (!el || !own) return { open: false };
    return JSON.parse(JSON.stringify({ ...own, text: (el.textContent || '').replace(/\s+/g, ' ').trim() }));
}

function click(label) {
    const el = need();
    const want = norm(label);
    const btn = [...el.querySelectorAll('button')].find((b) => norm(b.textContent) === want || norm(b.getAttribute('aria-label')) === want);
    if (!btn) {
        const have = [...el.querySelectorAll('button')].map((b) => b.textContent);
        throw new Error(`lockStep: no button "${label}" (have: ${have.join(', ')})`);
    }
    if (btn.disabled) throw new Error(`lockStep: button "${label}" is disabled`);
    clickElement(btn);
    return { ok: true };
}

async function type(text, { enter = false } = {}) {
    const el = need();
    const field = el.querySelector('input');
    if (!field) throw new Error('lockStep: the pane has no field to type in');
    await typeInto(field, text);
    if (enter) {
        const init = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
        field.dispatchEvent(new KeyboardEvent('keydown', init));
        field.dispatchEvent(new KeyboardEvent('keyup', init));
        await sleep(0);
    }
    return { ok: true };
}

function close() {
    return click('close');
}

export const lockStepBridge = { state, click, type, close };

import { displayDashes } from '../../utils/display-dashes.js';
/**
 * test-bridge/minigames.js — the __test.minigame namespace.
 *
 * Minigames in this game are DOM overlays (see minigames/framework/), so
 * "simulate real input" here means dispatching real click / key / input events
 * at the same elements a human clicks. Nothing in this file calls a minigame's
 * methods directly — no `minigame.selectChoice(2)`, no `complete(true)`.
 *
 * State comes from MinigameScene.getTestState(), which every minigame inherits
 * and the busier ones override. Adding a new minigame needs no change here.
 */

import { clickElement, typeInto, keyDown, keyUp, sleepFrames, sleep } from './input.js';
import { logAction } from './log.js';
import { activeMinigameSummary } from './state.js';

function current() {
    return window.MinigameFramework?.currentMinigame || null;
}

/**
 * A failure result. The `extra` fields are the diagnostic — the choices that
 * were actually on screen, the pattern that missed, what matched ambiguously.
 * A bare reason string is not enough to fix a broken trace, so always pass them.
 */
function fail(reason, extra = {}) {
    return { ok: false, reason, ...extra };
}

export const minigameBridge = {
    /** Is any minigame overlay open right now? */
    isActive() {
        const mg = current();
        return !!mg && !!mg.gameState?.isActive;
    },

    /** Which one, as { id, type, title, isActive } — or null. */
    which() {
        return activeMinigameSummary();
    },

    /**
     * One-call state for the open minigame. Shape varies by minigame; every
     * one guarantees { available, isActive, isComplete, text, controls, fields }
     * from the base class, plus whatever that minigame adds.
     */
    getState() {
        const mg = current();
        if (!mg) return { available: false, reason: 'no-active-minigame' };
        try {
            const state = mg.getTestState ? mg.getTestState() : { available: false, reason: 'no-getTestState' };
            return { ...activeMinigameSummary(), ...state };
        } catch (err) {
            return { available: false, reason: 'getTestState-threw', error: String(err) };
        }
    },

    /** Click a control by its index in getState().controls. */
    async clickControl(indexOrLabel) {
        const mg = current();
        if (!mg) return fail('no-active-minigame');
        const buttons = Array.from(mg.container.querySelectorAll(
            'button, [role="button"], a[href], .clickable, input[type="button"], input[type="submit"]'
        )).filter(el => el.offsetParent !== null);
        // Indices shift as a minigame re-renders, so allow a label too — a
        // caller that means "the SUBMIT button" should be able to say so.
        let el;
        if (typeof indexOrLabel === 'number') {
            el = buttons[indexOrLabel];
        } else {
            const needle = String(indexOrLabel).toLowerCase();
            el = buttons.find(b => (b.innerText || b.value || '').trim().toLowerCase().includes(needle));
        }
        const index = buttons.indexOf(el);
        if (!el) {
            return fail(`no-control-matching:${indexOrLabel}`, {
                available: buttons.map((b, i) => ({ index: i, label: (b.innerText || b.value || '').trim() }))
            });
        }
        const label = (el.innerText || el.value || '').trim();
        clickElement(el);
        await sleepFrames(2);
        const result = { ok: true, clicked: label };
        logAction('minigame.clickControl', { index, label }, result);
        return result;
    },

    /** Click the first visible control whose label contains `text`. */
    async clickText(text, { exact = false } = {}) {
        const mg = current();
        if (!mg) return fail('no-active-minigame');
        const needle = String(text).toLowerCase();
        // Not every clickable thing in a minigame is a <button>. Phone contact
        // lists, inventory rows and menu entries are plain divs with click
        // handlers, and omitting them made whole minigames undriveable.
        const el = Array.from(mg.container.querySelectorAll(
            'button, [role="button"], a[href], .clickable, .contact-item, [data-npc-id], li'
        )).filter(e => e.offsetParent !== null).find(e => {
            const label = (e.innerText || e.value || '').trim().toLowerCase();
            return exact ? label === needle : label.includes(needle);
        });
        if (!el) return fail(`no-control-matching:${text}`);
        clickElement(el);
        await sleepFrames(2);
        const result = { ok: true, clicked: (el.innerText || '').trim() };
        logAction('minigame.clickText', { text }, result);
        return result;
    },

    /** Click by CSS selector, scoped to the overlay. */
    async clickSelector(selector) {
        const mg = current();
        if (!mg) return fail('no-active-minigame');
        const el = mg.container.querySelector(selector);
        if (!el) return fail(`no-element-matching:${selector}`);
        clickElement(el);
        await sleepFrames(2);
        const result = { ok: true, selector };
        logAction('minigame.clickSelector', { selector }, result);
        return result;
    },

    /**
     * Type into a field by its index in getState().fields.
     * `submit: true` follows with an Enter keypress on the field.
     */
    async type(index, text, { submit = false, clear = true } = {}) {
        const mg = current();
        if (!mg) return fail('no-active-minigame');
        const fields = Array.from(mg.container.querySelectorAll(
            'input:not([type="button"]):not([type="submit"]), textarea, select'
        )).filter(el => el.offsetParent !== null);
        const el = fields[index];
        if (!el) return fail(`no-field-at-index-${index}`);
        if (clear) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
        await typeInto(el, text);
        let submittedVia = null;
        if (submit) {
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            submittedVia = 'enter';
            await sleepFrames(2);
            // Several minigames — flag stations among them — bind a button and
            // ignore Enter entirely, so submit:true silently did nothing and the
            // caller saw a typed value that was never sent. Click the button too.
            if (mg.container.contains(el) && el.value === text) {
                const btn = Array.from(mg.container.querySelectorAll('button, input[type="submit"], .clickable'))
                    .filter(b => b.offsetParent !== null)
                    .find(b => /submit|confirm|enter|send|unlock|verify|ok\b/i.test((b.innerText || b.value || '')));
                if (btn) { clickElement(btn); submittedVia = 'button:' + (btn.innerText || btn.value || '').trim(); }
            }
        }
        await sleepFrames(2);
        const result = { ok: true, typed: text, submit, submittedVia };
        logAction('minigame.type', { index, text, submit, submittedVia }, result);
        return result;
    },

    /**
     * Take an item from an open container, by name (substring, case-insensitive)
     * or by index into getState().items.
     *
     * Clicks the real element, whichever markup the container uses
     * (`.container-content-item` for bins and safes, `.desktop-icon` for PCs),
     * so a caller never has to know which.
     *
     * Some items open a viewer on top of the container (notes, text files).
     * The result says which happened: `openedViewer` is the id of the minigame
     * now on top, or null if the item just went into the inventory. Closing
     * that viewer returns to the container — see `returnsToContainer`.
     */
    async take(nameOrIndex) {
        const mg = current();
        if (!mg) return fail('no-active-minigame');

        const nodes = Array.from(
            mg.container.querySelectorAll('.container-content-item, .desktop-icon')
        ).filter(el => el.offsetParent !== null);
        if (!nodes.length) return fail('no-takeable-items', { active: activeMinigameSummary() });

        const labelOf = (el) => (el.title || el.alt ||
            el.querySelector('.desktop-icon-label')?.textContent || '').trim();

        let el;
        if (typeof nameOrIndex === 'number') {
            el = nodes[nameOrIndex];
            if (!el) return fail(`no-item-at-index:${nameOrIndex}`, { items: nodes.map(labelOf) });
        } else {
            const needle = String(nameOrIndex).toLowerCase();
            // Labels are shown with display dashes, so accept the author's " -- " form too.
            const needleShown = displayDashes(needle);
            const matches = nodes.filter(n => { const l = labelOf(n).toLowerCase(); return l.includes(needle) || l.includes(needleShown); });
            if (!matches.length) return fail(`no-item-matching:${nameOrIndex}`, { items: nodes.map(labelOf) });
            if (matches.length > 1) {
                return fail('item-ambiguous', {
                    pattern: String(nameOrIndex), matched: matches.map(labelOf),
                    hint: 'Use a longer substring, or the index from getState().items.'
                });
            }
            el = matches[0];
        }

        const before = activeMinigameSummary()?.id ?? null;
        const name = labelOf(el);
        clickElement(el);
        await sleepFrames(4);

        const after = activeMinigameSummary()?.id ?? null;
        const result = {
            ok: true,
            took: name,
            openedViewer: after && after !== before ? after : null,
            returnsToContainer: !!window.pendingContainerReturn
        };
        logAction('minigame.take', { nameOrIndex }, result);
        return result;
    },

    /**
     * Send a key to the minigame. Dispatched on document (bubbling to window),
     * which is where minigames bind their keyboard handlers — person-chat uses
     * space to continue and 1-9 to pick a dialogue choice, and the base class
     * uses Escape to close.
     */
    async pressKey(key, { holdMs = 60 } = {}) {
        if (!current()) return fail('no-active-minigame');
        keyDown(key);
        await sleep(holdMs);
        keyUp(key);
        await sleepFrames(2);
        const result = { ok: true, key };
        logAction('minigame.pressKey', { key }, result);
        return result;
    },

    /**
     * Click inside a minigame's OWN nested Phaser canvas, in canvas pixels.
     *
     * A few minigames (lockpicking) render into a nested Phaser.Game rather
     * than DOM, so clickText/clickControl have nothing to act on. This
     * dispatches the same real mouse events at that canvas, scaled from its
     * displayed size to its internal resolution — the nested game's own input
     * handlers then run exactly as for a human click.
     *
     * Coordinates come from the minigame's getTestState() (e.g. `keyTarget`),
     * not from guessing pixels.
     */
    async clickCanvas(x, y, { holdMs = 60 } = {}) {
        const mg = current();
        if (!mg) return fail('no-active-minigame');

        const canvas = mg.game?.canvas || mg.container?.querySelector('canvas');
        if (!canvas) return fail('minigame-has-no-canvas');

        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return fail('minigame-canvas-not-visible');

        // Canvas pixels -> viewport coordinates.
        const clientX = rect.left + (x / canvas.width) * rect.width;
        const clientY = rect.top + (y / canvas.height) * rect.height;

        const init = (buttons) => ({
            pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons,
            clientX, clientY, screenX: clientX, screenY: clientY,
            pageX: clientX + window.scrollX, pageY: clientY + window.scrollY,
            bubbles: true, cancelable: true, composed: true
        });

        // Phaser binds mousedown/mouseup, not pointerdown — send both, as
        // clickWorld does for the main canvas.
        canvas.dispatchEvent(new PointerEvent('pointermove', init(0)));
        canvas.dispatchEvent(new MouseEvent('mousemove', init(0)));
        await sleepFrames(1);
        canvas.dispatchEvent(new PointerEvent('pointerdown', init(1)));
        canvas.dispatchEvent(new MouseEvent('mousedown', init(1)));
        await sleep(holdMs);
        canvas.dispatchEvent(new PointerEvent('pointerup', init(0)));
        canvas.dispatchEvent(new MouseEvent('mouseup', init(0)));
        await sleepFrames(2);

        const result = { ok: true, canvas: { x, y }, client: { x: Math.round(clientX), y: Math.round(clientY) } };
        logAction('minigame.clickCanvas', { x, y }, result);
        return result;
    },

    /**
     * Drag a pointer along a path over an element in the overlay, with real
     * pointer events (pointerdown, a pointermove per point, pointerup).
     *
     * `points` are [{x, y}] or [x, y] pairs. For a <canvas> they are in the
     * canvas's own pixels (so a 128x128 work surface takes 0..127); for any
     * other element they are CSS pixels from its top-left. Each point is held
     * for `stepMs` so a minigame that samples on a timer sees the movement.
     * Mouse, touch and pen are all just pointers here: pass `pointerType` to
     * check that a minigame treats them alike.
     */
    async drag(selector, points, { stepMs = 16, pointerType = 'mouse' } = {}) {
        const mg = current();
        if (!mg) return fail('no-active-minigame');
        const el = mg.container.querySelector(selector);
        if (!el) return fail(`no-element-matching:${selector}`);
        const pts = (points || []).map(p => Array.isArray(p) ? { x: p[0], y: p[1] } : p);
        if (pts.length < 2) return fail('drag-needs-at-least-two-points');
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return fail('element-not-visible', { selector });
        const sx = el.tagName === 'CANVAS' && el.width ? rect.width / el.width : 1;
        const sy = el.tagName === 'CANVAS' && el.height ? rect.height / el.height : 1;
        const toClient = (p) => ({ clientX: rect.left + p.x * sx, clientY: rect.top + p.y * sy });
        const init = (p, buttons) => ({
            pointerId: 7, pointerType, isPrimary: true, button: 0, buttons,
            ...toClient(p), bubbles: true, cancelable: true, composed: true
        });
        el.dispatchEvent(new PointerEvent('pointermove', init(pts[0], 0)));
        el.dispatchEvent(new PointerEvent('pointerdown', init(pts[0], 1)));
        await sleep(stepMs);
        for (let i = 1; i < pts.length; i++) {
            el.dispatchEvent(new PointerEvent('pointermove', init(pts[i], 1)));
            await sleep(stepMs);
        }
        el.dispatchEvent(new PointerEvent('pointerup', init(pts[pts.length - 1], 0)));
        await sleepFrames(2);
        const result = { ok: true, selector, points: pts.length, pointerType };
        logAction('minigame.drag', { selector, points: pts.length, stepMs, pointerType }, result);
        return result;
    },

    /**
     * ── THE SECOND DOCUMENTED EXCEPTION ──────────────────────────────────────
     *
     * Complete an open lockpicking minigame in PICK mode, without performing
     * the pick.
     *
     * Why this is allowed, when nothing else in this bridge is: picking is a
     * pure dexterity mechanic. Whether a pin sets is conveyed only by pixels
     * and feel, so an agent cannot perceive it, let alone perform it. It is the
     * one place where "can a machine do this" and "does the game work" come
     * apart entirely — the manual skill is the content, and it is not what a
     * scenario playtest is testing. Compare `moveTo`'s exception: skip the
     * input that cannot be expressed, keep every consequence.
     *
     * What it deliberately does NOT skip:
     *   - The lock must already have opened in pick mode, which means the game
     *     itself already decided this lock is pickable here and now.
     *   - The player must actually be carrying a lockpick kit. That is checked
     *     against inventory using the same test as unlock-system.js, not
     *     assumed from the minigame being open.
     *   - keyMode is refused outright: a key lock is a single clickCanvas on
     *     `keyTarget` and must be driven properly.
     *   - Completion goes through the minigame's own complete(true), which is
     *     exactly what a successful pick calls. So the unlock, the server
     *     notification, rewards, objectives and any watching NPC all run
     *     identically to a real pick.
     *
     * Never widen this into a generic forceComplete()/succeed() for other
     * minigames. Every other minigame in this game is drivable through real
     * input, and a general escape hatch would quietly stop testing them.
     *
     * Report a step cleared this way as PASS (assisted), never a plain PASS:
     * it verifies the unlock consequences, and nothing about the pick itself.
     */
    async completeLockpick({ reason = 'dexterity minigame not machine-playable' } = {}) {
        const mg = current();
        if (!mg) return fail('no-active-minigame');

        // Dev-only, like the rest of the bridge. Belt and braces: the module is
        // never imported in production, but state this locally too.
        if (window.breakEscapeConfig && window.breakEscapeConfig.testBridge !== true) {
            return fail('test-bridge-disabled');
        }

        const state = typeof mg.getTestState === 'function' ? mg.getTestState() : {};
        if (!state.nestedCanvas || typeof mg.keyMode === 'undefined') {
            return fail('not-the-lockpicking-minigame', { active: activeMinigameSummary() });
        }
        if (mg.keyMode) {
            return fail('lock-is-in-key-mode', {
                keyTarget: state.keyTarget,
                hint: 'A key lock is one clickCanvas(keyTarget.x, keyTarget.y) — drive it properly rather than skipping it.'
            });
        }

        // Same possession test as systems/unlock-system.js. If the player is
        // not carrying picks, this lock is not theirs to open.
        const hasLockpick = (window.inventory?.items || []).some(
            item => item?.scenarioData?.type === 'lockpick'
        );
        if (!hasLockpick) {
            return fail('no-lockpick-in-inventory', {
                hint: 'The player is not carrying a lockpick kit, so a real player could not pick this either.'
            });
        }

        // The same call a successful pick makes — everything downstream runs.
        mg.complete(true);
        await sleepFrames(3);

        const result = {
            ok: true,
            assisted: true,
            lockable: state.lockableName ?? null,
            reason,
            stillOpen: !!current()
        };
        logAction('minigame.completeLockpick', { reason }, result);
        return result;
    },

    /**
     * Close the overlay the way a player does — the × button if present,
     * otherwise the Escape key the base class listens for. Deliberately does
     * NOT call complete()/endMinigame(), so a minigame that refuses to close
     * (disableClose cutscenes) correctly stays open.
     */
    async close() {
        const mg = current();
        if (!mg) return fail('no-active-minigame');
        // The reopen isn't next-frame: notes/text-file/phone viewers reopen
        // their parent container via a real `setTimeout(..., 100)` in their
        // own onComplete (see notes-minigame.js), fired from the CLOSE flow,
        // not from a rendered frame. window.pendingContainerReturn being set
        // now is the signal a reopen is coming, so wait on wall-clock time
        // for it rather than a fixed frame count that can — and, confirmed
        // in an m01 playtest run, did — read `returnedToContainer:false`
        // while the container was mid-reopen and showed up active on the
        // very next unrelated getState() a moment later.
        const willReturnToContainer = !!window.pendingContainerReturn;
        const closeBtn = mg.container.querySelector('.minigame-close-button');
        if (closeBtn && closeBtn.offsetParent !== null) {
            clickElement(closeBtn);
        } else {
            keyDown('Escape');
            await sleep(50);
            keyUp('Escape');
        }
        await sleepFrames(6);
        if (willReturnToContainer) {
            const deadline = performance.now() + 500;
            while (performance.now() < deadline) {
                const summary = activeMinigameSummary();
                if (summary?.id === 'container') break;
                await sleep(20);
            }
        }
        const now = activeMinigameSummary();
        const result = {
            ok: true,
            stillOpen: !!current(),
            // Closing a viewer opened from a container lands back IN that
            // container rather than the overworld. Say so explicitly.
            nowActive: now?.id ?? null,
            returnedToContainer: !!now && now.id === 'container'
        };
        logAction('minigame.close', {}, result);
        return result;
    },

    // ── Dialogue convenience ────────────────────────────────────────────────
    // person-chat is by far the most-driven minigame, so its actions get
    // first-class names. All of them are plain key/click dispatches, exactly
    // what a player would press.

    /** Advance dialogue one line (spacebar, as the UI hint says). */
    async continue_() {
        return this.pressKey(' ');
    },

    /**
     * Pick a dialogue choice.
     *
     *   choose(2)                          — by 1-based on-screen number
     *   choose("^I'm the security")        — by regular expression (preferred)
     *
     * Prefer the pattern form in recorded traces. An index silently selects a
     * different line when the Ink is edited or when a conditional option
     * appears above it; a pattern turns that same edit into a loud, specific
     * failure naming the choices that were actually on screen.
     */
    async choose(selector, opts) {
        if (typeof selector === 'number') return this.chooseIndex(selector);
        return this.chooseMatching(selector, opts);
    },

    /** Pick by 1-based on-screen number. Fragile across dialogue edits. */
    async chooseIndex(n) {
        const choices = this.getState()?.dialogue?.choices || [];
        if (!choices.length) return fail('no-choices-visible');
        if (n < 1 || n > choices.length) {
            return fail(`choice-out-of-range:${n}/${choices.length}`, {
                choices: choices.map(c => `${c.number}. ${c.text}`)
            });
        }
        return this._pick(n - 1, choices);
    },

    /**
     * Pick the one choice whose text matches `pattern` (a regular expression,
     * case-insensitive by default).
     *
     * Deliberately strict in both directions:
     *   - no match      → fails, listing the choices that WERE on screen
     *   - several match → fails as ambiguous, rather than taking the first
     *
     * The second case matters as much as the first: a pattern that starts
     * matching two options after a rewrite would otherwise pick one silently,
     * which is exactly the wrong-path bug the pattern form exists to prevent.
     * Pass `{ allowMultiple: true }` to take the first match on purpose.
     *
     * Choice text is normalised before matching — leading "1." labels stripped,
     * whitespace collapsed, and typographic quotes/dashes/ellipses folded to
     * ASCII. That absorbs cosmetic churn from editors without hiding an actual
     * rewrite, which still fails.
     */
    async chooseMatching(pattern, { flags = 'i', allowMultiple = false } = {}) {
        const choices = this.getState()?.dialogue?.choices || [];
        if (!choices.length) return fail('no-choices-visible');

        let re;
        try {
            re = pattern instanceof RegExp ? pattern : new RegExp(String(pattern), flags);
        } catch (err) {
            return fail('bad-pattern', { pattern: String(pattern), error: String(err) });
        }

        const onScreen = choices.map(c => `${c.number}. ${c.text}`);
        const matches = choices.filter(c => re.test(normaliseChoiceText(c.text)));

        if (!matches.length) {
            return fail('choice-no-match', {
                pattern: String(re), choices: onScreen,
                hint: 'The dialogue may have been rewritten. Update the pattern, or fix the Ink if the option should still exist.'
            });
        }
        if (matches.length > 1 && !allowMultiple) {
            return fail('choice-ambiguous', {
                pattern: String(re),
                matched: matches.map(c => `${c.number}. ${c.text}`),
                choices: onScreen,
                hint: 'Tighten the pattern (anchor it with ^), or pass { allowMultiple: true } if taking the first is intended.'
            });
        }

        const chosen = matches[0];
        const result = await this._pick(chosen.index, choices);
        return result.ok
            ? { ...result, matchedPattern: String(re), chose: chosen.text, number: chosen.number }
            : result;
    },

    /**
     * Dispatch the actual selection. Number keys 1-9 are the documented
     * shortcut and cover almost every case; beyond nine there is no key, so
     * click the button element instead — still a real click on the real
     * control, not a call into the minigame.
     */
    async _pick(index, choices) {
        if (index < 9) return this.pressKey(String(index + 1));
        const mg = current();
        const buttons = mg?.ui?.getChoiceButtons?.() || [];
        const el = buttons[index];
        if (!el) return fail(`no-choice-button-at-index:${index}`, { count: choices.length });
        clickElement(el);
        await sleepFrames(2);
        return { ok: true, index };
    },

    /**
     * Assert the current speaker line matches `pattern`, without acting.
     * Use it in a recorded trace to catch a rewrite that changes what an NPC
     * says while leaving the choice list intact.
     */
    matchDialogue(pattern, { flags = 'i' } = {}) {
        const d = this.getState()?.dialogue;
        if (!d) return fail('no-dialogue');
        let re;
        try {
            re = pattern instanceof RegExp ? pattern : new RegExp(String(pattern), flags);
        } catch (err) {
            return fail('bad-pattern', { pattern: String(pattern), error: String(err) });
        }
        const text = normaliseChoiceText(d.text);
        return re.test(text)
            ? { ok: true, matchedPattern: String(re), speaker: d.speaker }
            : fail('dialogue-no-match', { pattern: String(re), speaker: d.speaker, text: d.text });
    }
};

/**
 * Fold cosmetic variation so a pattern doesn't break on an editor's smart
 * quotes, while a genuine rewrite still fails to match.
 */
function normaliseChoiceText(text) {
    return String(text || '')
        .replace(/^\s*\d+[.)]\s*/, '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/\s+/g, ' ')
        .trim();
}

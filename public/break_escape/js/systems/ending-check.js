/**
 * The ending warning: before a story's ending fires, tell the player which
 * optional objectives are still open, and let them end the mission now or keep going.
 *
 * Every ending trigger asks this one module (confirmEnding):
 *   - the ink tag `# ending_check` inside a choice's brackets (`+ [Walk me through it. #ending_check]`):
 *     the chat asks before the choice is taken (chat-helpers.js confirmEndingBeforeChoice), and
 *     "Keep going" leaves the story where it was, with the same choices on screen. This is the
 *     placement for a debrief that is the conversation itself.
 *   - the ink tag `# ending_check` after the brackets (chat-helpers.js), put first in the
 *     choice that starts the debrief. "Keep going" skips the rest of that line's tags, so a
 *     `# set_global:start_debrief_cutscene:true` after it never runs and the debrief does not
 *     start. This is the warning that comes in time for a one-shot debrief.
 *   - the credits trigger, a music event carrying `credits` (music/scenario-music-events.js),
 *     before the ending music and the conclude request.
 *   - the last task of a missionConclusion aim (systems/objectives-manager.js completeTask),
 *     before the task is posted to the server (which would conclude the mission).
 *
 * Never shown when:
 *   - no optional objective is open (a locked one is hidden from the player, so it is not
 *     listed and does not count);
 *   - mission.json says "endingCheck": false (breakEscapeConfig.endingCheck === false);
 *   - the game had already concluded when the page loaded (a replayed ending);
 *   - the player already chose "End the mission now" for these objectives (a second trigger
 *     of the same ending, say the tag and then the credits, does not ask twice), or agreed in
 *     dialogue (`# ending_confirmed`). Both are saved, so a reload does not ask again.
 *
 * "Keep going" from a late trigger (credits, aim) leaves the ending held: a button on the
 * objectives panel ends the mission, and it ends by itself once nothing optional is open.
 * Nothing in the story has to fire again.
 *
 * Exposed as window.endingCheck for the modules that have no imports of their own.
 */
import { displayDashes } from '../utils/display-dashes.js';

export const ENDING_CHECK_ID = 'ending-check-overlay';
export const HEADING = 'Before the mission ends';
export const END_LABEL = 'End the mission now';
export const KEEP_LABEL = 'Keep going';
export const PANEL_BUTTON_LABEL = 'End the mission';

const win = () => (typeof window !== 'undefined' ? window : null);

/** The sentence above the list: "You have done what the mission needs. 2 optional objectives are still open:". */
export function introText(count) {
    const noun = count === 1 ? '1 optional objective is still open' : `${count} optional objectives are still open`;
    return `You have done what the mission needs. ${noun}:`;
}

/**
 * Optional objectives the player can see and has not settled: tasks with optional === true
 * (or in an aim with optional === true)
 * whose status is active, in an aim that is active or completed. A locked task or aim is hidden from
 * the player, so naming it would give the story away. Returns [{ taskId, title }].
 */
export function openOptionalObjectives(manager = win()?.objectivesManager) {
    const aims = Array.isArray(manager?.aims) ? manager.aims : [];
    const open = [];
    for (const aim of aims) {
        if (!aim || (aim.status !== 'active' && aim.status !== 'completed')) continue;
        for (const task of aim.tasks || []) {
            if (task && (task.optional === true || aim.optional === true) && task.status === 'active') {
                open.push({ taskId: task.taskId, title: String(task.title || task.taskId) });
            }
        }
    }
    return open;
}

/** Whether the warning applies to this game at all (not the opt-out, not a replayed ending). */
export function endingCheckEnabled(config = win()?.breakEscapeConfig) {
    if (config?.endingCheck === false) return false;
    if (config?.missionConcludedAt) return false;
    return true;
}

const confirmed = new Set();   // task ids the player has agreed to leave open (this session)
// ...and the same ids kept in the saved globals, so a reload between the agreement and the
// credits does not ask again (PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md 8b, review R2 n13).
// Written by every "End the mission now", by a held ending that runs and by the ink tag
// `# ending_confirmed`; a non-declared global, persisted with globalVariables like
// `__ending_held` and never synced into ink.
const CONFIRMED_GLOBAL = '__ending_confirmed';

function savedConfirmed() {
    const list = win()?.gameState?.globalVariables?.[CONFIRMED_GLOBAL];
    return Array.isArray(list) ? list : [];
}

function isConfirmed(taskId) {
    return confirmed.has(taskId) || savedConfirmed().includes(taskId);
}

/** Record that the player agreed to leave these task ids open, in memory and in the saved globals. */
function confirmTasks(ids) {
    ids.forEach((id) => confirmed.add(id));
    const g = win()?.gameState?.globalVariables;
    if (!g) return;
    const all = new Set([...savedConfirmed(), ...ids]);
    g[CONFIRMED_GLOBAL] = [...all];
}

/**
 * The ink tag `# ending_confirmed`: the player has agreed in dialogue to leave the optional
 * objectives that are open now (a debrief that asks in its own words). Later triggers of the
 * ending (credits, a conclusion aim) do not ask about them; one that opens later is still
 * asked about. Returns the ids recorded.
 */
export function confirmOpenObjectives(deps = {}) {
    const ids = openOptionalObjectives(deps.manager).map((o) => o.taskId);
    confirmTasks(ids);
    return ids;
}
let showing = null;            // the open modal's promise, shared by a second asker
let finishOpen = null;         // answers the open modal (finish(endNow)), while it is up
let held = null;               // { proceed, reason } after "Keep going" from a late trigger
let watching = false;

// A held ending must survive a page reload, or the mission soft-locks: the in-memory `held`
// is gone, the panel button and the auto-run never come back, and the trigger that opened the
// ending (a onceOnly mapping on a global that is already set) never fires again. So a descriptor
// identifying the held trigger is kept in the saved game state, as the non-declared global
// `__ending_held` (persisted and restored with globalVariables, never synced into ink). On load
// a rebuilder for the trigger's `reason` turns the descriptor back into the `proceed` that runs
// the ending, and the hold is re-established. The record is written the moment the warning is
// shown (so a reload taken with the modal open is restored, not stranded) and cleared when the
// ending finally runs.
const HELD_GLOBAL = '__ending_held';
const holdRebuilders = {};     // reason -> (record) => proceedFn | null, registered by each trigger's subsystem
let heldRecord = null;         // the descriptor mirrored into gameState.globalVariables.__ending_held

function heldGlobals() {
    return win()?.gameState?.globalVariables || null;
}

/** Mirror the held-ending descriptor into the saved globals (null clears it). */
function writeHeldRecord(record) {
    heldRecord = record || null;
    const g = heldGlobals();
    if (!g) return;
    if (record) g[HELD_GLOBAL] = record;
    else delete g[HELD_GLOBAL];
}

/**
 * A trigger's subsystem registers how to turn a held-ending descriptor back into the action that
 * runs the ending: npc-manager for `mapping`, objectives-manager for `aim`, music events for
 * `credits`. The rebuilder returns the `proceed` function, or null if it can't rebuild it.
 */
export function registerHoldRebuilder(reason, fn) {
    if (typeof reason === 'string' && typeof fn === 'function') holdRebuilders[reason] = fn;
}

/** Test seam: forget decisions, any open modal, any held ending and the saved record. */
export function _resetEndingCheck() {
    confirmed.clear();
    const g = win()?.gameState?.globalVariables;
    if (g) delete g[CONFIRMED_GLOBAL];
    held = null;
    watching = false;
    showing = null;
    finishOpen = null;
    writeHeldRecord(null);
    const doc = typeof document !== 'undefined' ? document : null;
    doc?.getElementById(ENDING_CHECK_ID)?.remove();
}

/**
 * Whether confirmEnding would ask now: the warning applies, an optional objective is open that
 * the player has not already agreed to leave, or the question is already up. Synchronous, so a
 * caller can keep its ordinary synchronous path when the answer is plainly yes.
 */
export function endingNeedsAnswer(deps = {}) {
    if (endingIsAsking()) return true;
    if (!endingCheckEnabled(deps.config)) return false;
    const open = openOptionalObjectives(deps.manager);
    return open.length > 0 && !open.every((o) => isConfirmed(o.taskId));
}

/**
 * Whether the question is up now (another trigger raised it and it is not answered yet).
 * A question whose overlay has left the page without an answer (some other code removed it)
 * is answered "Keep going" here, so a stale promise can never leave every later ending
 * choice waiting on a modal nobody can see (m10 blind part 3).
 */
export function endingIsAsking() {
    if (showing === null) return false;
    const doc = typeof document !== 'undefined' ? document : null;
    if (doc && !doc.getElementById(ENDING_CHECK_ID)) {
        console.warn('[ending-check] the question\'s overlay is gone without an answer: treating it as "Keep going"');
        if (finishOpen) finishOpen(false);
        else showing = null;
        return showing !== null;
    }
    return true;
}

/**
 * Draw the player's eye back to the open question (a choice clicked, or its number pressed,
 * while it is up): focus "Keep going" and pulse the frame. Returns whether it is up.
 */
export function nudgeEndingCheck() {
    if (!endingIsAsking()) return false;
    const doc = document;
    const overlay = doc.getElementById(ENDING_CHECK_ID);
    try { doc.getElementById('ending-check-keep')?.focus(); } catch (e) { /* jsdom without focus */ }
    const dialog = overlay?.querySelector('.ending-check-dialog');
    if (dialog) {
        dialog.classList.remove('ending-check-nudge');
        void dialog.offsetWidth;   // restart the animation
        dialog.classList.add('ending-check-nudge');
    }
    return true;
}

/**
 * Ask the player, if the warning applies. Resolves true to go ahead with the ending,
 * false to keep playing. Resolves true at once when there is nothing to warn about.
 *
 * @param {Object} [opts]
 * @param {string} [opts.reason]  where the ending came from ('tag' | 'credits' | 'aim'), for logs
 * @param {Object} [deps]  test seams: { manager, config }
 */
export function confirmEnding(opts = {}, deps = {}) {
    if (!endingNeedsAnswer(deps)) return Promise.resolve(true);
    const open = openOptionalObjectives(deps.manager);
    if (showing) return showing;
    if (typeof document === 'undefined') return Promise.resolve(true);

    // Record the held trigger as soon as the warning is up, so a reload taken while the modal is
    // open (before any answer) restores the hold on load instead of stranding the mission. "End
    // the mission now" clears it below (the ending runs); "Keep going" leaves it, and holdEnding
    // rewrites the same record.
    if (opts.persist) writeHeldRecord(opts.persist);

    showing = new Promise((resolve) => {
        finishOpen = openModal(open, (endNow) => {
            showing = null;
            finishOpen = null;
            if (endNow) {
                confirmTasks(open.map((o) => o.taskId));
                writeHeldRecord(null);
            }
            console.log(`[ending-check] ${opts.reason || 'ending'}: ${endNow ? 'end now' : 'keep going'} (${open.length} open)`);
            resolve(endNow);
        });
    });
    return showing;
}

/**
 * Remember an ending the player postponed, so the objectives panel can offer it and it can
 * finish by itself. `proceed` runs the ending (it must not ask again; confirmEnding answers
 * true once nothing optional is open). Only the first held ending is kept.
 */
export function holdEnding(proceed, { reason = 'ending', persist = null } = {}, deps = {}) {
    if (typeof proceed !== 'function') return false;
    if (!held) held = { proceed, reason };
    if (persist) writeHeldRecord(persist);
    watchObjectives(deps.manager);
    win()?.objectivesManager?.notifyListeners?.();
    return true;
}

export function hasHeldEnding() {
    return held !== null;
}

/**
 * Re-establish a held ending saved before a page reload. Reads the `__ending_held` descriptor
 * from the saved globals and asks the matching rebuilder for the `proceed` that runs the ending,
 * then holds it again: the panel button comes back and the ending runs by itself once nothing
 * optional is open. Called on game_loaded, before the scenario's own reload backstops, so a
 * sibling or backstop re-emit stands down (hasHeld) instead of asking a second time. A no-op if
 * an ending is already held this session, the game has already concluded (a stale record is
 * dropped), or no rebuilder can rebuild the trigger.
 */
export function restoreHeldEnding(deps = {}) {
    if (held) return false;
    const g = heldGlobals();
    const record = g?.[HELD_GLOBAL];
    if (!record || typeof record !== 'object' || !record.reason) return false;
    if (!endingCheckEnabled(deps.config)) { writeHeldRecord(null); return false; }
    const rebuild = holdRebuilders[record.reason];
    const proceed = rebuild ? rebuild(record) : null;
    if (typeof proceed !== 'function') {
        console.warn(`[ending-check] could not restore a held ${record.reason} ending (no rebuilder or no action)`);
        return false;   // leave the record in place; a later load may be able to rebuild it
    }
    held = { proceed, reason: record.reason };
    heldRecord = record;
    console.log(`[ending-check] restored a held ${record.reason} ending after reload`);
    watchObjectives(deps.manager);
    win()?.objectivesManager?.notifyListeners?.();
    return true;
}

// Phone calls plan 2.3 row 28: nothing here closes the phone ringer. "End the mission now" starts an
// ending that the server can still refuse (concludeRequires), so the ringer closes only where the
// server has agreed: scenario-music-events.js (credits) and objectives-manager.js handleMissionConcluded.

/** End the mission now, from the panel button or once nothing optional is open. */
export function endHeldEnding() {
    if (!held) return false;
    const { proceed, reason } = held;
    held = null;
    writeHeldRecord(null);   // the hold is spent: a reload now must not restore it
    // The player asked to end it (or nothing optional is left): do not ask a second time.
    confirmTasks(openOptionalObjectives().map((o) => o.taskId));
    console.log(`[ending-check] ending the held ${reason} ending`);
    try {
        const out = proceed();
        if (out && typeof out.catch === 'function') out.catch((e) => console.error('[ending-check] held ending failed:', e));
    } catch (e) {
        console.error('[ending-check] held ending failed:', e);
    }
    win()?.objectivesManager?.notifyListeners?.();
    return true;
}

/** The held ending finishes by itself when the last optional objective is settled. */
function watchObjectives(manager = win()?.objectivesManager) {
    if (watching || !manager?.addListener) return;
    watching = true;
    manager.addListener(() => {
        if (held && openOptionalObjectives(manager).length === 0) endHeldEnding();
    });
}

function openModal(open, done) {
    const doc = document;
    const overlay = doc.createElement('div');
    overlay.id = ENDING_CHECK_ID;
    overlay.className = 'ending-check-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'ending-check-title');
    // The same frame as the confirm and display dialogs (notifications.css, ui-themes.css 9-slice
    // skin); the ending rules at the end of notifications.css lift it above the phone and minigames.
    overlay.classList.add('game-confirm-overlay');
    const dialog = doc.createElement('div');
    dialog.className = 'game-confirm-dialog game-display-dialog ending-check-dialog';
    overlay.appendChild(dialog);

    // The X means "Keep going", the same answer as the first button.
    const closeBtn = doc.createElement('button');
    closeBtn.type = 'button';
    closeBtn.id = 'ending-check-close';
    closeBtn.className = 'game-modal-close';
    closeBtn.setAttribute('aria-label', KEEP_LABEL);
    closeBtn.textContent = '\u00d7';
    dialog.appendChild(closeBtn);

    const title = doc.createElement('h1');
    title.id = 'ending-check-title';
    title.className = 'game-display-title ending-check-heading';
    title.textContent = displayDashes(HEADING);
    dialog.appendChild(title);

    // Everything between the title and the buttons scrolls inside the frame.
    const content = doc.createElement('div');
    content.className = 'ending-check-content pixel-scroll';
    dialog.appendChild(content);

    const intro = doc.createElement('p');
    intro.className = 'ending-check-intro game-confirm-message';
    intro.textContent = displayDashes(introText(open.length));
    content.appendChild(intro);

    const list = doc.createElement('ul');
    list.className = 'ending-check-list';
    open.forEach((o) => {
        const li = doc.createElement('li');
        li.textContent = displayDashes(o.title);
        list.appendChild(li);
    });
    content.appendChild(list);

    const ask = doc.createElement('p');
    ask.className = 'ending-check-ask game-confirm-message';
    ask.textContent = 'End the mission now, or keep going?';
    content.appendChild(ask);

    const row = doc.createElement('div');
    row.className = 'game-confirm-buttons ending-check-buttons';
    const w = win();
    const movementBefore = w?.player ? !!w.player.disableMovement : null;
    const previousFocus = doc.activeElement;
    let finished = false;
    let keyHandler = null;
    const finish = (endNow) => {
        if (finished) return;
        finished = true;
        overlay.remove();
        try { w?.modalDialogClosed?.(); } catch (e) { /* a toast-hold fault must never keep the question open */ }
        if (keyHandler) w?.removeEventListener('keydown', keyHandler, true);
        try { if (previousFocus && previousFocus.isConnected && previousFocus.focus) previousFocus.focus(); } catch (e) { /* best effort */ }
        if (w?.player && movementBefore !== null) w.player.disableMovement = movementBefore;
        done(endNow);
    };
    const button = (id, label, primary, endNow) => {
        const b = doc.createElement('button');
        b.id = id;
        b.type = 'button';
        b.textContent = label;
        b.className = `game-confirm-btn ${primary ? 'game-confirm-ok' : 'game-confirm-cancel'}`;
        b.addEventListener('click', () => finish(endNow));
        row.appendChild(b);
        return b;
    };
    // Keep going is first and has the focus: Enter or Esc never ends the mission by accident.
    const keep = button('ending-check-keep', KEEP_LABEL, true, false);
    const endBtn = button('ending-check-end', END_LABEL, false, true);
    closeBtn.addEventListener('click', () => finish(false));
    dialog.appendChild(row);
    doc.body.appendChild(overlay);
    // Part of the toast hold with gameDisplay and gameConfirm (notifications.js).
    try { w?.modalDialogOpened?.(); } catch (e) { /* a toast-hold fault must never break the question */ }

    if (w?.player) w.player.disableMovement = true;
    keyHandler = (e) => {
        if (finished) return;
        const key = e.key;
        if (key === 'Escape') {
            e.preventDefault();
            finish(false);
        } else if (key === 'Tab' || key === 'ArrowLeft' || key === 'ArrowRight' ||
                   key === 'ArrowUp' || key === 'ArrowDown') {
            // Focus cycles over X, Keep going and End; Tab and the arrows never reach the page behind.
            e.preventDefault();
            const order = [closeBtn, keep, endBtn];
            const at = order.indexOf(doc.activeElement);
            const back = (key === 'Tab' && e.shiftKey) || key === 'ArrowLeft' || key === 'ArrowUp';
            const next = at < 0 ? (back ? order.length - 1 : 0)
                : (at + (back ? order.length - 1 : 1)) % order.length;
            try { order[next].focus(); } catch (err) { /* jsdom without focus */ }
        } else if ((key === 'Enter' || key === ' ') && !(e.target && overlay.contains(e.target))) {
            // Focus has drifted outside the dialog: do not let Enter or Space press the page behind.
            e.preventDefault();
        }
        e.stopPropagation();
    };
    w?.addEventListener('keydown', keyHandler, true);
    try { keep.focus(); } catch (e) { /* jsdom without focus */ }
    return finish;
}

if (typeof window !== 'undefined') {
    window.endingCheck = {
        confirm: confirmEnding,
        hold: holdEnding,
        hasHeld: hasHeldEnding,
        endHeld: endHeldEnding,
        needsAnswer: endingNeedsAnswer,
        isAsking: endingIsAsking,
        nudge: nudgeEndingCheck,
        openOptional: openOptionalObjectives,
        enabled: endingCheckEnabled,
        registerRebuilder: registerHoldRebuilder,
        restoreHeld: restoreHeldEnding,
        confirmOpen: confirmOpenObjectives,
        heldRecord: () => heldRecord
    };
}

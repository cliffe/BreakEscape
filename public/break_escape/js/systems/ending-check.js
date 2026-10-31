/**
 * The ending warning: before a story's ending fires, tell the player which
 * optional objectives are still open, and let them end the mission now or keep going.
 *
 * Every ending trigger asks this one module (confirmEnding):
 *   - the ink tag `# ending_check` (minigames/helpers/chat-helpers.js), put first in the
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
 *     of the same ending, say the tag and then the credits, does not ask twice).
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
 * whose status is active, in an aim that is active or completed. A locked task or aim is hidden from
 * the player, so naming it would give the story away. Returns [{ taskId, title }].
 */
export function openOptionalObjectives(manager = win()?.objectivesManager) {
    const aims = Array.isArray(manager?.aims) ? manager.aims : [];
    const open = [];
    for (const aim of aims) {
        if (!aim || (aim.status !== 'active' && aim.status !== 'completed')) continue;
        for (const task of aim.tasks || []) {
            if (task && task.optional === true && task.status === 'active') {
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

const confirmed = new Set();   // task ids the player has agreed to leave open
let showing = null;            // the open modal's promise, shared by a second asker
let held = null;               // { proceed, reason } after "Keep going" from a late trigger
let watching = false;

/** Test seam: forget decisions, any open modal and any held ending. */
export function _resetEndingCheck() {
    confirmed.clear();
    held = null;
    watching = false;
    showing = null;
    const doc = typeof document !== 'undefined' ? document : null;
    doc?.getElementById(ENDING_CHECK_ID)?.remove();
}

/**
 * Whether confirmEnding would ask now: the warning applies, an optional objective is open that
 * the player has not already agreed to leave, or the question is already up. Synchronous, so a
 * caller can keep its ordinary synchronous path when the answer is plainly yes.
 */
export function endingNeedsAnswer(deps = {}) {
    if (showing) return true;
    if (!endingCheckEnabled(deps.config)) return false;
    const open = openOptionalObjectives(deps.manager);
    return open.length > 0 && !open.every((o) => confirmed.has(o.taskId));
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

    showing = new Promise((resolve) => {
        openModal(open, (endNow) => {
            showing = null;
            if (endNow) open.forEach((o) => confirmed.add(o.taskId));
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
export function holdEnding(proceed, { reason = 'ending' } = {}, deps = {}) {
    if (typeof proceed !== 'function') return false;
    if (!held) held = { proceed, reason };
    watchObjectives(deps.manager);
    win()?.objectivesManager?.notifyListeners?.();
    return true;
}

export function hasHeldEnding() {
    return held !== null;
}

/** End the mission now, from the panel button or once nothing optional is open. */
export function endHeldEnding() {
    if (!held) return false;
    const { proceed, reason } = held;
    held = null;
    // The player asked to end it (or nothing optional is left): do not ask a second time.
    openOptionalObjectives().forEach((o) => confirmed.add(o.taskId));
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
    overlay.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
        'background:rgba(0,0,0,0.88)',
        'display:flex', 'justify-content:center', 'align-items:center',
        'z-index:10001', 'flex-direction:column', 'gap:18px',
        'padding:16px', 'box-sizing:border-box',
        'font-family:"Press Start 2P",monospace'
    ].join(';');

    const title = doc.createElement('h1');
    title.id = 'ending-check-title';
    title.textContent = displayDashes(HEADING);
    title.style.cssText = 'color:#ffcc33;font-size:20px;font-weight:normal;margin:0;text-align:center;max-width:820px;line-height:1.6';
    overlay.appendChild(title);

    const intro = doc.createElement('p');
    intro.className = 'ending-check-intro';
    intro.textContent = displayDashes(introText(open.length));
    intro.style.cssText = 'color:#cccccc;font-size:20px;font-family:"VT323",monospace;margin:0;text-align:center;max-width:680px;line-height:1.5';
    overlay.appendChild(intro);

    const list = doc.createElement('ul');
    list.className = 'ending-check-list';
    list.style.cssText = 'color:#ffffff;font-size:20px;font-family:"VT323",monospace;margin:0;padding:0 0 0 24px;max-width:680px;line-height:1.5;max-height:35vh;overflow:auto';
    open.forEach((o) => {
        const li = doc.createElement('li');
        li.textContent = displayDashes(o.title);
        list.appendChild(li);
    });
    overlay.appendChild(list);

    const ask = doc.createElement('p');
    ask.textContent = 'End the mission now, or keep going?';
    ask.style.cssText = 'color:#cccccc;font-size:20px;font-family:"VT323",monospace;margin:0;text-align:center;max-width:680px';
    overlay.appendChild(ask);

    const row = doc.createElement('div');
    row.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:8px';
    const w = win();
    const movementBefore = w?.player ? !!w.player.disableMovement : null;
    let finished = false;
    let keyHandler = null;
    const finish = (endNow) => {
        if (finished) return;
        finished = true;
        overlay.remove();
        if (keyHandler) w?.removeEventListener('keydown', keyHandler, true);
        if (w?.player && movementBefore !== null) w.player.disableMovement = movementBefore;
        done(endNow);
    };
    const button = (id, label, primary, endNow) => {
        const b = doc.createElement('button');
        b.id = id;
        b.type = 'button';
        b.textContent = label;
        b.style.cssText = [
            'padding:12px 20px', 'font-size:13px', 'font-family:"Press Start 2P",monospace',
            `background:${primary ? '#1d4d33' : '#333'}`, 'color:#dddddd',
            `border:2px solid ${primary ? '#22ff88' : '#666'}`, 'cursor:pointer'
        ].join(';');
        b.addEventListener('click', () => finish(endNow));
        row.appendChild(b);
        return b;
    };
    // Keep going is first and has the focus: Enter or Esc never ends the mission by accident.
    const keep = button('ending-check-keep', KEEP_LABEL, true, false);
    button('ending-check-end', END_LABEL, false, true);
    overlay.appendChild(row);
    doc.body.appendChild(overlay);

    if (w?.player) w.player.disableMovement = true;
    keyHandler = (e) => {
        if (finished) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            finish(false);
        }
        e.stopPropagation();
    };
    w?.addEventListener('keydown', keyHandler, true);
    try { keep.focus(); } catch (e) { /* jsdom without focus */ }
}

if (typeof window !== 'undefined') {
    window.endingCheck = {
        confirm: confirmEnding,
        hold: holdEnding,
        hasHeld: hasHeldEnding,
        endHeld: endHeldEnding,
        needsAnswer: endingNeedsAnswer,
        openOptional: openOptionalObjectives,
        enabled: endingCheckEnabled
    };
}

/**
 * Person-chat reopen context.
 *
 * A person-chat conversation that is closed at a choice point (a hub) and
 * reopened in the same session resumes the saved story. Continuing from a
 * choice point prints nothing, so without help the dialogue box opens blank
 * with only the choice buttons. This module remembers the last line the NPC
 * said in each conversation, so the reopen can show it again as context.
 *
 * The memory is per page load on purpose: after a reload the conversation
 * starts at its start knot and prints its own greeting, so nothing is needed.
 * The line is only re-displayed: no tags run, no TTS plays, and nothing is
 * added to any history.
 */

const lastNpcLines = new Map();

/**
 * Remember the last line the NPC (or another non-player character) said in
 * this NPC's conversation. Player, system and narrator lines are ignored.
 * @param {string} npcId - The conversation's NPC id
 * @param {Object} line - { text, speaker, isNarrator, narratorCharacter }
 */
export function rememberNpcLine(npcId, line) {
    if (!npcId || !line) return;
    const text = typeof line.text === 'string' ? line.text.trim() : '';
    if (!text) return;
    if (!line.speaker || line.speaker === 'player' || line.speaker === 'system') return;
    if (line.isNarrator) return;
    lastNpcLines.set(npcId, { text, speaker: line.speaker });
}

/**
 * @param {string} npcId
 * @returns {{text: string, speaker: string}|null}
 */
export function getRememberedNpcLine(npcId) {
    return lastNpcLines.get(npcId) || null;
}

export function forgetNpcLine(npcId) {
    if (npcId === undefined) lastNpcLines.clear();
    else lastNpcLines.delete(npcId);
}

/**
 * Reopen echo. Closing a chat at a choice point and reopening it re-enters the knot
 * that owns the choices (so conditions re-read the current globals), and a knot that
 * prints lines before its choices prints them all again: the player saw and heard
 * them a moment ago, and hears the same lines twice. Each line displayed is
 * remembered here (raw ink text, per NPC, per page load, newest 40); a reopen whose
 * first continue() prints only lines already in that memory is an echo, and the
 * caller shows the choices with the usual one-line recap instead (display only, no
 * TTS, no tags). Anything new in the text (a changed return greeting, a line a changed
 * global now prints) makes it a real re-entry and it plays as normal.
 */
const MAX_SHOWN = 40;
const shownLines = new Map();
const normLine = l => String(l).replace(/\s+/g, ' ').trim();

export function rememberShownText(npcId, text) {
    if (!npcId || typeof text !== 'string') return;
    const lines = text.split('\n').map(normLine).filter(Boolean);
    if (!lines.length) return;
    const list = shownLines.get(npcId) || [];
    for (const l of lines) list.push(l);
    shownLines.set(npcId, list.slice(-MAX_SHOWN));
}

export function forgetShownText(npcId) {
    if (npcId === undefined) shownLines.clear();
    else shownLines.delete(npcId);
}

/**
 * True when every line of a result's text is one this page load already showed for
 * this NPC, and there is at least one line.
 */
export function linesAlreadyShown(npcId, text) {
    const seen = shownLines.get(npcId);
    if (!seen || !seen.length || typeof text !== 'string') return false;
    const lines = text.split('\n').map(normLine).filter(Boolean);
    if (!lines.length) return false;
    const pool = new Set(seen);
    return lines.every(l => pool.has(l));
}

/**
 * Run a reopened story forward in silence to see whether it only replays lines
 * already shown. ink prints one line per continue(), so the replay is only known
 * to be an echo once the choices are reached. Reads from the story as it rests after
 * the reopen's restore and re-navigation; takes a snapshot first.
 *
 * - Echo (every line seen, ends at choices, no exit tag): returns the choices result
 *   with its text and tags blanked. The story is left at the choices, as a normal
 *   continue would leave it.
 * - Anything else (a new line, no choices, an exit or end tag, a thrown error):
 *   restores the snapshot and returns null; the caller continues as usual.
 * @param {Object} opts
 * @param {string} opts.npcId
 * @param {Object} opts.engine - InkEngine-like, continue() -> { text, choices, tags, canContinue }
 * @param {Object} opts.story - inkjs Story (state.ToJson / state.LoadJson)
 * @returns {Object|null}
 */
export function drainReopenEcho({ npcId, engine, story }) {
    if (!engine || !story?.state || !shownLines.get(npcId)?.length) return null;
    let snapshot;
    try { snapshot = story.state.ToJson(); } catch (e) { return null; }
    const restore = () => { try { story.state.LoadJson(snapshot); } catch (e) { console.warn('⚠️ Could not restore story after echo check:', e.message); } };
    let sawText = false;
    try {
        for (let i = 0; i < 60; i++) {
            const r = engine.continue();
            if (!r) break;
            if ((r.tags || []).some(t => /^(exit|end)_conversation\b/i.test(String(t).trim()))) break;
            if (r.text && r.text.trim()) {
                if (!linesAlreadyShown(npcId, r.text)) break;
                sawText = true;
            }
            if (r.choices && r.choices.length > 0) {
                if (!sawText) break;
                return { ...r, text: '', tags: [], hasEnded: false };
            }
            if (!r.canContinue) break;
        }
    } catch (e) { /* fall through to restore */ }
    restore();
    return null;
}

/**
 * Decide whether a reopened conversation needs a context line.
 * Returns the remembered line when the conversation was resumed from saved
 * state, the first continue() printed no text, and there are choices to show
 * (the blank-box case). Returns null otherwise: on a first visit, after a
 * reload, on an event-triggered start knot, or when the ink printed its own
 * re-entry line (so lines are never doubled).
 * @param {Object} opts
 * @param {boolean} opts.isReopen - true when saved state was restored this session
 * @param {Object} opts.result - the first continue() result
 * @param {Object|null} opts.remembered - getRememberedNpcLine(npcId)
 */
export function reopenContextLine({ isReopen, result, remembered }) {
    if (!isReopen || !remembered || !result) return null;
    if (result.text && result.text.trim()) return null;
    if (!result.choices || result.choices.length === 0) return null;
    return remembered;
}

/**
 * A reopen whose resumed story had only the divert to DONE/END left. The knot ended
 * `line / #exit_conversation / -> DONE` and the chat was closed (Esc, X, a reload)
 * before the tag was read, so the saved story still had canContinue true: the restore
 * took it for mid-conversation and the next continue() ran straight into the end,
 * giving no text, no choices and "(End of conversation)". That is a finished story,
 * and restartAfterEnd() should start it again like any other finished one.
 *
 * A `#end_conversation` tag is excluded: that is a deliberate close, already handled.
 * NPC config "restartOnRetalk": false opts out, for one-shot scenes.
 * The empty result's state tags are run by the caller before any restart (the tag line
 * never ran: the save came before it was read), whatever restartOnRetalk says; the
 * restarted knot then runs its own tags when it is played.
 * @param {Object} opts
 * @param {boolean} opts.isReopen - saved state was restored this session
 * @param {Object} opts.result - the first continue() result
 * @param {*} opts.restartOnRetalk - the NPC's restartOnRetalk setting
 * @returns {boolean}
 */
export function resumedStoryHadOnlyTheEnd({ isReopen, result, restartOnRetalk }) {
    if (restartOnRetalk === false) return false;
    return resumedStoryEndedEmpty({ isReopen, result });
}

/**
 * The restartOnRetalk-independent half of the above: a reopen whose first result is an
 * ended story with no text, no choices and no `#end_conversation`. Its tags are unread.
 * @param {Object} opts
 * @param {boolean} opts.isReopen
 * @param {Object} opts.result
 * @returns {boolean}
 */
export function resumedStoryEndedEmpty({ isReopen, result }) {
    if (isReopen !== true || !result) return false;
    if (result.hasEnded !== true) return false;
    if (result.text && result.text.trim()) return false;
    if (result.choices && result.choices.length > 0) return false;
    return !(result.tags || []).some(t => String(t).trim().toLowerCase() === 'end_conversation');
}

/**
 * The knot that owns the story's current choices ("hub.0.c-1" -> "hub"), or null.
 * currentPathString is null at a choice point, so the first choice's source path
 * is read instead (as the reopen re-navigation in person-chat-minigame.js does).
 * @param {Object} story - an inkjs Story
 */
export function choiceOwnerKnot(story) {
    const first = story?.currentChoices?.[0];
    if (!first) return null;
    const sourcePath = first.sourcePath || (first._sourcePath && first._sourcePath.toString());
    return sourcePath ? sourcePath.split('.')[0] || null : null;
}

/**
 * Opt-in hub refresh for a reopen that resumed mid-knot (NPC config
 * "reopenRefreshesHub": true; lab D9).
 *
 * Closing a conversation while a topic's last line is still on screen saves the
 * story part-way through that topic: its tail (`~ quiet = true -> hub`) has not
 * run yet. A reopen then runs the tail first, the hub consumes the `quiet` flag
 * the tail just set, prints nothing, and the reopen shows the old topic line again
 * (reopenContextLine) instead of the hub's line for where the player is now.
 *
 * When the NPC opts in, the reopen resumed mid-knot, and the first continue
 * printed nothing and stopped at choices, this re-enters the knot that owns those
 * choices, as a reopen at a choice point already does. The tail's own pass has
 * cleared `quiet`, so the second pass prints the hub's current line. Anything else
 * (the flag off, a choice-point reopen, a continue that printed text, no choices)
 * returns null and changes nothing.
 * @param {Object} opts
 * @param {boolean} opts.optedIn - the NPC's reopenRefreshesHub flag
 * @param {boolean} opts.resumedMidKnot - the restored story had no choices yet
 * @param {Object} opts.result - the first continue() result
 * @param {Object} opts.story - the inkjs Story, resting on result's choices
 * @returns {string|null} the knot re-entered, or null when nothing was done
 */
export function refreshHubAfterMidKnotReopen({ optedIn, resumedMidKnot, result, story }) {
    if (optedIn !== true || !resumedMidKnot || !result || !story) return null;
    if (result.text && result.text.trim()) return null;
    if (!result.choices || result.choices.length === 0) return null;
    const knot = choiceOwnerKnot(story);
    if (!knot) return null;
    try {
        story.ChoosePathString(knot);
    } catch (e) {
        console.warn(`⚠️ Could not re-enter "${knot}" after a mid-knot reopen:`, e.message);
        return null;
    }
    return knot;
}

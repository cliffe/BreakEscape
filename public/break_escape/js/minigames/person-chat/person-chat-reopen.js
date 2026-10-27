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

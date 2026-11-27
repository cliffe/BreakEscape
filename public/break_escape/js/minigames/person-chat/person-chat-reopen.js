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
 * them a moment ago, and hears the same lines twice.
 *
 * Every line displayed is remembered per NPC, per page load, in order (newest 40), with
 * the game tags that came with it. A reopen is an echo only when running the knot
 * forward in silence yields exactly the most recent lines shown, in order, with the same
 * tags, and nothing else (no extra tag-only step, no exit). The caller then shows the
 * choices with the usual one-line recap instead (display only, no TTS, no tags). Anything
 * else (a changed return greeting, a cycling greeting that moved on, a line a changed
 * global now prints, a tag that differs) is real content and plays as normal.
 * A chat that closed on an exit_conversation reply never echoes: the next visit greets.
 */
const MAX_SHOWN = 40;
const MAX_STEPS = 60;
const shownLines = new Map(); // npcId -> { list: [{ t, g }], exit: boolean }
const normLine = l => String(l).replace(/\s+/g, ' ').trim();
export const isExitTag = t => /^(exit|end)_conversation\b/i.test(String(t).trim());
// speaker: / delivery: only change how a line is presented, not what it does
const isPresentationTag = t => /^(speaker|delivery)\s*:/i.test(String(t).trim());
const tagKey = tags => (tags || []).map(t => String(t).trim()).filter(t => t && !isPresentationTag(t)).join('|');
// A player's choice sits in the log as an entry no ink line can equal (NUL cannot survive
// normLine's text), so a tail match can never span a choice.
const CHOICE_MARK = { t: '\u0000player-chose', g: '' };
const entriesOf = (text, tags) => {
    const g = tagKey(tags);
    return String(text || '').split('\n').map(normLine).filter(Boolean).map(t => ({ t, g }));
};

/**
 * Remember the lines of a displayed step and its tags. A step carrying an
 * exit_conversation / end_conversation tag marks the chat as closed by exit; any later
 * step clears the mark.
 */
export function rememberShownText(npcId, text, tags) {
    if (!npcId) return;
    const rec = shownLines.get(npcId) || { list: [], exit: false };
    const added = typeof text === 'string' ? entriesOf(text, tags) : [];
    if ((tags || []).some(isExitTag)) rec.exit = true;
    else if (added.length) rec.exit = false;
    for (const e of added) rec.list.push(e);
    rec.list = rec.list.slice(-MAX_SHOWN);
    shownLines.set(npcId, rec);
}

/** The player picked a choice: later lines are new, so an echo can never reach back past this. */
export function rememberPlayerChoice(npcId) {
    if (!npcId) return;
    const rec = shownLines.get(npcId);
    if (!rec || !rec.list.length) return;
    rec.list.push(CHOICE_MARK);
    rec.list = rec.list.slice(-MAX_SHOWN);
}

/** The chat closed on an exit_conversation that was not recorded with a line (tags-only step). */
export function markClosedByExit(npcId) {
    if (!npcId) return;
    const rec = shownLines.get(npcId) || { list: [], exit: false };
    rec.exit = true;
    shownLines.set(npcId, rec);
}

export function forgetShownText(npcId) {
    if (npcId === undefined) shownLines.clear();
    else shownLines.delete(npcId);
}

/**
 * True when `entries` (drained, in order) are exactly the most recent lines shown for
 * this NPC. Exported for tests.
 */
export function matchesShownTail(npcId, entries) {
    const rec = shownLines.get(npcId);
    if (!rec || rec.exit || !entries.length || entries.length > rec.list.length) return false;
    const tail = rec.list.slice(-entries.length);
    return entries.every((e, i) => e.t === tail[i].t && e.g === tail[i].g);
}

/**
 * Decide whether a reopened story only replays what was just shown, without touching
 * anything. The look-ahead is the same as the other ones (_flushTrailingTags,
 * restoredStoryHasOnlyTheEnd): global observer detached, effectful externals stubbed,
 * story put back after. Only when it is an echo is the knot run again for real, the
 * same number of steps, through `step` (the conversation's own continue, so its
 * bookkeeping runs and ink variables reach gameState once); the text and tags of that
 * replay are dropped, because the tags already ran when the lines were first shown.
 *
 * A true echo drops every tag of the replayed steps on purpose, presentation ones
 * (portrait, lighting) and counters included: they ran when the lines were first shown,
 * and a non-idempotent tag must not run again on each re-entry.
 *
 * Returns the choices result with text and tags blanked for an echo, else null with the
 * story exactly as it was. Not an echo: a new or reordered line, a tag that differs, an
 * action-tag step with no text, an exit/end tag, no choices, an error, more than 60 steps
 * (a longer knot replays in full), or a chat that closed on an exit.
 * @param {Object} opts
 * @param {string} opts.npcId
 * @param {Object} opts.engine - InkEngine-like, continue() -> { text, choices, tags, canContinue }
 * @param {Object} opts.story - inkjs Story (state.ToJson / state.LoadJson / variablesState)
 * @param {Function} [opts.step] - the real continue (default engine.continue)
 * @returns {Object|null}
 */
export function drainReopenEcho({ npcId, engine, story, step }) {
    const rec = shownLines.get(npcId);
    if (!engine || !story?.state || !rec || !rec.list.length || rec.exit) return null;
    let snapshot;
    try { snapshot = story.state.ToJson(); } catch (e) { return null; }

    const entries = [];
    const stepTexts = [];
    const stepKeys = [];
    let reachedChoices = false;
    const dryRun = () => {
        for (let i = 0; i < MAX_STEPS; i++) {
            const r = engine.continue();
            if (!r) return;
            const tags = r.tags || [];
            if (tags.some(isExitTag)) return;
            const hasText = !!(r.text && r.text.trim());
            if (hasText) entries.push(...entriesOf(r.text, tags));
            // Once there are more lines than the log holds it can no longer match
            else if (tagKey(tags)) return; // an action tag with no line: cannot prove it already ran
            stepTexts.push(hasText ? normLine(r.text) : '');
            stepKeys.push(tagKey(tags));
            if (entries.length > rec.list.length) return;
            if (r.choices && r.choices.length > 0) { reachedChoices = true; return; }
            if (!r.canContinue) return;
        }
    };
    const vs = story.variablesState;
    const hadOwn = vs ? Object.prototype.hasOwnProperty.call(vs, 'variableChangedEvent') : false;
    const observer = hadOwn ? vs.variableChangedEvent : undefined;
    try {
        if (vs) vs.variableChangedEvent = null;
        if (typeof engine.withEffectfulExternalsStubbed === 'function') engine.withEffectfulExternalsStubbed(dryRun);
        else dryRun();
    } catch (e) { reachedChoices = false; }
    finally {
        try { story.state.LoadJson(snapshot); } catch (e) { console.warn('⚠️ Could not restore story after echo check:', e.message); }
        if (vs) {
            if (hadOwn) vs.variableChangedEvent = observer;
            else delete vs.variableChangedEvent;
        }
    }
    if (!reachedChoices || !entries.length || !matchesShownTail(npcId, entries)) return null;

    const run = typeof step === 'function' ? step : () => engine.continue();
    let last = null;
    for (let i = 0; i < stepTexts.length; i++) {
        last = run();
        // Stubbed externals can return different values from the live ones. If the real
        // replay prints anything else (other text, other tags), hand that step back
        // unchanged as ordinary content. The story has moved, so never null.
        if (!last) return { text: '', choices: [], tags: [], canContinue: false, hasEnded: true };
        if (normLine(last.text || '') !== stepTexts[i] || tagKey(last.tags) !== stepKeys[i]) return last;
    }
    // The run must still end at choices, and carry no exit/end tag
    if (!(last.choices && last.choices.length > 0) || (last.tags || []).some(isExitTag)) return last;
    return { ...last, text: '', tags: [], hasEnded: false };
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
 * Whether a person-chat reopen should restart the NPC's story at its start knot
 * (restartAfterEnd) rather than continue the restored story.
 *
 * - A state seeded from the server on load (importNpcInkVariables) has variables and
 *   no position: the server never keeps one, so there is nothing to resume and the
 *   story must start, whatever restartOnRetalk says. Left alone it has no content and
 *   shows only "(End of conversation)" (m01 Derek after a reload, game 9857).
 * - Otherwise restartOnRetalk: false keeps a one-shot scene closed once it has ended
 *   in this session, and a real saved position resumes.
 * - Otherwise a variables-only restore (the story ended this session) or a restored
 *   story with nothing left to continue and no choices restarts.
 * @param {Object} opts
 * @param {boolean|string} opts.stateRestored - what restoreNPCState returned
 * @param {boolean} opts.seededFromSave - the restored state was seeded from the server
 * @param {*} opts.restartOnRetalk - the NPC's restartOnRetalk setting
 * @param {Object} opts.story - the restored inkjs Story
 * @returns {boolean}
 */
export function restoredStoryShouldRestart({ stateRestored, seededFromSave, restartOnRetalk, story }) {
    if (stateRestored === 'variables-only' && seededFromSave === true) return true;
    if (restartOnRetalk === false) return false;
    if (stateRestored === 'variables-only') return true;
    return !story?.canContinue && !(story?.currentChoices?.length > 0);
}

/**
 * The restartOnRetalk-independent half of resumedStoryHadOnlyTheEnd: a reopen whose first result is an
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

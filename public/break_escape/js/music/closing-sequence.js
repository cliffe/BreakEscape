/**
 * The end-of-mission sequence a music event shows (finale F14): an optional closing
 * card, an optional teaser, then the credits. Everything is chosen by globals; every
 * string is fixed text from the scenario (no printed variables, so nothing varies per
 * player beyond which lines appear).
 *
 * On a music event entry, next to "credits":
 *
 *   "closingCard": {
 *     "lines": [                               // first MAX_CARD_LINES that hold, in order
 *       { "text": "The grid stayed up.", "condition": "globalVars.grid_saved" },
 *       { "text": "Nobody outside the room will know." }
 *     ],
 *     "teaser": {                              // only while globalVars[enabledBy] is truthy
 *       "enabledBy": "teaser_enabled",         // default "teaser_enabled": off unless set
 *       "lines": [{ "text": "Somewhere, a phone rings." }]
 *     }
 *   },
 *   "credits": [
 *     { "text": "MISSION COMPLETE", "style": "title" },
 *     { "section": "IN THIS OPERATION", "people": [
 *         { "name": "AGENT HAX", "clauses": [       // the first clause that holds, or none
 *             { "text": "Put on the floor by her own agent.", "condition": "globalVars.hax_ko", "style": "warning" },
 *             { "text": "On the line to the end." } ] } ] },
 *     { "section": "ELSEWHERE", "lines": [              // every line that holds
 *         { "text": "THE ARCHITECT: At large.", "condition": "!globalVars.architect_caught" } ] }
 *   ]
 *
 * A section prints its header only when at least one of its people or lines does, so
 * a block can't come out as a bare heading. Plain credit lines work as before.
 *
 * No imports, so node tests can load it on its own.
 */

export const MAX_CARD_LINES = 5;
export const DEFAULT_TEASER_GLOBAL = 'teaser_enabled';

const holds = (item, test) => !item?.condition || !!test(item.condition);
const textOf = (item) => (typeof item === 'string' ? item : (item?.text ?? ''));
const hasText = (t) => typeof t === 'string' && t.trim() !== '';

/** The card's lines: those whose condition holds, in order, at most MAX_CARD_LINES. */
export function closingCardLines(card, test) {
    if (!card || !Array.isArray(card.lines)) return [];
    return card.lines
        .filter(item => holds(item, test))
        .map(textOf)
        .filter(hasText)
        .slice(0, MAX_CARD_LINES);
}

/** The teaser's lines, or [] when its global is not set. */
export function teaserLines(card, globals, test) {
    const teaser = card?.teaser;
    if (!teaser) return [];
    const flag = teaser.enabledBy || DEFAULT_TEASER_GLOBAL;
    if (!globals || !globals[flag]) return [];
    if (!holds(teaser, test)) return [];
    const lines = Array.isArray(teaser.lines) ? teaser.lines : [teaser];
    return lines.filter(item => holds(item, test)).map(textOf).filter(hasText).slice(0, MAX_CARD_LINES);
}

/** One credit line per person: "NAME: clause" for the first clause that holds. */
function personLine(person, test) {
    if (!person || !holds(person, test)) return null;
    const clause = (person.clauses || []).find(c => holds(c, test) && hasText(textOf(c)));
    if (!clause) return null;
    const text = person.name ? `${person.name}: ${textOf(clause)}` : textOf(clause);
    return { text, style: clause.style || person.style || 'entry' };
}

/** Credits with sections expanded and conditions applied: [{ text, style }]. */
export function expandCredits(credits, test) {
    const out = [];
    for (const item of credits || []) {
        if (item && (item.section !== undefined || item.people || item.lines)) {
            if (!holds(item, test)) continue;
            const body = [];
            for (const person of item.people || []) {
                const line = personLine(person, test);
                if (line) body.push(line);
            }
            for (const line of item.lines || []) {
                if (holds(line, test) && hasText(textOf(line))) {
                    body.push({ text: textOf(line), style: line.style || 'entry' });
                }
            }
            if (body.length === 0) continue;
            if (hasText(item.section)) {
                out.push({ text: item.section, style: item.headerStyle || 'section-header' });
            }
            out.push(...body);
            continue;
        }
        if (!holds(item, test)) continue;
        out.push({ text: item?.text ?? '', style: item?.style ?? '' });
    }
    return out;
}

/**
 * Everything the visualiser shows, in order. A card or teaser is one item with
 * `lines` (shown together); credits are one item per line, as before.
 * @param {object} entry - the music event entry (closingCard, credits)
 * @param {object} globals - window.gameState.globalVariables
 * @param {(condition: string) => boolean} test - evaluates a condition string
 * @returns {Array<{text: string, style: string, lines?: string[]}>}
 */
export function buildEndSequence(entry, globals, test) {
    const seq = [];
    const card = closingCardLines(entry?.closingCard, test);
    if (card.length) seq.push({ text: card.join(' '), style: 'card', lines: card });
    const teaser = teaserLines(entry?.closingCard, globals, test);
    if (teaser.length) seq.push({ text: teaser.join(' '), style: 'teaser', lines: teaser });
    seq.push(...expandCredits(entry?.credits, test));
    return seq;
}

/**
 * Reload of a concluded game (finale F22): the live ending ran from the music event
 * that carried the credits, with the event's data in scope. Rebuild it from the saved
 * globals: take the music events that carry a card or credits, give each condition the
 * data its trigger would have had (`global_variable_changed:X` -> { name, value }),
 * and use the first that holds.
 * @param {Array} events - scenario.music.events
 * @param {object} globals - saved globalVariables
 * @param {(condition: string, data: object) => boolean} test
 * @returns {{entry: object, sequence: Array}|null} null when no ending entry holds
 */
export function replayEndingEntry(events, globals, test) {
    for (const entry of events || []) {
        if (!entry || !(entry.credits?.length || entry.closingCard)) continue;
        const m = /^global_variable_changed:(.+)$/.exec(entry.trigger || '');
        const data = m ? { name: m[1], value: globals?.[m[1]] } : {};
        if (m && !entry.condition && !data.value) continue;
        if (entry.condition && !test(entry.condition, data)) continue;
        const sequence = buildEndSequence(entry, globals || {}, c => test(c, data));
        if (sequence.length) return { entry, sequence };
    }
    return null;
}

/** How long a card stays up: long enough to read every line. */
export function cardHoldMs(lineCount) {
    return 2500 + 1500 * Math.max(1, lineCount || 0);
}

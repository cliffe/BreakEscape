/**
 * Who said a phone-chat line (approval log U3).
 *
 * Phone ink is the NPC's side of a text thread, but a line can be the player's own:
 * after a non-verbal choice ("[Say nothing.]") the ink may carry `You: …`, and person-chat
 * also accepts `Player: …` and a `#speaker:player` tag. Those lines are shown and stored as
 * the player's (prefix stripped), never as the NPC's: no NPC bubble, no unread count, no
 * NPC preview text, no NPC voice.
 *
 *
 * A line written `Narrator: …` (or tagged #speaker:narrator) is narration: type
 * 'narrator', prefix stripped. The UI shows it centred and muted with no bubble, it is
 * stored already read (never unread), and it is never the contact-list preview, a bark or
 * a voice (phone texts are not voiced).
 *
 * No imports, so the node tests can copy it next to npc-manager.js and
 * phone-chat-conversation.js.
 */

const PLAYER_PREFIX = /^(?:you|player)\s*:\s*/i;
// "Narrator: …" (person-chat also accepts "Narrator[id]: …"); the phone shows it as narration
const NARRATOR_PREFIX = /^narrator(?:\s*\[[^\]]*\])?\s*:\s*/i;

/**
 * Classify one line. A line stored as 'npc' that starts `You:`/`Player:` (with text after
 * it) is the player's, and one that starts `Narrator:` is narration; anything else keeps
 * its type.
 * @param {string} type - 'npc' or 'player'
 * @param {string} text
 * @returns {{type: string, text: string}}
 */
export function classifyPhoneLine(type, text) {
    if (type !== 'npc' || typeof text !== 'string') return { type, text };
    const trimmed = text.trim();
    const narrator = trimmed.match(NARRATOR_PREFIX);
    if (narrator) {
        const rest = trimmed.slice(narrator[0].length).trim();
        return rest ? { type: 'narrator', text: rest } : { type, text };
    }
    const match = trimmed.match(PLAYER_PREFIX);
    if (!match) return { type, text };
    const rest = trimmed.slice(match[0].length).trim();
    if (!rest) return { type, text };
    return { type: 'player', text: rest };
}

/**
 * True when a step's tags make it narration (#speaker:narrator or #narrator): the last
 * speaker tag wins, as in tagsSayPlayer.
 * @param {string[]} tags
 */
export function tagsSayNarrator(tags) {
    if (!Array.isArray(tags)) return false;
    for (let i = tags.length - 1; i >= 0; i--) {
        const tag = String(tags[i]).trim().toLowerCase();
        if (tag === 'narrator' || tag === 'speaker:narrator') return true;
        if (tag === 'player' || tag === 'npc' || tag.startsWith('speaker:')) return false;
    }
    return false;
}

/**
 * True when a step's tags make it the player's line: the last speaker tag wins, as in
 * chat-helpers.js determineSpeaker (`speaker:player` / `player` vs `speaker:npc…` / `npc`).
 * @param {string[]} tags
 */
export function tagsSayPlayer(tags) {
    if (!Array.isArray(tags)) return false;
    for (let i = tags.length - 1; i >= 0; i--) {
        const tag = String(tags[i]).trim().toLowerCase();
        if (tag === 'player' || tag === 'speaker:player') return true;
        if (tag === 'npc' || tag.startsWith('speaker:')) return false;
    }
    return false;
}

/**
 * Split one ink step's text into lines. If the step is tagged as the player's (or as
 * narration), each line gets a `You: ` (or `Narrator: `) prefix unless it already has one,
 * so the line keeps its speaker through the plain-string paths (typeout, pending flush,
 * history) and classifyPhoneLine sorts it.
 * @param {string} text - one Continue() step's text
 * @param {string[]} tags - that step's tags
 * @returns {string[]}
 */
export function phoneStepLines(text, tags) {
    if (!text || !text.trim()) return [];
    const lines = text.trim().split('\n').map(line => line.trim()).filter(Boolean);
    if (tagsSayNarrator(tags)) {
        return lines.map(line => (NARRATOR_PREFIX.test(line) ? line : `Narrator: ${line}`));
    }
    if (!tagsSayPlayer(tags)) return lines;
    return lines.map(line => (PLAYER_PREFIX.test(line) ? line : `You: ${line}`));
}

const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The names a contact's own lines may be prefixed with: its displayName and its id
 * (also with underscores read as spaces), compared case-insensitively.
 * @param {{id?: string, displayName?: string}|null} contact
 * @returns {string[]}
 */
function contactNames(contact) {
    if (!contact) return [];
    const names = new Set();
    [contact.displayName, contact.id, contact.id && contact.id.replace(/_/g, ' ')]
        .forEach(name => { if (typeof name === 'string' && name.trim()) names.add(name.trim().toLowerCase()); });
    return [...names].sort((a, b) => b.length - a.length);
}

/**
 * Drop a leading "Name:" when the name is the contact's own ("Patricia Morgan: Still
 * here." in Patricia's thread). The bubble, the bark and the voice already say who is
 * talking. A prefix naming anyone else (a relayed quote) stays.
 * @param {string} text
 * @param {{id?: string, displayName?: string}|null} contact
 * @returns {string}
 */
export function stripContactPrefix(text, contact) {
    if (typeof text !== 'string') return text;
    const trimmed = text.trim();
    for (const name of contactNames(contact)) {
        const match = trimmed.match(new RegExp(`^${escapeRegExp(name)}\\s*:\\s*`, 'i'));
        if (match) {
            const rest = trimmed.slice(match[0].length).trim();
            return rest || text;
        }
    }
    return text;
}

/**
 * How a stored or printed line is shown in a contact's thread: the player's lines as
 * theirs and narration as narration (classifyPhoneLine), the contact's own name prefix dropped from its lines.
 * Applied at display time, so threads saved before either rule render cleanly too.
 * @returns {{type: string, text: string}}
 */
export function displayPhoneLine(type, text, contact) {
    const line = classifyPhoneLine(type, text);
    if (line.type === 'npc') line.text = stripContactPrefix(line.text, contact);
    return line;
}

/**
 * The text a bark (notification popup, and its voice) shows for a contact's message:
 * the player's lines and narration are left out and the contact's own name prefix is dropped.
 * Returns '' when nothing in it is the contact's, so no bark is shown.
 * @param {string} text
 * @param {{id?: string, displayName?: string}|null} contact
 * @returns {string}
 */
export function phoneBarkText(text, contact) {
    if (typeof text !== 'string') return '';
    return text.split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => displayPhoneLine('npc', line, contact))
        .filter(line => line.type === 'npc')
        .map(line => line.text.trim())
        .join('\n');
}

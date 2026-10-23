/**
 * Voiced phone calls (finale F17).
 *
 * A phone conversation opened with `voiced: true` (an event mapping or a timedConversation,
 * passed through as the minigame's params.voiced) speaks each NPC line through the server
 * TTS as it appears in the thread, and the next line waits until it has been heard or the
 * player clicks the thread to skip it, as person-chat does. Player lines and narration are
 * not voiced. A line another character speaks in the thread ("Director Netherton: …" in
 * HaX's) is voiced in that character's voice.
 *
 * The request is the one person-chat makes (TTSManager.play → POST /tts with npc_id and the
 * line text), so a line with the same text and voice uses the same cached clip. The speaker
 * and text sent mirror TtsLineExtractor#resolve on the server, which lists a voiced call's
 * lines for the batch and lets the endpoint accept a co-speaker's line.
 *
 * Only phone-chat-speaker.js is imported (it has no imports), so node tests can load this.
 */

import { otherSpeaker, callStartKnots } from './phone-chat-speaker.js';

export { callStartKnots };

/** True when the phone was opened as a voiced call. Off unless the scenario says so. */
export function isVoicedCall(params) {
    return !!params && params.voiced === true;
}

/*
 * Where a voiced call ends (F20). A call voices only the lines in its own knots: those
 * reachable from its start knots (the targetKnot of each voiced phone-chat mapping and of a
 * voiced timedConversation) by diverts, tunnels, function calls and choices, without
 * entering the contact's home knot (the knot the phone opens on outside a call: the
 * scenario's currentKnot, default "start"). Hub topics and texts outside that set stay
 * silent. TtsLineExtractor.call_knots applies the same rule to the batch.
 */
const knotName = (path) => String(path || '').split('.')[0];
const DIVERT_KEYS = ['->', '->t->', 'f()', '^->', '*'];
// callStartKnots lives in phone-chat-speaker.js so the conversation's preload can use it too

/** The knot the contact's phone opens on outside a call (registerNPC keeps it as homeKnot). */
export function callHomeKnot(npc) {
    return knotName(npc?.homeKnot || npc?.currentKnot || 'start');
}

function divertTargets(node, out) {
    if (Array.isArray(node)) {
        node.forEach(n => divertTargets(n, out));
    } else if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
            if (DIVERT_KEYS.includes(key)) {
                // Relative targets (".^.c-0") stay in the knot; a variable divert can't be followed
                if (typeof value === 'string' && !value.startsWith('.') && !node.var) out.push(value);
            } else if (value && typeof value === 'object') {
                divertTargets(value, out);
            }
        }
    }
    return out;
}

/**
 * The knots of a voiced call in a compiled ink story.
 * @param {Object} storyJson - the compiled story
 * @param {Iterable<string>} startKnots - from callStartKnots
 * @param {string} homeKnot - from callHomeKnot; never entered (unless it is a start knot)
 * @returns {Set<string>}
 */
export function voicedCallKnots(storyJson, startKnots, homeKnot) {
    const root = storyJson?.root;
    const named = Array.isArray(root) ? root[root.length - 1] : null;
    const knots = new Set();
    if (!named || typeof named !== 'object' || Array.isArray(named)) return knots;
    const known = name => name !== 'global decl' && Array.isArray(named[name]);
    const queue = [...(startKnots || [])].map(knotName).filter(known);
    while (queue.length) {
        const knot = queue.shift();
        if (knots.has(knot)) continue;
        knots.add(knot);
        for (const target of divertTargets(named[knot], [])) {
            const next = knotName(target);
            if (next !== homeKnot && known(next) && !knots.has(next)) queue.push(next);
        }
    }
    return knots;
}

// person-chat-minigame.js stripSpeakerPrefix: a leftover "Two Words: " / "Three Word Name: "
// prefix is not sent. The server's TtsLineExtractor::CLIENT_STRIP_PREFIX is the same pattern.
const STRIP_SPEAKER_PREFIX = /^(?:[A-Z][a-z]+ ){1,2}[A-Z][a-z]+:\s/;

/**
 * Who speaks a line of a voiced call, and the text sent for it.
 * @param {{type: string, text: string}} line - the line after displayPhoneLine (the contact's own prefix dropped)
 * @param {{id: string, displayName?: string, voice?: Object}} contact - the thread's contact
 * @param {Map|Object} characters - registered NPCs (npcManager.npcs), id → { id, displayName, voice }
 * @returns {{speakerId: string, text: string}|null} null when the line isn't voiced
 */
export function phoneLineVoice(line, contact, characters) {
    if (!line || line.type !== 'npc' || typeof line.text !== 'string' || !contact?.id) return null;
    const list = !characters ? []
        : (typeof characters.values === 'function' ? Array.from(characters.values()) : Object.values(characters));
    const names = list.map(c => c?.displayName).filter(Boolean);
    const other = otherSpeaker(line.text, contact, names);
    let speakerId = contact.id;
    let text = line.text.trim();
    if (other) {
        text = other.text;
        const wanted = other.name.trim().toLowerCase();
        const who = list.find(c => c?.id && c.voice && c.displayName &&
            c.displayName.trim().toLowerCase() === wanted);
        // A speaker with no voice is read in the contact's voice, as person-chat does
        if (who) speakerId = who.id;
    } else if (STRIP_SPEAKER_PREFIX.test(text)) {
        text = text.replace(/^[^:]+:\s*/, '');
    }
    if (speakerId === contact.id && !contact.voice) return null;
    if (!text.replace(/[^\w]/g, '')) return null;
    return { speakerId, text };
}

/**
 * Plays one call line at a time and waits for it. speak() resolves when the line has
 * ended, was skipped or stopped, or could not play (no clip and no key: it resolves at
 * once, so a keyless server only loses the voice, never the call).
 */
export class PhoneCallVoice {
    /**
     * @param {Object} tts - a TTSManager (play, stop, onEnded, isPlaying, setVoiceFX, destroy)
     * @param {Object} [options]
     * @param {number} [options.graceMs=1500] - extra wait past the clip's length if 'ended' never fires
     */
    constructor(tts, { graceMs = 1500 } = {}) {
        this.tts = tts;
        this.graceMs = graceMs;
        this._token = null;
        this._resolve = null;
        this._timer = null;
        this.tts.onEnded(() => this._release());
    }

    /**
     * @param {string} speakerId
     * @param {string} text
     * @param {string|Object|null} [fx] - the speaker's voice.fx, if any
     * @returns {Promise<'played'|'silent'|'skipped'>}
     */
    async speak(speakerId, text, fx = null) {
        this._release();
        const token = {};
        this._token = token;
        if (fx) this.tts.setVoiceFX(speakerId, fx);
        let duration = null;
        try {
            duration = await this.tts.play(speakerId, text);
        } catch (_) {
            duration = null;
        }
        if (this._token !== token) {
            // Skipped or stopped while the clip was being fetched: don't let it start late
            if (duration) this.tts.stop();
            return 'skipped';
        }
        if (!duration) {
            this._token = null;
            return 'silent';
        }
        if (!this.tts.isPlaying()) {
            this._token = null;
            return 'played';
        }
        await new Promise(resolve => {
            this._resolve = resolve;
            this._timer = setTimeout(() => this._release(), duration + this.graceMs);
        });
        const skipped = this._token !== token;
        if (!skipped) this._token = null;
        return skipped ? 'skipped' : 'played';
    }

    /** The player clicked the thread: stop this line and let the next one come. */
    skip() {
        if (!this._token) return;
        this._token = null;
        this.tts.stop();
        this._release();
    }

    /** The thread was left or the phone closed. */
    stop() {
        this.skip();
    }

    destroy() {
        this.stop();
        this.tts.destroy?.();
    }

    /** @private */
    _release() {
        clearTimeout(this._timer);
        this._timer = null;
        const resolve = this._resolve;
        this._resolve = null;
        if (resolve) resolve();
    }
}

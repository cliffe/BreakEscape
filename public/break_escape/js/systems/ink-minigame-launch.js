/**
 * Open a minigame from an ink tag.
 *
 *   # trigger_minigame:<type>
 *   # trigger_minigame:<type> key=value key=value
 *   # trigger_minigame:<type> \{"key":"value"\}
 *
 * <type> is a key of the starter registry (systems/minigame-registry.js): the same names an
 * object's `type` takes (mail_terminal, osint-workstation, triage-workstation,
 * authenticator-device, case-file, kiosk, page-builder, report-workstation, exercise-station).
 * The key=value pairs (separated by spaces, or by "|"), or the JSON object, become that object's
 * minigameData. A value is read as JSON when it parses as a number, true, false, null, an array,
 * an object or a quoted string, else it is the raw text. A pair's value cannot contain a space;
 * name a shared entry by id instead (for example
 * `exercise-station exerciseId=phish_sort setGlobalPrefix=drill_`) or use the JSON form.
 * Ink needs the braces of the JSON form escaped as \{ and \}; unescaped, ink reads them as logic.
 * An unknown type warns and does nothing.
 *
 * Timing and return. In a person-chat the minigame opens once the line carrying the tag has
 * been read (the same moment `exit_conversation` closes a chat). The chat is paused rather than
 * ended: a minigame that closes normally reopens the conversation where it was, with the same
 * NPC, title and options. A close that is not a normal exit (Esc on an aborting scene) leaves
 * the player in the world. A phone-chat opens it a moment after the tag is processed and
 * returns the same way. With no chat open the minigame opens at once and nothing returns.
 */

import { hasMinigameStarter, startRegisteredMinigame } from './minigame-registry.js';

const win = () => (typeof window !== 'undefined' ? window : {});
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const CHAT_SCENES = ['person-chat', 'phone-chat'];
export const TAG_NAME = 'trigger_minigame';
export const PHONE_LAUNCH_DELAY_MS = 1200;

/** One value of a key=value pair: JSON when it parses, else the raw text. */
function parseValue(raw) {
    const text = raw.trim();
    if (text === '') return '';
    try { return JSON.parse(text); } catch (e) { return text; }
}

/**
 * Parse the tag's parameter. Returns { type, minigameData } or { error }.
 * Accepts `type`, `type k=v k=v` (or `|` between pairs), `type {json}` and `type|{json}`.
 */
export function parseMinigameTag(param) {
    const text = typeof param === 'string' ? param.trim() : '';
    if (!text) return { error: 'trigger_minigame needs a minigame type' };
    const m = text.match(/^([A-Za-z0-9_-]+)[\s|]*([\s\S]*)$/);
    if (!m) return { error: `trigger_minigame: cannot read "${text}"` };
    const type = m[1];
    const rest = m[2].trim();
    if (!rest) return { type, minigameData: {} };
    if (rest.startsWith('{')) {
        try {
            const data = JSON.parse(rest);
            if (isObj(data)) return { type, minigameData: data };
        } catch (e) { /* fall through to the error */ }
        return { error: `trigger_minigame:${type}: the JSON parameters are not valid` };
    }
    const data = {};
    for (const part of rest.split(/[\s|]+/)) {
        if (!part) continue;
        const eq = part.indexOf('=');
        if (eq < 1) return { error: `trigger_minigame:${type}: "${part}" is not key=value` };
        data[part.slice(0, eq).trim()] = parseValue(part.slice(eq + 1));
    }
    return { type, minigameData: data };
}

let pending = null;
let fallbackTimer = null;

export function hasPendingInkMinigame() {
    return pending !== null;
}

export function isTriggerMinigameTag(tag) {
    return String(tag).split(':')[0].trim().toLowerCase() === TAG_NAME;
}

/** The params a chat reopens with: its own, less the knot jump and the callbacks. */
function chatReopenParams(chat) {
    const { startKnot, onComplete, returnTo, suspended, ...keep } = chat.params || {};
    return { ...keep, fromTag: true };
}

/**
 * Handle the tag. Returns { success, message } for processGameActionTags. The launch itself
 * happens later for a chat (flushInkMinigame), now when no chat is open.
 */
export function requestInkMinigame(param) {
    const w = win();
    const parsed = parseMinigameTag(param);
    if (parsed.error) {
        console.warn(`[ink minigame] ${parsed.error}`);
        return { success: false, message: `⚠️ ${parsed.error}` };
    }
    if (!hasMinigameStarter(parsed.type)) {
        console.warn(`[ink minigame] unknown minigame type "${parsed.type}"; nothing opened`);
        return { success: false, message: `⚠️ Unknown minigame type: ${parsed.type}` };
    }
    const fw = w.MinigameFramework;
    const open = fw?.currentMinigame && !fw.currentMinigame._ending ? fw.currentMinigame : null;
    const chat = open && CHAT_SCENES.includes(open._sceneType) ? open : null;
    if (open && !chat) {
        console.warn(`[ink minigame] ${open._sceneType} is open; ${parsed.type} not opened`);
        return { success: false, message: '⚠️ Another minigame is open' };
    }
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    pending = { ...parsed, chat };
    if (!chat) {
        launchPending();
    } else if (chat._sceneType !== 'person-chat') {
        fallbackTimer = setTimeout(() => { fallbackTimer = null; launchPending(); }, PHONE_LAUNCH_DELAY_MS);
    }
    return { success: true, message: `🎮 Opening minigame: ${parsed.type}` };
}

/** Called by a person-chat when the line carrying the tag has been shown. */
export function flushInkMinigame() {
    if (!pending) return false;
    return launchPending();
}

/** Forget a request that can no longer be honoured (its chat closed first). */
export function dropPendingInkMinigame() {
    pending = null;
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
}

/**
 * Open a registered minigame from a chat that is open now, without an ink tag (a "View
 * profile" link). Same pause and return as the tag: a normal close reopens the chat.
 */
export function launchMinigameFromChat(chat, type, minigameData = {}) {
    if (!chat || !CHAT_SCENES.includes(chat._sceneType) || !hasMinigameStarter(type)) return false;
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    pending = { type, minigameData, chat };
    return launchPending();
}

function launchPending() {
    const w = win();
    const request = pending;
    pending = null;
    if (!request) return false;
    const fw = w.MinigameFramework;
    const current = fw?.currentMinigame && !fw.currentMinigame._ending ? fw.currentMinigame : null;
    // The chat the tag came from was closed before its line finished: do not open over the world
    if (request.chat && current !== request.chat) {
        console.log('[ink minigame] the conversation closed first; nothing opened');
        return false;
    }
    const chat = request.chat;
    const returnTo = chat ? { sceneType: chat._sceneType, params: chatReopenParams(chat) } : null;
    try {
        startRegisteredMinigame(request.type, { minigameData: request.minigameData }, {});
    } catch (e) {
        console.error(`[ink minigame] ${request.type} failed to open:`, e);
        return false;
    }
    const opened = fw?.currentMinigame;
    if (returnTo && opened && opened !== chat && !opened._ending && opened.params) {
        opened.params.returnTo = returnTo;
    }
    return true;
}

// The chat minigames and the tag processor reach this through window, so they load without it.
if (typeof window !== 'undefined') {
    window.inkMinigameLaunch = {
        request: requestInkMinigame,
        flush: flushInkMinigame,
        launchFromChat: launchMinigameFromChat,
        dropPending: dropPendingInkMinigame,
        isTriggerTag: isTriggerMinigameTag,
        hasPending: hasPendingInkMinigame
    };
}

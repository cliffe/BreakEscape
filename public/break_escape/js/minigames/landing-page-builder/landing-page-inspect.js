// Landing-page builder: step-6 defender inspection model (SE design 07 §3 step 6, §4
// tells tables, §6 "Inspect"; packet P5-E, item 07 N5).
//
// The defender flip: the player reopens the page they sent as the victim's browser and
// finds the giveaways. This module is PURE — no DOM, no window, no globals. It turns a
// stored page record plus the page definition into the data the overlay renders: the tells
// the current choices carry, which preview region (or the "Show the link target" button)
// each belongs to, which stored tells still apply, the padlock decoy line, and the
// reassurance ("what was fine") lines for a region with no giveaway.
//
// It leans on the model's scorePage() so the defender strings and {shown}/{real} filling
// have one source of truth (07 §4: the per-factor step-6 defender line is scorePage's
// tells[].line). Step 6 recomputes the tells from the CURRENT choices and counts only the
// stored tellsFound ids that still apply to them (07 §3).
//
// 07 N5 asks this file to export buildSuspectPage and the step-6 "tells table" so the
// triage defender (05) can offer an "inspect this page" item from the same record and
// strings. The lab has no such item (OQ6); the exports exist for a later awareness set.

import { scorePage, DEFAULT_STRINGS, TELL_IDS } from './landing-page-model.js';

// The step-6 tells table (07 N5): which preview region, or the link control, each tell id
// belongs to. The five preview regions are address, padlock, logo, wording and form
// (07 §6); hoverMismatch has no preview element and lives behind the "Show the link
// target" button (07 §4, §6). brand and purpose have no region of their own: the wrong
// service shows in the logo, and the page's stated purpose shows in the wording.
export const TELL_REGIONS = Object.freeze({
    brand: 'logo',
    purpose: 'wording',
    domain: 'address',
    logo: 'logo',
    wording: 'wording',
    form: 'form',
    padlock: 'padlock',
    formOrigin: 'form',
    hoverMismatch: 'link'
});

// 07 N5 names the export "the tells table"; it is the region map above.
export const tells = TELL_REGIONS;

// The five selectable preview regions (07 §6), in reading order.
export const INSPECT_REGIONS = Object.freeze(['address', 'padlock', 'logo', 'wording', 'form']);

// Built-in reassurance lines for a region with no giveaway on this page — a "wrong pick"
// says what was fine (07 §6). Chrome text only: no authored domain or address, so no
// placeholder and no readable font. The lesson is that a clean part is not proof.
export const FINE_LINES = Object.freeze({
    address: 'Nothing is obviously wrong in the address here — but the address is the one thing to read most carefully.',
    padlock: 'The padlock is shown. That is not reassurance — tap it to see why.',
    logo: 'The logo looks right. But any logo is easy to copy, so it never proves a page is genuine.',
    wording: 'The wording reads cleanly. Good spelling is not proof either; a careful forger gets it right.',
    form: 'The form looks ordinary for a sign-in.'
});
export const FINE_FALLBACK = 'That part looks fine on this page.';

function isObj(v) { return v != null && typeof v === 'object' && !Array.isArray(v); }

function resolveString(pageDef, key) {
    const over = isObj(pageDef) && isObj(pageDef.strings) ? pageDef.strings[key] : undefined;
    if (typeof over === 'string' && over.length) return over;
    const def = DEFAULT_STRINGS[key];
    return typeof def === 'string' ? def : '';
}

/**
 * Build the inspection view for a stored page record (07 §3 step 6, §4).
 *
 * @param {object} pageDef  the social.landingPages entry (brands, strings, linkText, ...)
 * @param {object} record   the persisted page record; its `choices` are the current
 *                          choices to inspect, and `tellsFound` the stored progress
 * @param {object|string} target  the 04 target id, or { id, firstName } for {firstName}
 * @returns {{
 *   blocked: boolean,
 *   padlockOn: boolean,
 *   tells: Array<{ id, line, region }>,     // every giveaway the current choices carry
 *   tellsById: object,                       // id -> { id, line, region }
 *   byRegion: object,                        // region -> [tell, ...] ('link' for the button)
 *   presentIds: string[],                    // ids of every tell above
 *   found: string[],                         // stored tellsFound that still apply
 *   allFound: boolean,
 *   padlockDecoyLine: string,                // shown when the padlock (a decoy) is tapped
 *   fineLines: object, fineFallback: string  // "what was fine" lines, by region
 * }}
 *
 * A blocked domain (runtime guard, 07 N6b) has no page to inspect: `blocked` is true and
 * the tell lists are empty.
 */
export function buildSuspectPage(pageDef, record, target) {
    const choices = isObj(record) && isObj(record.choices) ? record.choices : {};
    const padlockOn = choices.padlock === true;
    const padlockDecoyLine = resolveString(pageDef, 'padlockDecoy');

    const result = scorePage(pageDef, choices, target);
    if (!result || result.blocked) {
        return {
            blocked: true, padlockOn, tells: [], tellsById: {}, byRegion: {},
            presentIds: [], found: [], allFound: false,
            padlockDecoyLine, fineLines: FINE_LINES, fineFallback: FINE_FALLBACK
        };
    }

    const list = (Array.isArray(result.tells) ? result.tells : []).map((t) => ({
        id: t.id, line: t.line, region: TELL_REGIONS[t.id] || null
    }));
    const tellsById = {};
    const byRegion = {};
    for (const t of list) {
        tellsById[t.id] = t;
        const region = t.region || 'other';
        (byRegion[region] = byRegion[region] || []).push(t);
    }
    const presentIds = list.map((t) => t.id);

    const stored = Array.isArray(record && record.tellsFound) ? record.tellsFound : [];
    const found = stored.filter((id) => TELL_IDS.includes(id) && presentIds.includes(id));

    return {
        blocked: false, padlockOn, tells: list, tellsById, byRegion, presentIds,
        found, allFound: presentIds.length > 0 && presentIds.every((id) => found.includes(id)),
        padlockDecoyLine, fineLines: FINE_LINES, fineFallback: FINE_FALLBACK
    };
}

export default buildSuspectPage;

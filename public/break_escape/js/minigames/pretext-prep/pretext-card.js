// Pretext card model (06 beats 1 and 2, N5, N6). Pure: no DOM, no globals.
//
// A line's `blanks` map is blank name → fact id (06 §5). The card stores the
// player's choice by fact id, as `{ value, label }`, which is what
// fillPretextVars reads (`pretext_<fact>_name` / `_value`).
//
// Options come from held facts only, through the mail composer's slot filter
// (01 N10, the same widget's rules). The JSON does not store a blank's type or
// about. Those are taken from the provides entries whose value is the fact's
// canonical `knows` value. When a tagged entry exists, untagged ones are
// dropped, and if several abouts remain the one equal to the fact id wins.
// That keeps a team blank on `about: "intern"` and off an untagged `finance`
// (06 §5, the Dev note).

import { heldFactIds, heldProvides, optionsForSlot } from '../mail-client/mail-composer.js';

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

/** "startDate" / "old_org" → "Start date" / "Old org". A label, not a value. */
export function factLabel(factId) {
    const spaced = String(factId).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * One row per fact any line feeds, in first-seen order.
 * @returns {{ factId: string, blankNames: string[], lineIds: string[] }[]}
 */
export function cardFacts(spec) {
    const lines = isObject(spec?.lines) ? spec.lines : {};
    const order = [];
    const byFact = new Map();
    for (const [lineId, line] of Object.entries(lines)) {
        if (!isObject(line?.blanks)) continue;
        for (const [blankName, factId] of Object.entries(line.blanks)) {
            if (!isStr(factId)) continue;
            let row = byFact.get(factId);
            if (!row) {
                row = { factId, blankNames: [], lineIds: [] };
                byFact.set(factId, row);
                order.push(factId);
            }
            if (isStr(blankName) && !row.blankNames.includes(blankName)) row.blankNames.push(blankName);
            if (!row.lineIds.includes(lineId)) row.lineIds.push(lineId);
        }
    }
    return order.map((id) => byFact.get(id));
}

/**
 * Slot filter for one fact, or null when the catalogue has no provides entry
 * for the canonical value (the blank then offers nothing).
 * @returns {{ type: string, about: string|null }|null}
 */
export function blankSlot(factId, spec, intelFacts) {
    const known = isObject(spec?.knows) ? spec.knows[factId] : null;
    const canonical = isStr(known?.value) ? known.value : null;
    if (!canonical) return null;
    const facts = isObject(intelFacts) ? intelFacts : {};
    const matches = [];
    for (const fact of Object.values(facts)) {
        const provides = Array.isArray(fact?.provides) ? fact.provides : [];
        for (const entry of provides) {
            if (isObject(entry) && entry.value === canonical && isStr(entry.type)) matches.push(entry);
        }
    }
    if (!matches.length) return null;
    const tagged = matches.filter((entry) => isStr(entry.about));
    const pool = tagged.length ? tagged : matches;
    const preferred = pool.find((entry) => entry.about === factId) || pool[0];
    return { type: preferred.type, about: isStr(preferred.about) ? preferred.about : null };
}

/** Held options for one fact: [{ value, label, kind }]. Nothing invented. */
export function optionsForFact(factId, spec, social, globals) {
    const intelFacts = isObject(social?.intelFacts) ? social.intelFacts : {};
    const slot = blankSlot(factId, spec, intelFacts);
    if (!slot) return [];
    const entries = heldProvides(heldFactIds(intelFacts, globals), intelFacts);
    const people = Array.isArray(social?.people) ? social.people : [];
    return optionsForSlot({ type: slot.type, about: slot.about }, { entries, people });
}

/** Board sentences for facts the player holds. Unheld facts are absent. */
export function heldOnBoard(social, globals) {
    const intelFacts = isObject(social?.intelFacts) ? social.intelFacts : {};
    return heldFactIds(intelFacts, globals)
        .map((id) => ({ id, text: intelFacts[id]?.text }))
        .filter((row) => isStr(row.text));
}

/**
 * Brief copy. Scope, objectives and an ethics line are used only when the
 * call or the engagement authors them. The fallback ethics line states the
 * blank rule and names no company.
 */
export function briefCopy(spec, social) {
    const brief = isObject(spec?.brief) ? spec.brief : {};
    const engagement = isObject(social?.engagement) ? social.engagement : {};
    const scope = firstString(brief.scope, spec?.scope, engagement.scopeNote);
    const ethics = firstString(brief.ethics, spec?.ethics) || 'Use only details you have found. Do not invent one.';
    const objectives = Array.isArray(brief.objectives) ? brief.objectives.filter(isStr) : [];
    const characterId = isStr(spec?.character) ? spec.character : '';
    const character = isObject(social?.characters) ? social.characters[characterId] : null;
    const characterName = isStr(character?.displayName) ? character.displayName : '';
    return { scope, ethics, objectives, characterName };
}

function firstString(...values) {
    return values.find(isStr) || '';
}

/**
 * Lines that author a `text` with `{factId}` gaps. The slice leaves wording in
 * the ink, so this is empty unless a line carries text.
 * @returns {{ lineId: string, text: string }[]}
 */
export function cardLines(spec) {
    const lines = isObject(spec?.lines) ? spec.lines : {};
    const out = [];
    for (const [lineId, line] of Object.entries(lines)) {
        if (isStr(line?.text)) out.push({ lineId, text: line.text });
    }
    return out;
}

/** Split a line's text into literal runs, a chosen label, or an empty gap. */
export function textParts(text, factIds, labelFor) {
    const ids = new Set(factIds);
    const parts = [];
    const re = /\{([A-Za-z0-9_]+)\}/g;
    let last = 0;
    let match;
    while ((match = re.exec(text))) {
        if (match.index > last) parts.push({ kind: 'text', text: text.slice(last, match.index) });
        const id = match[1];
        if (ids.has(id)) {
            const label = labelFor(id);
            parts.push(isStr(label) ? { kind: 'value', text: label } : { kind: 'gap', text: '____' });
        } else {
            parts.push({ kind: 'text', text: match[0] });
        }
        last = match.index + match[0].length;
    }
    if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
    return parts;
}

/** Blanks that have no held option. Names the blank, not a value. */
export function readinessLines(facts, optionsByFact) {
    return facts
        .filter((fact) => (optionsByFact[fact.factId] || []).length === 0)
        .map((fact) => `${factLabel(fact.factId)}: nothing held yet`);
}

/**
 * The call can start once every blank that has options is filled. A blank with
 * nothing held does not block: that line cannot be filled, and the call still
 * has lines with no blanks. An unfilled blank that does have options blocks,
 * and the line names the blank, not the missing value.
 */
export function callGate(facts, optionsByFact, chosen) {
    for (const fact of facts) {
        const options = optionsByFact[fact.factId] || [];
        if (options.length === 0) continue;
        const value = chosen?.[fact.factId];
        if (!options.some((option) => option.value === value)) {
            return { ok: false, reason: 'unchosen', line: `Choose an option for the ${factLabel(fact.factId)} blank` };
        }
    }
    return { ok: true, reason: null, line: '' };
}

/** `{ factId: { value, label } }` for the facts the player has filled. */
export function blanksPayload(facts, optionsByFact, chosen) {
    const out = {};
    for (const fact of facts) {
        const options = optionsByFact[fact.factId] || [];
        const picked = options.find((option) => option.value === chosen?.[fact.factId]);
        if (!picked) continue;
        out[fact.factId] = { value: picked.value, label: picked.label };
    }
    return out;
}

/**
 * What opening the chat needs. Phone records open phone-chat; any other record
 * opens person-chat. No channel field: the record's npcType decides.
 * @returns {{ scene: string, params: object }|null}
 */
export function callLaunch(spec, npc, npcId, blanks) {
    if (!npc || !isStr(npcId)) return null;
    const scene = npc.npcType === 'phone' ? 'phone-chat' : 'person-chat';
    const startKnot = isStr(spec?.startKnot) ? spec.startKnot : (isStr(npc.currentKnot) ? npc.currentKnot : 'start');
    const params = {
        npcId,
        startKnot,
        pretextCallId: isStr(spec?.callId) ? spec.callId : null,
        blanks,
        requiresKeyboardInput: true
    };
    if (isStr(npc.displayName)) params.title = npc.displayName;
    return { scene, params };
}

const KIND_TEXT = { distinctive: 'a specific, insider detail', stale: 'may be out of date' };

/** Plain words for a non-generic kind, matching the mail picker. */
export function kindText(kind) {
    return KIND_TEXT[kind] || '';
}

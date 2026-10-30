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

/**
 * A fact whose every blank value is stale, or one flagged `stale: true`. Kept in step with
 * board-model.js isStaleFact (duplicated rather than imported so this module stays free of
 * the intel-board dependency, matching the "pure, no DOM, no globals" note above).
 */
function isStaleFact(fact) {
    if (!fact) return false;
    if (fact.stale === true) return true;
    const p = Array.isArray(fact.provides) ? fact.provides : [];
    return p.length > 0 && p.every((e) => e && e.kind === 'stale');
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

/** "startDate" / "old_org" → "Start date" / "Old org". A label, not a value. `given` (intelFacts[id].label) wins. */
export function factLabel(factId, given = null) {
    if (isStr(given)) return given;
    const spaced = String(factId).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The overlay's own wording. `prepLabels` on the call entry overrides each piece; `approachTitle`
 * is the heading for an in-person approach (default: same as `title`).
 */
export function callWords(spec, npc = null) {
    const l = isObject(spec?.prepLabels) ? spec.prepLabels : {};
    const pick = (k, d) => (isStr(l[k]) ? l[k] : d);
    const title = pick('title', 'Prepare the call');
    return {
        title: npc && npc.npcType !== 'phone' ? pick('approachTitle', title) : title,
        heldTitle: pick('heldTitle', 'On the board'),
        heldEmpty: pick('heldEmpty', 'Nothing on the board yet.')
    };
}

/**
 * One row per fact any line feeds, in first-seen order.
 * @returns {{ factId: string, blankNames: string[], lineIds: string[] }[]}
 */
export function cardFacts(spec, social = null) {
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
    const facts = isObject(social?.intelFacts) ? social.intelFacts : {};
    return order.map((id) => {
        const row = byFact.get(id);
        if (isStr(facts[id]?.label)) row.label = facts[id].label;
        return row;
    });
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

/**
 * Board sentences for facts the player holds. Unheld facts are absent. `stale` mirrors
 * the intel board's "Old or unverified" marking (board-model isStaleFact) so the call-prep
 * list carries the same warning the board does (R2 F1-F5: a 2019 org chart must not read
 * as current in the prep panel).
 */
export function heldOnBoard(social, globals) {
    const intelFacts = isObject(social?.intelFacts) ? social.intelFacts : {};
    return heldFactIds(intelFacts, globals)
        .map((id) => ({ id, text: intelFacts[id]?.text, stale: isStaleFact(intelFacts[id]) }))
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
/** The intel fact ids the player holds (for cardLines' `requires` gate). */
export function heldIdsFor(social, globals) {
    return heldFactIds(isObject(social?.intelFacts) ? social.intelFacts : {}, globals);
}

export function cardLines(spec, held = null) {
    const lines = isObject(spec?.lines) ? spec.lines : {};
    const out = [];
    for (const [lineId, line] of Object.entries(lines)) {
        if (!isStr(line?.text)) continue;
        // A line that rests on something the player must find first (`requires`: intel fact
        // ids, e.g. "The Head of Claims needs me back..." needs the org chart) stays off the
        // card until every one is held, so the card never offers a fact nobody has found
        // under "Use only details you have found" (P3 N9). `held` is the held fact-id list;
        // without one (an old caller) nothing is filtered.
        const req = Array.isArray(line.requires) ? line.requires.filter(isStr) : [];
        if (held && req.some((id) => !held.includes(id))) continue;
        out.push({ lineId, text: line.text });
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
        .map((fact) => `${factLabel(fact.factId, fact.label)}: nothing held yet`);
}

/**
 * The call can start once every blank that has options is filled. A blank with
 * nothing held does not block: that line cannot be filled, and the call still
 * has lines with no blanks. An unfilled blank that does have options blocks,
 * and the line names the blank, not the missing value.
 */
export function callGate(facts, optionsByFact, chosen, opts = {}) {
    for (const fact of facts) {
        const options = optionsByFact[fact.factId] || [];
        if (options.length === 0) continue;
        const value = chosen?.[fact.factId];
        if (!options.some((option) => option.value === value)) {
            return { ok: false, reason: 'unchosen', line: `Choose an option for the ${factLabel(fact.factId, fact.label)} blank` };
        }
    }
    // E12 B2 row 6 (opt-in): require at least one fact before the approach/call, so a learner who
    // found nothing is sent back to research rather than approaching with an empty pretext. Default
    // off → approaching with nothing held still works (the call degrades gracefully). A fact is
    // held when a blank has a chosen value among its available options.
    if (opts && opts.requireFact === true) {
        const anyChosen = facts.some((fact) => {
            const options = optionsByFact[fact.factId] || [];
            return options.some((option) => option.value === chosen?.[fact.factId]);
        });
        if (!anyChosen) {
            return { ok: false, reason: 'noFacts',
                line: (typeof opts.line === 'string' && opts.line) ? opts.line : 'Go back and research first: you need at least one fact to go on.' };
        }
    }
    return { ok: true, reason: null, line: '' };
}

/**
 * The hint for this attempt (06 §4.5). The ladder advances on each failed call
 * (reported, refused, or walked away with nothing granted; not a `got_it`): the
 * first failure shows hints[0], the second hints[1], and further failures stay on
 * the last line. No failed call yet, or no hints authored, means no line. The
 * counter is `pretext_<callId>_reports`, written by finalisePretext.
 */
export function hintLine(spec, globals) {
    const hints = Array.isArray(spec?.hints) ? spec.hints.filter((h) => typeof h === 'string' && h) : [];
    if (!hints.length || !isStr(spec?.callId)) return '';
    const n = Number(globals?.[`pretext_${spec.callId}_reports`]);
    const count = Number.isFinite(n) ? n : 0;
    if (count < 1) return '';
    return hints[Math.min(count - 1, hints.length - 1)];
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
    // A phone contact marked `voiced: true` speaks its call lines through TTS (F17)
    if (scene === 'phone-chat' && npc.voiced === true) params.voiced = true;
    return { scene, params };
}

// No kind tag on any option. "an older detail" marked the stale decoy as the trap (lab R14 m1),
// and "a specific detail" then marked every right answer, since only the true facts are
// distinctive (lab R15 N4: Xero and the plumbing J. Baker carried no tag). The kind still
// drives the judge's scoring; the student has to tell the options apart from the board.
const KIND_TEXT = {};

/** Plain words for an option's kind. Empty for every kind, so options carry no tag. */
export function kindText(kind) {
    return KIND_TEXT[kind] || '';
}

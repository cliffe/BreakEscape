// Awareness episode model (SE design 11 N1; PHASE7_PACKETS §2.1 to §2.3). Pure: no DOM,
// no globals written. The runner (episode-runner-minigame.js) and the starter
// (systems/episode-starter.js) build on it, and the Node tests load it alone.
//
//   stagesFor(episode)            the stage ids this episode runs, in order
//   nextStage(episode, state)     the first of those not yet done, or null when finished
//   stateKey(id)                  'episode_<id>_state', the runner's state global
//   defendPrefix(id)              'episode_<id>_defend_', the defend set's global prefix
//   readState(episode, raw)       a clean state from the stored global (or a fresh one)
//   completeStage(episode, state, stageId, patch)   the state after a stage ends
//   childLaunch(episode, stage)   what the stage opens: osint, build, mail or call, mfa,
//                                 mistake (the consequence sandbox), triage or nothing
//   mistakeBeats(episode)         the authored consequence beats, cleaned (ENG-04)
//   montageProps(episode, choices)  what the montage flip shows: every beat with the line for the
//                                 learner's option, else the unsafe option's (ENG-04)
//   writeKind(episode)            'call' when attack.callId is set (E3), else 'mail'
//   sentFromRecord(rec, targetId) the ids the write stage holds for the flip
//   sentFromCall(callId, outcome) the same for a pretext call
//   flipPage(episode, social, globals)  the built page the flip shows (E5), or null
//   flipCall(episode, social, sent)     the call the flip shows (E3), or null
//   flipAftermathFor(episode, { landed })  the victim's-seat block the flip adds after a landed attack, or null
//   measurementCtx(episode, set, launchStage, now)   ctx for recordTriageResult
//   teamProtectedOf(result)       the "team kept safe" tally (aw6): phish reported or checked
//   awarenessSettings(social, config)  the scenario's social.awareness block, with the host
//                                 page's breakEscapeConfig.awareness winning (aw1, aw4, aw6)
//   reportRouteFor(episode, social, config)  the debrief's "How to report here" box (aw1)
//
// Stage order (P7-X lints it): osint -> build? -> write (mail or call) -> mfa? -> flip -> defend.
// `mfa` may also sit straight after `flip`. `build` and `mfa` are attack stages.

import { fieldLabel } from '../landing-page-builder/landing-page-model.js';

export const STAGE_IDS = Object.freeze(['brief', 'osint', 'build', 'write', 'mfa', 'mistake', 'flip', 'defend', 'debrief', 'check']);
export const ATTACK_STAGES = Object.freeze(['osint', 'build', 'write', 'mfa', 'mistake', 'flip']);
/** The pretext call's outcome that counts as landed (06 N7). */
export const CALL_LANDED = 'got_it';
export const DEFAULT_STAGES = Object.freeze({
    full: Object.freeze(['brief', 'osint', 'write', 'flip', 'defend', 'debrief']),
    defendOnly: Object.freeze(['brief', 'defend', 'debrief']),
    check: Object.freeze(['check'])
});
export const STATE_VERSION = 1;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

export const stateKey = (id) => `episode_${id}_state`;
export const defendPrefix = (id) => `episode_${id}_defend_`;

/** 'full' or 'defendOnly' (anything else reads as 'full'). */
export function variantOf(episode) {
    return episode?.variant === 'defendOnly' ? 'defendOnly' : 'full';
}

/** A check mission: its stages list names 'check'. */
export function isCheck(episode) {
    return Array.isArray(episode?.stages) && episode.stages.includes('check');
}

/**
 * The stages this episode runs. A check mission runs ['check'] only. Otherwise
 * the authored list in order, keeping known ids once each; a defendOnly episode
 * never runs the attack stages, whatever is authored. With no usable list, the
 * variant's default.
 */
export function stagesFor(episode) {
    if (isCheck(episode)) return [...DEFAULT_STAGES.check];
    const variant = variantOf(episode);
    const authored = Array.isArray(episode?.stages) ? episode.stages : [];
    const seen = new Set();
    const out = [];
    for (const id of authored) {
        if (!STAGE_IDS.includes(id) || id === 'check' || seen.has(id)) continue;
        if (variant === 'defendOnly' && ATTACK_STAGES.includes(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out.length ? out : [...DEFAULT_STAGES[variant]];
}

/** The first stage of stagesFor(episode) not in state.done, or null when every one is done. */
export function nextStage(episode, state) {
    const done = Array.isArray(state?.done) ? state.done : [];
    return stagesFor(episode).find((s) => !done.includes(s)) ?? null;
}

function cleanSent(raw) {
    if (!isObj(raw)) return null;
    if (raw.kind === 'call') {
        // A pretext call (E3): its id and how it ended, nothing the learner said.
        return {
            kind: 'call',
            callId: isStr(raw.callId) ? raw.callId : null,
            outcome: isStr(raw.outcome) ? raw.outcome : null
        };
    }
    return {
        recordId: isStr(raw.recordId) ? raw.recordId : null,
        targetId: isStr(raw.targetId) ? raw.targetId : null,
        templateId: isStr(raw.templateId) ? raw.templateId : null,
        blankIds: Array.isArray(raw.blankIds) ? raw.blankIds.filter(isStr) : []
    };
}

/** The consequence sandbox's choices: { <beatId>: <optionId> }, strings only; null when there are none. */
export function cleanMistake(raw) {
    if (!isObj(raw)) return null;
    const out = {};
    for (const [beat, option] of Object.entries(raw)) {
        if (isStr(beat) && isStr(option)) out[beat] = option;
    }
    return Object.keys(out).length ? out : null;
}

// ── the sort drill (ENG-11) ──────────────────────────────────────────────────────
// `episode.sortDrill` runs first inside the defend stage (the 'sort-drill' scene). The runner keeps
// only a small record of it (counts, no card text) in the state, so a reopen skips the drill. An
// episode with no usable `sortDrill` has no drill step: drillPending is false and the defend stage
// opens the triage set exactly as before.

const DRILL_LAUNCH = Object.freeze({
    heading: 'Sort the cards',
    text: 'Before the inbox, sort a set of cards into their bins. The reason shows after each one.',
    button: 'Open the cards'
});

/** The drill's config when it holds two or more bins and a card, else null. */
export function drillConfigOf(episode) {
    const d = episode?.sortDrill;
    return isObj(d) && Array.isArray(d.bins) && d.bins.length >= 2 && Array.isArray(d.cards) && d.cards.length ? d : null;
}

/** The drill is still to do: the defend stage is current and no record is held. */
export function drillPending(episode, state) {
    return !!drillConfigOf(episode) && state?.stage === 'defend' && state?.drill?.done !== true;
}

/** The launch panel before the drill; `sortDrill.strings.launchHeading|launchText|launchButton` replace each line. */
export function drillLaunchCopy(episode) {
    const own = isObj(episode?.sortDrill?.strings) ? episode.sortDrill.strings : {};
    const line = (key, fallback) => (isStr(own[key]) ? own[key] : fallback);
    return { heading: line('launchHeading', DRILL_LAUNCH.heading), text: line('launchText', DRILL_LAUNCH.text),
        button: line('launchButton', DRILL_LAUNCH.button) };
}

/** The params the 'sort-drill' scene starts with. */
export function drillLaunchParams(episode, overrides = null, extra = {}) {
    return { config: episode.sortDrill, ...(isObj(overrides) ? { overrides } : {}), skin: 'awareness', ...extra };
}

/** The record to keep from the drill's result: counts only. */
export function drillRecord(result) {
    return isObj(result) ? cleanDrill({ ...result, done: true }) : null;
}

/** ENG-11: the sort drill's small record (counts only), kept in the state so a reopen skips the drill. */
function cleanDrill(raw) {
    if (!isObj(raw) || raw.done !== true) return null;
    const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    const out = { done: true, scored: raw.scored === true, total: num(raw.total), placed: num(raw.placed) };
    if (out.scored) {
        out.correct = num(raw.correct);
        out.percent = num(raw.percent);
        if (isStr(raw.answerKeyProfile)) out.answerKeyProfile = raw.answerKeyProfile;
    }
    return out;
}

function cleanDefend(raw) {
    if (!isObj(raw)) return null;
    const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    const out = { percent: num(raw.percent), reportRate: num(raw.reportRate), verifyCount: num(raw.verifyCount) };
    // aw6: the team tally survives a reopen of the debrief. Kept only when the source has it
    // (a stored count, or a triage result with its report and check counts).
    const team = teamProtectedOf(raw);
    if (team !== null) out.teamProtected = team;
    return out;
}

/**
 * aw6: how many phish the learner reported or checked by another route this round (the
 * "team kept safe" tally). Deleting a phish protects only the learner, so it is not counted.
 * Reads a stored `teamProtected`, else the triage result's reportCount + phishVerified;
 * null when neither is there.
 */
export function teamProtectedOf(raw) {
    if (!isObj(raw)) return null;
    const n = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);
    if (n(raw.teamProtected) !== null) return n(raw.teamProtected);
    if (n(raw.reportCount) === null) return null;
    return n(raw.reportCount) + (n(raw.phishVerified) ?? 0);
}

/**
 * A clean state from the stored global. Unknown or out-of-list stage ids are
 * dropped, so a reopen always resumes at a stage this episode runs. A missing
 * or empty global gives a fresh state at the first stage.
 */
export function readState(episode, raw) {
    const stages = stagesFor(episode);
    const src = isObj(raw) ? raw : {};
    const done = [];
    for (const id of Array.isArray(src.done) ? src.done : []) {
        if (stages.includes(id) && !done.includes(id)) done.push(id);
    }
    const state = {
        v: STATE_VERSION,
        variant: variantOf(episode),
        stage: null,
        done,
        sent: cleanSent(src.sent),
        defend: cleanDefend(src.defend)
    };
    // Only a consequence episode holds choices (ENG-04); other states keep their exact shape.
    const mistakeChoices = cleanMistake(src.mistakeChoices);
    if (mistakeChoices) state.mistakeChoices = mistakeChoices;
    // Only an episode with a sort drill carries the key, so every other state is unchanged.
    const drill = cleanDrill(src.drill);
    if (drill) state.drill = drill;
    state.stage = nextStage(episode, state);
    return state;
}

/**
 * The state after `stageId` ends: it joins `done`, `stage` moves to the next
 * stage not done (null when finished), and `patch` (sent, defend, mistakeChoices) is merged.
 * The flip clears `sent` and `mistakeChoices`: they are held only to feed the flip (11 §5.2).
 */
export function completeStage(episode, state, stageId, patch = {}) {
    const base = readState(episode, state);
    const done = base.done.includes(stageId) || !stagesFor(episode).includes(stageId)
        ? base.done : [...base.done, stageId];
    const next = { ...base, done };
    if ('sent' in patch) next.sent = cleanSent(patch.sent);
    if ('defend' in patch) next.defend = cleanDefend(patch.defend);
    if ('drill' in patch) { const drill = cleanDrill(patch.drill); if (drill) next.drill = drill; }
    if ('mistakeChoices' in patch) {
        const choices = cleanMistake(patch.mistakeChoices);
        if (choices) next.mistakeChoices = choices;
        else delete next.mistakeChoices;
    }
    if (stageId === 'flip') {
        next.sent = null;
        delete next.mistakeChoices;
    }
    next.stage = nextStage(episode, next);
    return next;
}

/** How the write stage attacks: 'call' (a pretext call, attack.callId) or 'mail'. */
export function writeKind(episode) {
    return isStr(episode?.attack?.callId) ? 'call' : 'mail';
}

/**
 * What a stage opens (§2.3). Every launch carries only this episode's own ids.
 *   { kind: 'osint', sceneType: 'osint-browser', params: { siteIds } }
 *   { kind: 'build', sceneType: 'landing-page-builder', params: { landingPageId, targetId } }
 *   { kind: 'mail', sceneType: 'mail-client', params: { accountIds, defaultAccount, maxSends: 1, layout? } }
 *   { kind: 'call', sceneType: 'pretext-prep', params: { callId } }  (write, when attack.callId is set)
 *   { kind: 'mfa', sceneType: 'authenticator', params: { pushes, approvesAt, mode } }  (from episode.mfa)
 *   { kind: 'mistake', sceneType: 'consequence-sandbox', params: { config, strings? } }  (from episode.mistake)
 *   { kind: 'triage', options: { triageSetId, stage?, conclusionTaskId } }
 *   null for brief, flip and debrief (drawn by the runner itself)
 */
export function childLaunch(episode, stage) {
    const attack = isObj(episode?.attack) ? episode.attack : {};
    const defend = isObj(episode?.defend) ? episode.defend : {};
    if (stage === 'osint') {
        return { kind: 'osint', sceneType: 'osint-browser',
                 params: { siteIds: Array.isArray(attack.siteIds) ? [...attack.siteIds] : [] } };
    }
    if (stage === 'build') {
        return { kind: 'build', sceneType: 'landing-page-builder',
                 params: { landingPageId: isStr(attack.landingPageId) ? attack.landingPageId : null,
                           targetId: isStr(attack.target) ? attack.target : null } };
    }
    if (stage === 'mfa') {
        const mfa = isObj(episode?.mfa) ? episode.mfa : {};
        const params = { pushes: Array.isArray(mfa.pushes) ? mfa.pushes.filter(isObj).map((p) => ({ ...p })) : [],
                         approvesAt: mfa.approvesAt ?? null,
                         mode: isStr(mfa.mode) ? mfa.mode : 'attacker' };
        // Decision mode (E3-11): the learner picks when and how many. Forwarded only when authored
        // so the scripted-demo shape stays { pushes, approvesAt, mode }.
        if (isObj(mfa.choice)) params.choice = mfa.choice;
        if (isObj(mfa.pushTemplate)) params.pushTemplate = mfa.pushTemplate;
        if (isStr(mfa.defenderNote)) params.defenderNote = mfa.defenderNote;
        if (isObj(mfa.strings)) params.strings = mfa.strings;
        return { kind: 'mfa', sceneType: 'authenticator', params };
    }
    if (stage === 'mistake') {
        if (!isObj(episode?.mistake)) return null;
        const params = { config: episode.mistake };
        // strings.sandbox { intro?, progress?, confirm?, next?, finish? } over the scene's own lines.
        if (isObj(episode.strings?.sandbox)) params.strings = episode.strings.sandbox;
        return { kind: 'mistake', sceneType: 'consequence-sandbox', params };
    }
    if (stage === 'write' && writeKind(episode) === 'call') {
        return { kind: 'call', sceneType: 'pretext-prep', params: { callId: attack.callId } };
    }
    if (stage === 'write') {
        const params = {
            accountIds: Array.isArray(attack.accountIds) ? [...attack.accountIds] : [],
            defaultAccount: attack.defaultAccount ?? null,
            maxSends: 1
        };
        if (isStr(attack.layout)) params.layout = attack.layout;
        return { kind: 'mail', sceneType: 'mail-client', params };
    }
    if (stage === 'defend' || stage === 'check') {
        const options = { triageSetId: defend.setId ?? null, conclusionTaskId: episode?.conclusionTaskId ?? null };
        if (isStr(defend.stage)) options.stage = defend.stage;
        return { kind: 'triage', options };
    }
    return null;
}

/**
 * The consequence beats (ENG-04), cleaned: [{ id, situation, options: [{ id, label, safe, approvedRoute }] }].
 * A beat without an id, or an option without an id, is dropped. Empty when `episode.mistake` is absent.
 */
export function mistakeBeats(episode) {
    const beats = isObj(episode?.mistake) && Array.isArray(episode.mistake.beats) ? episode.mistake.beats : [];
    return beats.filter((b) => isObj(b) && isStr(b.id)).map((b) => ({
        id: b.id,
        situation: isStr(b.situation) ? b.situation : '',
        options: (Array.isArray(b.options) ? b.options : []).filter((o) => isObj(o) && isStr(o.id)).map((o) => ({
            id: o.id, label: isStr(o.label) ? o.label : o.id, safe: o.safe === true, approvedRoute: o.approvedRoute === true
        }))
    }));
}

/**
 * What the montage flip shows (ENG-04). One entry per beat, in the authored order, with the line
 * from strings.flipMontageByChoice[beatId][optionId] for the option the learner took; when that
 * option has no line (or the beat was not taken) the beat's unsafe option's line stands in, so a
 * careful learner still sees the cost. `taken` is true when the option shown is the one the learner took.
 *   { montage: true, flipBeat, beats: [{ id, situation, optionId, taken, safe, line }], lines: { <beatId>: line } }
 */
export function montageProps(episode, choices = null) {
    const byChoice = isObj(episode?.strings?.flipMontageByChoice) ? episode.strings.flipMontageByChoice : {};
    const picked = isObj(choices) ? choices : {};
    const beats = mistakeBeats(episode).map((beat) => {
        const lines = isObj(byChoice[beat.id]) ? byChoice[beat.id] : {};
        const own = beat.options.find((o) => o.id === picked[beat.id]);
        const unsafe = beat.options.find((o) => !o.safe) ?? null;
        const useOwn = !!own && isStr(lines[own.id]);
        const shown = useOwn ? own : unsafe;
        return {
            id: beat.id, situation: beat.situation,
            optionId: shown?.id ?? null, taken: !!own && shown?.id === own.id, safe: shown?.safe === true,
            line: shown && isStr(lines[shown.id]) ? lines[shown.id] : ''
        };
    });
    const lines = {};
    for (const b of beats) lines[b.id] = b.line;
    const flipBeat = isObj(episode?.mistake) && isStr(episode.mistake.flipBeat) ? episode.mistake.flipBeat : null;
    return { montage: true, flipBeat, beats, lines };
}

/** Whether the episode's flip is the montage (flip.mode "montage"). */
export const isMontage = (episode) => isObj(episode?.flip) && episode.flip.mode === 'montage';

/**
 * The ids the write stage holds for the flip; never the message text (11 §5.2).
 * templateId is the pretext the learner chose (the part that varies), else the first template.
 */
export function sentFromRecord(rec, targetId = null) {
    if (!isObj(rec)) return null;
    const parts = isObj(rec.templates) ? rec.templates : {};
    const templates = Object.values(parts).filter(isStr);
    return {
        recordId: isStr(rec.id) ? rec.id : null,
        targetId: isStr(rec.targetId) ? rec.targetId : (isStr(targetId) ? targetId : null),
        templateId: isStr(parts.pretext) ? parts.pretext : (templates[0] ?? null),
        blankIds: isObj(rec.slots) ? Object.keys(rec.slots) : []
    };
}

/** What a pretext call's write stage holds for the flip. */
export function sentFromCall(callId, outcome) {
    return cleanSent({ kind: 'call', callId, outcome });
}

/** The pretext call's outcome global (06 N7). */
export const callOutcomeKey = (callId) => `pretext_${callId}_outcome`;

const labelOf = (list, id) => {
    if (!Array.isArray(list) || !isStr(id)) return null;
    const hit = list.find((o) => isObj(o) && o.id === id);
    return hit ? (hit.label ?? hit.text ?? hit.heading ?? null) : null;
};

/**
 * The flip's victim's-seat block (ENG-01, episode.flipAftermath), or null. It shows only when
 * the attack landed: pass `landed: false` for a miss and the block is withheld. The caller adds
 * its own no-message/no-page test (a flip with nothing to replay has no aftermath either).
 */
export function flipAftermathFor(episode, { landed = true } = {}) {
    if (landed === false) return null;
    const block = episode?.flipAftermath;
    return isObj(block) ? block : null;
}

/**
 * The built look-alike page the flip shows (E5), from the builder's record
 * se_landing_pages[<attack.landingPageId>] and the page definition in social.landingPages.
 * Null unless the episode runs a build stage and the record is built.
 *   { url, padlock, heading, fields, button, tells, pageDef, choices }
 * `tells` are the record's page tells (07 tell ids such as domain, formOrigin, hoverMismatch).
 */
export function flipPage(episode, social, globals) {
    const pageId = episode?.attack?.landingPageId;
    if (!isStr(pageId) || !stagesFor(episode).includes('build')) return null;
    const records = isObj(globals?.se_landing_pages) ? globals.se_landing_pages : {};
    const rec = isObj(records[pageId]) ? records[pageId] : null;
    const builtFlag = globals?.[`landing_${pageId}_built`] === true;
    if (!rec || (rec.built !== true && !builtFlag)) return null;
    const pages = Array.isArray(social?.landingPages) ? social.landingPages : [];
    const def = pages.find((p) => isObj(p) && p.id === pageId) || {};
    const choices = isObj(rec.choices) ? rec.choices : {};
    // Domain options may sit at the page top level or, as the builder authors them, nested under
    // each brand (brands[].domains). Search both, by the chosen option id (E5-3).
    const topMenu = [def.domainMenu, def.domains, def.domainOptions].find(Array.isArray) || [];
    const brandMenu = (Array.isArray(def.brands) ? def.brands : [])
        .flatMap((b) => (isObj(b) && Array.isArray(b.domains) ? b.domains : []));
    const opt = [...topMenu, ...brandMenu].find((o) => isObj(o) && o.id === choices.domainId) || null;
    // The builder writes the option id (e.g. "d_word"), not a domain, to landing_<pageId>_domain,
    // so only trust that global as a host when it actually reads as a domain — otherwise the flip's
    // address bar showed "https://d_word/" (E5-3).
    const fallback = globals?.[`landing_${pageId}_domain`];
    const fallbackHost = isStr(fallback) && fallback.includes('.') ? fallback : '';
    const host = (opt && (opt.browserDomain || opt.domain)) || fallbackHost;
    if (!isStr(host) || !host) return null;
    const url = /^[a-z]+:\/\//i.test(host) ? host : `https://${host}/`;
    const heading = labelOf(def.purposes, choices.purpose) || (isStr(def.title) ? def.title : '');
    const fields = (Array.isArray(choices.fields) ? choices.fields : []).filter(isStr).map((f) => fieldLabel(f, def, { flip: true }));
    const own = Array.isArray(rec.tells) ? rec.tells : (Array.isArray(rec.tellsFound) ? rec.tellsFound : []);
    // The button face is the purpose's `button` (default "Sign in"), as the builder draws it; the
    // purpose label is the page heading, never the button (P4-1: the flip read "Session expired"
    // twice where the builder showed "Sign in again").
    const purpose = (Array.isArray(def.purposes) ? def.purposes : []).find((o) => isObj(o) && o.id === choices.purpose);
    const button = isObj(purpose) && isStr(purpose.button) && purpose.button.trim() ? purpose.button : 'Sign in';
    return {
        url,
        padlock: choices.padlock === true,
        heading: isStr(heading) ? heading : '',
        fields,
        button,
        tells: [...new Set(own.filter(isStr))],
        // The page definition and the learner's choices, so the flip draws the page with the
        // builder's own renderer (logo, button, wording): the page they scored, not a copy (P4-1).
        pageDef: isStr(def.id) ? def : null,
        choices: { ...choices }
    };
}

const spaced = (id) => {
    const t = String(id).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
};

/**
 * The call the flip shows (E3), when the held call landed; null otherwise. It is the call as
 * the helpdesk agent took it, drawn as a triage `call` card:
 *   { callId, outcome, callerId, claims: [{ fact, value }], transcript: [{ who, text }], notes }
 * The transcript is the learner's own lines, rebuilt from the pretext session's log
 * (pretext_<callId>_state: line ids and the card's blanks, never typed text) with each blank
 * filled with the label the learner picked. `claims` are those blanks. `notes` are the call
 * spec's defenderNotes: what would have caught it.
 */
export function flipCall(episode, social, sent, globals = {}) {
    if (!isObj(sent) || sent.kind !== 'call' || sent.outcome !== CALL_LANDED) return null;
    const calls = Array.isArray(social?.pretextNpcs) ? social.pretextNpcs : [];
    const spec = calls.find((c) => isObj(c) && c.callId === sent.callId) || {};
    const notes = isObj(spec.defenderNotes) ? Object.values(spec.defenderNotes).filter(isStr) : [];
    const session = isObj(globals?.[`pretext_${sent.callId}_state`]) ? globals[`pretext_${sent.callId}_state`] : {};
    const blanks = isObj(session.blanks) ? session.blanks : {};
    const lines = isObj(spec.lines) ? spec.lines : {};
    const transcript = [];
    for (const row of Array.isArray(session.log) ? session.log : []) {
        if (!isObj(row) || !isStr(row.id)) continue;
        if (row.kind === 'say' && isObj(lines[row.id]) && isStr(lines[row.id].text)) {
            const map = isObj(lines[row.id].blanks) ? lines[row.id].blanks : {};
            const text = lines[row.id].text.replace(/\{(\w+)\}/g, (m, name) => {
                const fact = isStr(map[name]) ? map[name] : name;
                const b = blanks[fact];
                return isObj(b) && isStr(b.label) ? b.label : (isStr(b?.value) ? b.value : m);
            });
            transcript.push({ who: 'Caller', text });
        } else if (row.kind === 'ask') {
            transcript.push({ who: 'Caller', text: `Asks for: ${spaced(row.id).toLowerCase()}.` });
        }
    }
    const claims = Object.entries(blanks)
        .filter(([, b]) => isObj(b) && (isStr(b.label) || isStr(b.value)))
        .map(([fact, b]) => ({ fact, value: isStr(b.label) ? b.label : b.value }));
    const who = claims.find((c) => c.fact === 'who')?.value;
    return {
        callId: sent.callId,
        outcome: sent.outcome,
        callerId: isStr(who) ? `Says they are ${who}` : 'Caller',
        claims,
        transcript,
        notes
    };
}

/**
 * The sent record the write stage produced. `sentIds` (the mail client's result
 * from P7-G on) wins: its newest id that is a sent record to the target. Without
 * it, the newest sent record to the target in mailState. Null when there is none.
 */
export function findSentRecord(mailState, targetId, sentIds = null) {
    const boxes = isObj(mailState?.mailboxes) ? mailState.mailboxes : {};
    const all = [];
    for (const box of Object.values(boxes)) {
        for (const rec of Array.isArray(box?.messages) ? box.messages : []) {
            if (!isObj(rec) || rec.folder !== 'sent' || rec.seeded === true || rec.kind === 'quickReply') continue;
            if (isStr(targetId) && rec.targetId !== targetId) continue;
            all.push(rec);
        }
    }
    if (Array.isArray(sentIds) && sentIds.length) {
        for (let i = sentIds.length - 1; i >= 0; i--) {
            const hit = all.find((r) => r.id === sentIds[i]);
            if (hit) return hit;
        }
    }
    if (!all.length) return null;
    const time = (r) => (Number.isFinite(r.gameTime) ? r.gameTime : 0);
    return all.reduce((best, r) => (time(r) >= time(best) ? r : best), all[0]);
}

/** The playerSent entry the flip replays: the defend set's own for the target, else a bare one. */
export function flipEntry(episode, set) {
    const target = episode?.attack?.target ?? null;
    const msgs = Array.isArray(set?.messages) ? set.messages : [];
    const own = msgs.find((m) => isObj(m) && m.kind === 'playerSent' && m.targetId === target);
    return own || { id: 'episode_flip', kind: 'playerSent', targetId: target };
}

/**
 * The ctx for recordTriageResult (§2.5). `launchStage` is the triage stage the
 * runner passed (defend.stage); a check records as 'pre' or 'post', anything
 * else as 'episode'.
 */
export function measurementCtx(episode, set, launchStage = null, now = Date.now()) {
    const stage = launchStage || set?.stage;
    return {
        setId: set?.id ?? episode?.defend?.setId ?? null,
        form: set?.id ?? episode?.defend?.setId ?? null,
        stage: stage === 'pre' || stage === 'post' ? stage : 'episode',
        episodeId: episode?.id ?? null,
        variant: variantOf(episode),
        now
    };
}

/** The defend summary kept in the state global: numbers only. */
export function defendSummary(result) {
    return cleanDefend(result) || { percent: 0, reportRate: 0, verifyCount: 0 };
}

// ── deployment settings (aw1, aw4, aw6) ───────────────────────────────────────

/**
 * The generic "how to report" line, shown when the episode's debrief asks for the customer's
 * route (debrief.mondayCard "slot:customer_report_route") and nobody has configured one. It
 * names no real organisation's route: it tells the learner to find out theirs.
 */
export const GENERIC_REPORT_ROUTE = Object.freeze({
    heading: 'How to report here',
    text: 'Find out today how your organisation wants suspicious emails, calls and texts reported: ' +
        'ask your IT or security team, and keep the answer somewhere you can find it. ' +
        'Until you know, tell IT or your manager straight away.'
});
export const REPORT_ROUTE_SLOT = 'slot:customer_report_route';

const MAX_SETTING_TEXT = 600;

/** Plain text, trimmed and capped; anything else ''. */
function settingText(v) {
    return typeof v === 'string' ? v.trim().slice(0, MAX_SETTING_TEXT) : '';
}

/** A string, or { heading?, text }: the cleaned { heading, text }, or null when there is no text. */
function textBlock(v) {
    if (typeof v === 'string') return settingText(v) ? { heading: '', text: settingText(v) } : null;
    if (!isObj(v) || !settingText(v.text)) return null;
    return { heading: settingText(v.heading), text: settingText(v.text) };
}

/**
 * The awareness settings an episode reads: `social.awareness` in the scenario
 * ({ reportRoute, ruleOfThumb, teamSize }), with the host page's
 * `window.breakEscapeConfig.awareness` winning key by key, so one deployment can set its
 * organisation's route for every episode without editing the scenarios. Pure.
 */
export function awarenessSettings(social, config) {
    const fromScenario = isObj(social?.awareness) ? social.awareness : {};
    const fromHost = isObj(config?.awareness) ? config.awareness : {};
    const pick = (key) => (fromHost[key] !== undefined && fromHost[key] !== null ? fromHost[key] : fromScenario[key]);
    const size = Number(pick('teamSize'));
    return {
        reportRoute: textBlock(pick('reportRoute')),
        ruleOfThumb: textBlock(pick('ruleOfThumb')),
        teamSize: Number.isInteger(size) && size >= 2 && size <= 100000 ? size : null
    };
}

/**
 * aw1: the debrief's "How to report here" box: { heading, text, configured }, or null.
 * A configured route always shows. Without one, the generic line shows only when the episode
 * asks for the customer slot (debrief.mondayCard "slot:customer_report_route").
 */
export function reportRouteFor(episode, social, config) {
    const { reportRoute } = awarenessSettings(social, config);
    if (reportRoute) {
        return { heading: reportRoute.heading || GENERIC_REPORT_ROUTE.heading, text: reportRoute.text, configured: true };
    }
    if (episode?.debrief?.mondayCard === REPORT_ROUTE_SLOT) return { ...GENERIC_REPORT_ROUTE, configured: false };
    return null;
}

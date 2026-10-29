// Password guesser model (awareness product, ENG-02): the `guess` stage's authored guesser. Pure: no
// DOM, no globals written. The scene (password-guesser-minigame.js) and the Node tests build on it.
//
// Nothing here guesses anything. A run is a list of authored rows that the learner steps through; each
// row already carries its outcome, so the "guesser" only reveals them in the order attackers try them.
// No real password, no list, no tool and no method is held or shown: every string is authored data
// drawn from the collected OSINT facts and from game words.
//
// Modes. `config.mode` (default 'target') picks which builder turns the config into a run. A builder is
// { build(config, ctx) -> { note?, panels }, lint is in awareness.rb }. ENG-02b registers 'spray' (the
// organisation-scale console: roster, word list, spray passes, credential stuffing, passphrase hold-out)
// and 'stuff' (the stuffing panel alone) beside 'target'; the run, the stepping, the landed test and the
// scene's drawing do not change. A panel is { id, heading, intro?, rows }, a row is
// { id, text, outcome, label? } and `outcome` is what the row ends as once the learner reaches it:
//   struck   tried, did not open            missing  needs a fact the learner has not found
//   opens    tried, opened an account       holds    still being tried when the rig is switched off
//   found    a roster or word-list entry the learner's facts could build (not a guess)
//   sprayed  a spray pass: one candidate, tried once on every account in the roster
//
//   modeOf(config)                  'target' unless config.mode names a registered builder (else null)
//   buildRun(config, globals)       the run for the config, or null for an unknown mode
//   intelCollected(globals, factId) whether se_intel_<factId> is true
//   GuesserRun                      steps through a run: advance(), runAll(), landed, switchOffReady
//   rowState(row, resolved)         'queued' | 'struck' | 'notfound' | 'opened' | 'trying'
//   textFor(config, key)            a learner-facing line: config.strings[key], else the default

export const INTEL_PREFIX = 'se_intel_';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

export const DEFAULT_TEXT = Object.freeze({
    heading: 'Guess list',
    note: 'No real password is typed or stored here. Every guess is made up for the exercise.',
    commonHeading: 'The usual first guesses',
    commonIntro: 'Tried first, because plenty of people use them.',
    patternsHeading: 'Built from what you found',
    patternsIntro: 'Each guess uses one fact you collected about this person.',
    missing: 'A guess you could not build: you have not found the fact it needs.',
    reuseHeading: 'The same password somewhere else',
    reuseIntro: 'People reuse a password. If one site loses it, every account that shares it is open.',
    reuseRow: 'The password from {site}, tried on the work account',
    passphraseHeading: 'Three random words',
    passphraseIntro: 'A passphrase of unrelated words is not on anyone’s list.',
    passphraseRow: 'Three unrelated words',
    step: 'Try the next guess',
    runAll: 'Run them all',
    switchOff: 'Switch the rig off',
    stepsLeft: '{n} to go',
    struck: 'did not work',
    notfound: 'not found',
    opened: 'opens the account',
    trying: 'still being tried',
    queued: 'waiting',
    found: 'found',
    sprayed: 'tried once on every account',
    noteOrg: 'No real password, list or breach is used here. Every name, word and row is made up for the exercise.',
    rosterHeading: 'Who works here',
    rosterIntro: 'The staff list came from the public team page and the shape of the email addresses. No password was needed.',
    rosterNames: 'Names from the team page',
    rosterPattern: 'The email address pattern',
    rosterMissing: 'The address list could not be built: half of it is still missing.',
    wordListHeading: 'Words from the practice’s own website',
    wordListIntro: 'Project names, places and the motto, plus the season and the year, are the first words tried.',
    wordListMissing: 'A word you could not add: you have not found the fact it needs.',
    sprayHeading: 'One password, every account',
    sprayIntro: 'Each candidate is tried once on every account, so no single account is tried often enough to lock.',
    sprayPass: '{candidate}',
    sprayMissing: 'A pass you could not run: the word or the staff list is still missing.',
    sprayResult: '{n} of {m} accounts opened',
    stuffHeading: 'Passwords from somewhere else',
    stuffIntro: 'A password leaked from another site was tried here. Where a person used it twice, the account opens.',
    stuffMasked: '......',
    unsupported: 'This guesser does not know how to run that way. Close it and try the kiosk again.',
    close: 'Close'
});

/** A learner-facing line: config.strings[key] when authored, else the default. */
export function textFor(config, key) {
    const own = isObj(config) && isObj(config.strings) ? config.strings[key] : null;
    return isStr(own) ? own : DEFAULT_TEXT[key];
}

/** Whether a fact is held: its se_intel_<id> global is true. */
export function intelCollected(globals, factId) {
    return isStr(factId) && isObj(globals) && globals[`${INTEL_PREFIX}${factId}`] === true;
}

// ── the single-target builder (E9) ──────────────────────────────────────────────

/**
 * One pattern slot's guess. The template carries one token, the slot's own id in braces, and it is
 * replaced by the slot's own `word`; every other character is an authored literal. Tokens never cross
 * slots. Null when the slot has no word to put in.
 */
export function slotGuess(slot) {
    if (!isObj(slot) || !isStr(slot.template) || !isStr(slot.word)) return null;
    return isStr(slot.id) ? slot.template.split(`{${slot.id}}`).join(slot.word) : slot.template;
}

function buildTarget(config, { globals }) {
    const panels = [];
    const common = (Array.isArray(config.commonList) ? config.commonList : []).filter(isStr);
    if (common.length) {
        panels.push({
            id: 'common', heading: textFor(config, 'commonHeading'), intro: textFor(config, 'commonIntro'),
            rows: common.map((text, i) => ({ id: `common_${i + 1}`, text, outcome: 'struck' }))
        });
    }
    const slots = (Array.isArray(config.patternSlots) ? config.patternSlots : []).filter(isObj);
    if (slots.length) {
        panels.push({
            id: 'patterns', heading: textFor(config, 'patternsHeading'), intro: textFor(config, 'patternsIntro'),
            rows: slots.map((slot, i) => {
                const id = isStr(slot.id) ? slot.id : `slot_${i + 1}`;
                const guess = slotGuess(slot);
                // A guess is built only from a fact the learner collected; otherwise the row names no guess.
                if (!guess || !intelCollected(globals, slot.factId)) {
                    return { id, text: isStr(slot.label) ? slot.label : textFor(config, 'missing'), outcome: 'missing' };
                }
                return { id, text: guess, outcome: 'struck' };
            })
        });
    }
    const reuse = isObj(config.reuseStep) ? config.reuseStep : null;
    if (reuse) {
        const found = intelCollected(globals, reuse.factId);
        const row = textFor(config, 'reuseRow').split('{site}').join(isStr(reuse.site) ? reuse.site : 'another site');
        panels.push({
            id: 'reuse', heading: textFor(config, 'reuseHeading'), intro: textFor(config, 'reuseIntro'),
            rows: [{
                id: 'reuse', text: found ? row : textFor(config, 'missing'), outcome: found ? 'opens' : 'missing',
                ...(isStr(reuse.note) ? { note: reuse.note } : {})
            }]
        });
    }
    const demo = isObj(config.passphraseDemo) ? config.passphraseDemo : null;
    // A passphrase demo never lands, whatever the config says.
    if (demo) panels.push(passphrasePanel(config, demo));
    return { note: isStr(config.note) ? config.note : textFor(config, 'note'), panels };
}

// ── the organisation-scale builders (E18): spray, stuff ───────────────────────────

/** The passphrase hold-out panel shared by the target and spray modes; it never lands. */
function passphrasePanel(config, demo) {
    const words = (Array.isArray(demo.words) ? demo.words : []).filter(isStr);
    return {
        id: 'passphrase', heading: textFor(config, 'passphraseHeading'), intro: textFor(config, 'passphraseIntro'),
        rows: [{ id: 'passphrase', text: words.length ? words.join(' ') : textFor(config, 'passphraseRow'), outcome: 'holds' }]
    };
}

/** "Ann Example" -> "ann.example@domain": lower case, letters and digits, words joined by a dot. */
export function rosterAddress(name, domain) {
    const local = String(name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean).join('.');
    return local && isStr(domain) ? `${local}@${domain}` : null;
}

/** The roster panel. Addresses are built only when both the names and the pattern were collected. */
function rosterPanel(config, globals) {
    const roster = isObj(config.roster) ? config.roster : {};
    const haveNames = intelCollected(globals, roster.namesFactId);
    const havePattern = intelCollected(globals, roster.patternFactId);
    const sample = (Array.isArray(roster.sample) ? roster.sample : []).filter(isStr);
    const rows = [
        { id: 'roster_names', text: textFor(config, 'rosterNames'), outcome: haveNames ? 'found' : 'missing' },
        { id: 'roster_pattern', text: textFor(config, 'rosterPattern'), outcome: havePattern ? 'found' : 'missing' }
    ];
    const addresses = haveNames && havePattern ? sample.map((n) => rosterAddress(n, roster.domain)).filter(isStr) : [];
    if (addresses.length) addresses.forEach((text, i) => rows.push({ id: `roster_${i + 1}`, text, outcome: 'found', address: true }));
    else rows.push({ id: 'roster_none', text: textFor(config, 'rosterMissing'), outcome: 'missing' });
    return {
        panel: {
            id: 'roster', heading: textFor(config, 'rosterHeading'),
            intro: isStr(roster.note) ? roster.note : textFor(config, 'rosterIntro'), rows
        },
        accounts: addresses.length
    };
}

/** The word list: one fact per slot, the slot's own token replaced by its word, the season and year appended. */
function wordListPanel(config, globals) {
    const list = isObj(config.wordList) ? config.wordList : {};
    const rows = [];
    const built = new Map();
    (Array.isArray(list.slots) ? list.slots : []).filter(isObj).forEach((slot, i) => {
        const id = isStr(slot.id) ? slot.id : `word_${i + 1}`;
        const guess = slotGuess(slot);
        if (!guess || !intelCollected(globals, slot.factId)) {
            rows.push({ id, text: isStr(slot.label) ? slot.label : textFor(config, 'wordListMissing'), outcome: 'missing' });
            return;
        }
        built.set(id, guess);
        rows.push({ id, text: guess, outcome: 'found' });
    });
    (Array.isArray(list.seasonYear) ? list.seasonYear : []).filter(isStr).forEach((text, i) => {
        rows.push({ id: `season_${i + 1}`, text, outcome: 'found' });
    });
    return {
        panel: {
            id: 'wordList', heading: textFor(config, 'wordListHeading'),
            intro: isStr(list.note) ? list.note : textFor(config, 'wordListIntro'), rows
        },
        built
    };
}

/**
 * The spray passes. A pass is one candidate (a built word-list slot, or an authored literal) tried once on
 * every roster account. The accounts that open are authored as a count and shown as a count, never named.
 * Nothing opens unless the roster was built and at least one pass could be run.
 */
function sprayPanel(config, roster, words) {
    const spray = isObj(config.spray) ? config.spray : {};
    const rows = [];
    let ran = 0;
    (Array.isArray(spray.passes) ? spray.passes : []).filter(isObj).forEach((pass, i) => {
        const id = isStr(pass.id) ? pass.id : `pass_${i + 1}`;
        const candidate = isStr(pass.literal) ? pass.literal : (isStr(pass.fromSlot) ? words.get(pass.fromSlot) : null);
        if (!isStr(candidate) || !roster.accounts) {
            rows.push({ id, text: textFor(config, 'sprayMissing'), outcome: 'missing' });
            return;
        }
        ran += 1;
        rows.push({ id, text: textFor(config, 'sprayPass').split('{candidate}').join(candidate), outcome: 'sprayed' });
    });
    const authored = Number.isInteger(spray.opensCount) && spray.opensCount > 0 ? spray.opensCount : 0;
    const opens = ran > 0 ? Math.min(authored, roster.accounts) : 0;
    rows.push({
        id: 'spray_result',
        text: textFor(config, 'sprayResult').split('{n}').join(String(opens)).split('{m}').join(String(roster.accounts)),
        outcome: opens > 0 ? 'opens' : 'struck',
        ...(isStr(spray.note) ? { note: spray.note } : {})
    });
    return { id: 'spray', heading: textFor(config, 'sprayHeading'), intro: textFor(config, 'sprayIntro'), rows };
}

/** The stuffing panel: masked rows only. A row that opens is where a password from another site was reused. */
function stuffPanel(config) {
    const stuff = isObj(config.stuff) ? config.stuff : {};
    const masked = textFor(config, 'stuffMasked');
    const rows = (Array.isArray(stuff.rows) ? stuff.rows : []).filter(isObj).map((row, i) => ({
        id: `stuff_${i + 1}`, text: `${isStr(row.label) ? row.label : 'Account'}: ${masked}`,
        outcome: row.opens === true ? 'opens' : 'struck'
    }));
    return {
        id: 'stuff', heading: textFor(config, 'stuffHeading'),
        intro: isStr(stuff.note) ? stuff.note : textFor(config, 'stuffIntro'), rows
    };
}

function buildSpray(config, { globals }) {
    const roster = rosterPanel(config, globals);
    const words = wordListPanel(config, globals);
    const panels = [roster.panel, words.panel, sprayPanel(config, roster, words.built)];
    if (isObj(config.stuff)) panels.push(stuffPanel(config));
    if (isObj(config.passphraseDemo)) panels.push(passphrasePanel(config, config.passphraseDemo));
    return { note: isStr(config.note) ? config.note : textFor(config, 'noteOrg'), panels };
}

function buildStuff(config) {
    return { note: isStr(config.note) ? config.note : textFor(config, 'noteOrg'), panels: [stuffPanel(config)] };
}

/** Mode -> builder. */
export const MODE_BUILDERS = Object.freeze({ target: buildTarget, spray: buildSpray, stuff: buildStuff });


/** 'target' when config.mode is absent, the mode when a builder is registered for it, else null. */
export function modeOf(config) {
    const mode = isObj(config) && config.mode !== undefined ? config.mode : 'target';
    return isStr(mode) && Object.prototype.hasOwnProperty.call(MODE_BUILDERS, mode) ? mode : null;
}

/**
 * The run for a config and the learner's globals: { mode, note, panels, rows }. `rows` is every
 * panel's rows in order, the sequence the learner steps through. Null for a mode with no builder.
 */
export function buildRun(config, globals = null) {
    const mode = modeOf(config);
    if (!mode) return null;
    const built = MODE_BUILDERS[mode](isObj(config) ? config : {}, { globals: isObj(globals) ? globals : {} });
    const rows = [];
    for (const panel of built.panels) for (const row of panel.rows) rows.push({ ...row, panelId: panel.id });
    return { mode, note: built.note, panels: built.panels, rows };
}

const STATE_OF = Object.freeze({ struck: 'struck', missing: 'notfound', opens: 'opened', holds: 'trying', found: 'found', sprayed: 'sprayed' });

/** How a row reads: 'queued' until it is reached, then by its outcome. */
export function rowState(row, resolved) {
    return resolved ? (STATE_OF[row?.outcome] ?? 'struck') : 'queued';
}

/**
 * The learner's walk through a run. One row is revealed per advance(), in order. It is landed once a
 * revealed row opens an account. The run can be switched off once every row has been reached; a
 * 'holds' row stays "still being tried" and never opens anything.
 */
export class GuesserRun {
    constructor(run) {
        this.run = run;
        this.rows = run?.rows ?? [];
        this.index = 0; // rows revealed so far
    }

    get total() { return this.rows.length; }
    get remaining() { return this.rows.length - this.index; }
    get switchOffReady() { return this.index >= this.rows.length; }
    isResolved(i) { return i < this.index; }
    stateOf(i) { return rowState(this.rows[i], this.isResolved(i)); }

    /** The row now revealed, or null when there is none left. */
    advance() {
        if (this.index >= this.rows.length) return null;
        return this.rows[this.index++];
    }

    runAll() {
        while (this.advance()) { /* reveal every row, in order */ }
    }

    /** Some revealed row opened an account. */
    get landed() {
        return this.rows.slice(0, this.index).some((r) => r.outcome === 'opens');
    }
}

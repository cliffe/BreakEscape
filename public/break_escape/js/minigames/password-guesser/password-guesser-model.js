// Password guesser model (awareness product, ENG-02): the `guess` stage's authored guesser. Pure: no
// DOM, no globals written. The scene (password-guesser-minigame.js) and the Node tests build on it.
//
// Nothing here guesses anything. A run is a list of authored rows that the learner steps through; each
// row already carries its outcome, so the "guesser" only reveals them in the order attackers try them.
// No real password, no list, no tool and no method is held or shown: every string is authored data
// drawn from the collected OSINT facts and from game words.
//
// Modes. `config.mode` (default 'target') picks which builder turns the config into a run. A builder is
// { build(config, ctx) -> { note?, panels }, lint is in awareness.rb }. ENG-02b adds 'spray' and 'stuff'
// by registering two more builders in MODE_BUILDERS; the run, the stepping, the landed test and the
// scene's drawing below do not change. A panel is { id, heading, intro?, rows }, a row is
// { id, text, outcome, label? } and `outcome` is what the row ends as once the learner reaches it:
//   struck   tried, did not open            missing  needs a fact the learner has not found
//   opens    tried, opened an account       holds    still being tried when the rig is switched off
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
    if (demo) {
        const words = (Array.isArray(demo.words) ? demo.words : []).filter(isStr);
        panels.push({
            id: 'passphrase', heading: textFor(config, 'passphraseHeading'), intro: textFor(config, 'passphraseIntro'),
            // A passphrase demo never lands, whatever the config says.
            rows: [{ id: 'passphrase', text: words.length ? words.join(' ') : textFor(config, 'passphraseRow'), outcome: 'holds' }]
        });
    }
    return { note: isStr(config.note) ? config.note : textFor(config, 'note'), panels };
}

/** Mode -> builder. ENG-02b registers 'spray' and 'stuff' here; nothing else in this file changes. */
export const MODE_BUILDERS = Object.freeze({ target: buildTarget });

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

const STATE_OF = Object.freeze({ struck: 'struck', missing: 'notfound', opens: 'opened', holds: 'trying' });

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

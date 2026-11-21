/**
 * credits-theme.js — themes for the end-of-mission visualiser (bond-visualiser.js).
 *
 * A scenario picks one with its top-level "creditsTheme". Without the field it
 * gets DEFAULT_CREDITS_THEME ("safetynet"), the campaign look.
 *
 *   safetynet  The SAFETYNET debrief as originally built: classified stamps,
 *              global threat map, agency panel, S/N shield, SAFETYNET ticker.
 *   cyber      A generic cyber security / incident-review look for standalone
 *              exercises (the CyBOK SIS games): still a lively SOC-style
 *              visualiser (SIEM feed, matrix rain), but no agency, no stamps,
 *              no fake "ATTACK: X → Y" threat map; headings come from the
 *              scenario's own name and credits.
 *
 * Each theme lists the visualiser modes it enables. To add a theme, add an entry
 * to CREDITS_THEMES, give it an overlay() for its header/panel/ticker text (or
 * null to keep the overlay as built), and add its name to the schema enum.
 * Pure (no DOM, no imports) so it can be unit tested.
 */

export const ALL_VIS_MODES = ['cybermap', 'wave', 'siem', 'cctv', 'bars', 'circle', 'matrix', 'tunnel', 'plasma', 'particles', 'lissajous'];

export const DEFAULT_CREDITS_THEME = 'safetynet';

/** First "subtitle" credit line: the scenario's own organisation and setting. */
export function creditsSetting(credits) {
    const line = (credits || []).find(l => l && l.style === 'subtitle' && l.text && l.text.trim());
    return line ? line.text.trim() : '';
}

export const CREDITS_THEMES = {
    safetynet: {
        modes:         ALL_VIS_MODES,
        matrixChars:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*<>{}[]|/\\ENTROPYSAFETYNET',
        logo:          'shield',
        centreLabel:   'S/N',
        // CCTV feeds for a scenario with no room backgrounds (cctv-feeds.js)
        cctvFallback:  ['hq1', 'hq2', 'hq3', 'hq5'].map(n => ({ label: 'SAFETYNET HQ', image: `assets/backgrounds/${n}.png` })),
        stamp:         true,
        rotateOps:     true,
        logCredits:    false,
        logMessages: [
            ['> SCANNING FREQUENCIES...', ''],
            ['> ENCRYPTION VERIFIED', ''],
            ['> QUANTUM KEY EXCHANGE OK', ''],
            ['> SIGNAL TRACE: NEGATIVE', 'warn'],
            ['> THREAT SCAN COMPLETE', ''],
            ['> INTRUDER DETECTED — LAYER 3', 'alert'],
            ['> DECOY DEPLOYED', 'warn'],
            ['> FIREWALL: NOMINAL', ''],
            ['> DPI BYPASS CONFIRMED', ''],
            ['> CIPHER ROTATION OK', ''],
        ],
        trackLabel: (state) => ({
            label:  'INTEL:',
            detail: `${state.trackTitle.toUpperCase()}  ·  ${(state.playlistName || '').toUpperCase()}`,
        }),
        overlay: () => null, // the overlay exactly as bond-visualiser.js builds it
    },

    cyber: {
        // No threat map: its random city-to-city "ATTACK" arcs and log lines are spy-campaign fiction.
        modes:         ['wave', 'siem', 'cctv', 'bars', 'circle', 'matrix', 'tunnel', 'plasma', 'particles', 'lissajous'],
        matrixChars:   '0123456789ABCDEF{}[]<>/\\|#$%&*=+:;',
        logo:          'padlock',
        centreLabel:   '',
        cctvFallback:  [], // no agency HQ: a scenario without backgrounds shows NO SIGNAL
        stamp:         false,
        rotateOps:     false,
        logCredits:    true, // the review log echoes each credit line as it is shown
        logMessages: [
            ['> TIMELINE RECONSTRUCTED', ''],
            ['> EVIDENCE PRESERVED', ''],
            ['> LOGS RETAINED FOR REVIEW', ''],
            ['> CONTROLS UNDER REVIEW', 'warn'],
            ['> LESSONS LEARNED RECORDED', ''],
            ['> MONITORING RESTORED', ''],
        ],
        trackLabel: () => ({ label: 'MUSIC:', detail: 'CLOSING THEME' }),
        overlay: ({ missionName, credits }) => {
            const name = (missionName || '').trim() || 'BREAK ESCAPE';
            const setting = creditsSetting(credits);
            const ticker = ['INCIDENT REVIEW', name.toUpperCase()];
            if (setting) ticker.push(setting.toUpperCase());
            ticker.push('THANK YOU FOR PLAYING');
            return {
                heading:    'INCIDENT REVIEW',
                subheading: name.toUpperCase(),
                liveBadge:  '● REVIEW',
                badge:      'DEBRIEF',
                scene:      ['SCENE:', setting ? setting.toUpperCase() : name.toUpperCase()],
                status:     'COMPLETE',
                phase:      ['PHASE:', 'REVIEW'], // replaces the audio-driven THREAT row
                leftTitle:  '▸ SIGNAL ANALYSIS',
                logTitle:   '▸ REVIEW LOG',
                logFirst:   '> OUTCOMES FOLLOW',
                rightTitle: '▸ EXERCISE',
                rows:       [['SCENARIO', name], ...(setting ? [['SETTING', setting]] : [])],
                footer:     name.toUpperCase(),
                ticker:     `██ ${ticker.join(' ██ ')} ██`,
                mapLabel:   'BREAK ESCAPE // INCIDENT REVIEW',
            };
        },
    },
};

/**
 * A scenario's own words for the safetynet credits overlay (m07 E7: every mission
 * showed "OPERATION: IRONSEAL" and "ENTROPY CONTAINED ... WELL PLAYED"). Both are
 * optional; without them the overlay keeps its built-in text.
 *   "creditsOverlay": { "operation": "SCHRODINGER", "ticker": ["LINE", "LINE"] }
 * operation fills the header's OPERTN: row (no rotation); ticker replaces the
 * footer ticker (an array is joined with the ██ separators). With no operation,
 * the row takes the mission's display name in capitals when one is given
 * (fallbackName), so it never shows another mission's code name (2026-10-17).
 * @param {object} scenario
 * @param {string} [fallbackName] - the mission's display name
 * @returns {{operation: string|null, ticker: string|null}}
 */
export function scenarioCreditsOverlay(scenario, fallbackName) {
    const cfg = scenario?.creditsOverlay;
    const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const fallback = clean(fallbackName);
    const operation = clean(cfg?.operation) || (fallback ? fallback.toUpperCase() : null);
    let ticker = null;
    if (Array.isArray(cfg?.ticker)) {
        const lines = cfg.ticker.map(clean).filter(Boolean);
        if (lines.length) ticker = `██ ${lines.join(' ██ ')} ██`;
    } else {
        ticker = clean(cfg?.ticker);
    }
    return { operation, ticker };
}

/** The visualiser's header when neither the ending nor the theme sets one. */
export const DEFAULT_CREDITS_HEADER = 'MISSION COMPLETE // AUDIO INTEL';

/**
 * The header text an open of the visualiser leaves in place. A credits entry's
 * `headerText` (e.g. "MISSION FAILED // AUDIO INTEL") sets it; a new credits roll
 * without one goes back to the default (null); an open with no credits, such as a
 * conclusionScreen's open({}) after the credits, keeps what is there.
 * @param {string|null} current
 * @param {object} [opts] - the open() options
 * @returns {string|null}
 */
export function nextCreditsHeader(current, opts) {
    return nextCreditsText(current, opts, 'headerText');
}

/** The same rule for any opt-in text field of a credits entry (headerText, statusText). */
export function nextCreditsText(current, opts, key) {
    const text = typeof opts?.[key] === 'string' ? opts[key].trim() : '';
    if (text) return text;
    if (opts?.credits?.length) return null;
    return current ?? null;
}

/** The STATUS row's value when neither the ending nor the theme sets one. */
export const DEFAULT_CREDITS_STATUS = 'MONITORING';

/** What the STATUS row shows: the ending's statusText, else the theme's status, else the default. */
export function creditsStatus(statusText, themeStatus) {
    return statusText || themeStatus || DEFAULT_CREDITS_STATUS;
}

const THREAT_BAD = 'FAILED|FAILURES?|COMPROMISED';
const THREAT_BAD_WORDS = new RegExp(`\\b(?:${THREAT_BAD})\\b`, 'i');
// A negator, then at most one word ("NO SYSTEMS", "NOT YET", "NOT A"), then a bad word.
// "NON-" and "UN-" prefixes count; the separator may be a space or a hyphen.
const THREAT_NEGATORS = 'NOT|NEVER|NO|NOTHING|NOBODY|NONE|NON|UN';
const THREAT_NEGATED = new RegExp(`\\b(?:${THREAT_NEGATORS})\\b[\\s-]+(?:(?!${THREAT_BAD})[A-Z]+\\s+)?(?:${THREAT_BAD})\\b`, 'gi');
const THREAT_NOT_CONTAINED = /\b(?:(?:NOT|NEVER)\s+|UN-?)CONTAINED\b/i;
const THREAT_RED = new Set(['ACTIVE', 'CRITICAL', 'BREACH']);
const THREAT_GREEN = new Set(['CONTAINED', 'SECURE', 'CLEAR']);
const THREAT_TONES = { red: 'bad', green: 'good', cyan: 'custom' };

/**
 * Does this text say the operation went wrong? Whole words only (FAILSAFE and
 * UNCOMPROMISED say nothing), and a negated word does not count ("NOT COMPROMISED"),
 * while "NOT CONTAINED" does.
 */
export function sniffsFailed(text) {
    if (typeof text !== 'string') return false;
    if (THREAT_NOT_CONTAINED.test(text)) return true;
    return THREAT_BAD_WORDS.test(text.replace(THREAT_NEGATED, ' '));
}

/** The outcome a value names, or null: "contained" and "active" are the only two. */
function outcomeOf(v) {
    const t = typeof v === 'string' ? v.trim().toLowerCase() : '';
    return t === 'contained' || t === 'active' ? t : null;
}

/** The tone of an ending's own THREAT text: a threatTone wins, else known words, else cyan. */
function overrideTone(text, threatTone) {
    const forced = THREAT_TONES[typeof threatTone === 'string' ? threatTone.trim().toLowerCase() : ''];
    if (forced) return forced;
    const word = text.toUpperCase();
    if (THREAT_RED.has(word)) return 'bad';
    if (THREAT_GREEN.has(word)) return 'good';
    return 'custom';
}

/**
 * The THREAT row once the story is over. While the visualiser is live the row follows the
 * audio (LOW to CRITICAL), so it read CRITICAL over a win. A concluded mission (credits
 * rolling) holds the outcome instead. In order: the ending's threatText; PENDING while the
 * result is unsynced; an explicit `outcome` ("contained" or "active") on the ending or on
 * any credit line that shows (active wins over contained); then, as the fallback for a
 * scenario that sets none, a header, status or title line that says FAILED, FAILURE or
 * COMPROMISED (see sniffsFailed) reads ACTIVE. Anything else is CONTAINED. Null means the
 * row stays audio-driven (no credits yet).
 * @param {object} o
 * @param {string|null} [o.threatText] - a credits entry's own value
 * @param {string|null} [o.threatTone] - "red", "green" or "cyan": overrides the tone of threatText
 * @param {string|null} [o.outcome] - the entry's explicit "contained" or "active"
 * @param {string|null} [o.headerText]
 * @param {string|null} [o.statusText]
 * @param {Array<{text:string,style?:string,outcome?:string}>} [o.credits] - the resolved credits lines
 * @param {boolean} [o.over] - the credits are rolling or the mission has concluded
 * @returns {{text:string, tone:'good'|'bad'|'custom'}|null}
 */
export function creditsThreat({ threatText, threatTone, outcome, headerText, statusText, credits, over } = {}) {
    if (!over) return null;
    const lines = (credits || []).filter(l => l && typeof l === 'object');
    if (typeof threatText === 'string' && threatText.trim()) {
        const text = threatText.trim();
        return { text, tone: overrideTone(text, threatTone) };
    }
    if (typeof statusText === 'string' && /PENDING/i.test(statusText)) return { text: 'PENDING', tone: 'custom' };
    const stated = [outcomeOf(outcome), ...lines.map(l => outcomeOf(l.outcome))].filter(Boolean);
    if (stated.length) {
        return stated.includes('active') ? { text: 'ACTIVE', tone: 'bad' } : { text: 'CONTAINED', tone: 'good' };
    }
    const titles = lines.filter(l => l.style === 'title').map(l => l.text || '');
    const failed = [headerText, statusText, ...titles].some(sniffsFailed);
    return failed ? { text: 'ACTIVE', tone: 'bad' } : { text: 'CONTAINED', tone: 'good' };
}

/** What the header shows: the ending's text, else the theme's heading, else the default. */
export function creditsHeader(headerText, themeHeading) {
    return headerText || themeHeading || DEFAULT_CREDITS_HEADER;
}

export function resolveCreditsTheme(scenario) {
    const name = scenario?.creditsTheme;
    return Object.prototype.hasOwnProperty.call(CREDITS_THEMES, name) ? name : DEFAULT_CREDITS_THEME;
}

export function getCreditsTheme(name) {
    return CREDITS_THEMES[name] || CREDITS_THEMES[DEFAULT_CREDITS_THEME];
}

/** HUD track label for a theme. */
export function trackInfoLabel(name, state) {
    if (!state?.trackTitle) return { label: 'AWAITING SIGNAL', detail: '' };
    return getCreditsTheme(name).trackLabel(state);
}

/**
 * A section heading written as "── CLINICAL OUTCOMES ──" (scenario credits): the dash runs are
 * decoration, the words are the heading. Returns { lead, title, trail } or null when the text
 * is not wrapped in dash runs. Pure. The credits draw the runs as separate spans that drop on
 * a narrow window, so the heading never wraps and leaves a lone dash line (sis01 m18).
 */
export function splitSectionHeader(text) {
    if (typeof text !== 'string') return null;
    const m = text.match(/^([\u2500\u2501\u2014\u2013-]{2,})\s+(.*?\S)\s+([\u2500\u2501\u2014\u2013-]{2,})$/u);
    return m ? { lead: m[1], title: m[2], trail: m[3] } : null;
}

/**
 * The review log's line for one credits item: "> " and the text. A section header goes in
 * without its dash runs, because the narrow log panel wrapped "── NETWORK CONTAINMENT ──" into
 * a lone dash line, the words, and another dash line (sis02 blind playtest m17). Pure.
 */
export function creditsLogLine(item) {
    const text = String(item?.text ?? '');
    const parts = item?.style === 'section-header' ? splitSectionHeader(text) : null;
    return '> ' + (parts ? parts.title : text);
}

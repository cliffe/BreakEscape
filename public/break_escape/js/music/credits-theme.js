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

export const ALL_VIS_MODES = ['cybermap', 'wave', 'siem', 'bars', 'circle', 'matrix', 'tunnel', 'plasma', 'particles', 'lissajous'];

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
        modes:         ['wave', 'siem', 'bars', 'circle', 'matrix', 'tunnel', 'plasma', 'particles', 'lissajous'],
        matrixChars:   '0123456789ABCDEF{}[]<>/\\|#$%&*=+:;',
        logo:          'padlock',
        centreLabel:   '',
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

// Shared helpers for the ca18 (Password guessing at scale, Merrin & Sallow) take scripts. Generic helpers come from ../ca14/_ca14.mjs (which re-exports ca08, ca01, ca15,
// ca12b and ca09's fetch-wrapping watchTts). Nothing here sets a game global except where a take says so (kit_quiet in t05 is seeded with --set): every action is a real click or a bridge interact.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, talkTo, closeBeforeMenu, watchBubbles, watchTts, checkSprite, watchBarkAudio, spriteCheck, addCss, textShowing, chain } from '../ca14/_ca14.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, talkTo, closeBeforeMenu, watchBubbles, watchTts, checkSprite, watchBarkAudio, spriteCheck, addCss, textShowing, chain };

export const SCENARIO = 'ca18_credential_attacks_at_scale';
const STATE = 'episode_e18_credential_attacks_at_scale_state';
/** Entry-state flags for run-take.sh (each --set is its own word; JSON has no spaces; quotes backslash-escaped in a shell). */
export const SEEDS = {
  flip: `--set guess_e18_landed=true`,
  defend: `--set ${STATE}={"done":["brief","osint","guess","flip"]} --set guess_e18_landed=true`,
  stepAway: `--set ${STATE}={"done":["brief","osint","guess","flip","defend"]} --set episode_e18_credential_attacks_at_scale_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e18_credential_attacks_at_scale_defend_percent=60 --set kit_quiet=true`,
};

/** Standing hides for every guesser shot (all aspects): the passphrase panel is the answer, the live log line echoes each tried guess. Hidden rows still step. */
export const GUESSER_HIDE_CSS = `
.epr-gs-panel[data-panel="passphrase"] { display: none !important; }
.epr-gs-live { display: none !important; }
/* the result row prints "3 of 5 accounts opened" while still queued: hide its text until the row opens */
.epr-gs-row[data-row="spray_result"].epr-gs-queued .epr-gs-text { visibility: hidden !important; }
`;
/** Alerts shots (class names confirmed in the dry run): the team badge and the sorted tally, the brief panel, the flag chips and the verdict hint words are hidden; the open card's
 *  .mail-body is clipped to its first line ("Hello,"), because the advisory sits in the same text block as sentence 1 and a crop cannot split it. */
export const DEFEND_HIDE_CSS = `
.triage-client .aw-team-tally, .triage-client .tri-progress, .triage-client .tri-brief-text, .triage-client .tri-flags, .triage-client .tri-false-flags, .triage-client .tri-live { display: none !important; }
span.tri-verdict-hint { visibility: hidden !important; }
.triage-client .mail-body { height: 26px !important; overflow: hidden !important; }
`;
/** Narrow inbox for 9:16 and 1:1 (760 px; the 560 default in NARROW_CSS is too tight for the list plus reader). */
export const NARROW_INBOX_CSS = (px = 760) => `
.mail-client.triage-client { max-width: ${px}px !important; width: ${px}px !important; overflow-x: hidden !important; }
.epr-kiosk-bezel { max-width: ${px}px !important; }
body:has(.mail-client) .epr-kiosk-bezel { visibility: hidden !important; }
.triage-client .tri-verdicts { flex-wrap: wrap !important; }
`;
/** Narrowed panels for 9:16 and 1:1 (real frame classes): OSINT browser (outer shell stays 1100, crop the middle), mail client 960, the kiosk bezel. */
export const NARROW_CSS = (px = 560) => `
.osint-browser-game-container { max-width: ${px}px !important; width: ${px}px !important; }
.mail-client { max-width: ${px}px !important; width: ${px}px !important; overflow-x: hidden !important; }
.epr-kiosk-bezel { max-width: ${px}px !important; }
.minigame-game-container:has(.epr-gs-root) { max-width: ${px + 40}px !important; }
.epr-gs-root { max-width: ${px}px !important; }
body:has(.mail-client) .epr-kiosk-bezel, body:has(.osint-browser-game-container) .epr-kiosk-bezel { visibility: hidden !important; }
`;

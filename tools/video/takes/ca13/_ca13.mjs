// Shared helpers for the ca13 (The AI assistant, Brightwell Foods) take scripts. Everything generic comes from ../ca07/_ca07.mjs
// (which re-exports ca05, ca01, ca15 and ca12b). Nothing here sets a game global; every action is a real click or select change.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText, visible, waitVisible, mouseClick,
  watchSubtitles, closeBeforeMenu, watchBubbles, watchVoice, checkSprite, css, watchTts, walkToNpc, talkTo, watchBarkAudio, NARROW_MAIL } from '../ca07/_ca07.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText, visible, waitVisible, mouseClick,
  watchSubtitles, closeBeforeMenu, watchBubbles, watchVoice, checkSprite, css, watchTts, walkToNpc, talkTo, watchBarkAudio, NARROW_MAIL };

/** Entry-state flags (run-take.sh new-game flags; --set JSON has no spaces or quotes). */
export const SEEDS = {
  flip: '--set episode_e13_ai_assistant_state={"done":["brief","write"]} --set phish_assist_reader_attempts=1 --set phish_assist_reader_landed=true',
  defend: '--set episode_e13_ai_assistant_state={"done":["brief","write","flip"]} --set phish_assist_reader_attempts=1',
  stepAway: '--set episode_e13_ai_assistant_state={"done":["brief","write","flip","defend"]} --set episode_e13_ai_assistant_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e13_ai_assistant_defend_percent=60 --set kit_quiet=true',
};

/** Hidden in the attack run (CSS): the Red flags list and sub line (the counter stays), advisories, the flip body under the heading. */
export const ATTACK_HIDE = `
.mail-redflag-list, .mail-redflag-sub, .mail-redflag-advice, .mail-redflag-clean, .mail-checklist-advisory { display: none !important; }
.aw-flip > :not(h2.aw-heading) { display: none !important; }`;

/** Narrowed panel for the 9:16 and 1:1 cuts: the mail client (960 px) and the assistant window, to about 560 px. The assistant selector is set once measured. */
export const NARROW = NARROW_MAIL;

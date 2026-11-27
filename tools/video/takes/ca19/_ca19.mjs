// Shared helpers for the ca19 (Malware, ransomware and updates, Quayholt Insurance) take scripts. Generic helpers come from ../ca16/_ca16.mjs (the same Quayholt
// kiosk template, Anjali and Niamh) and ../ca13/_ca13.mjs (inbox hides, mouseClick). Nothing here sets a game global: every action is a real click or a bridge interact,
// and the --set seeds below are entry states passed to new-game.sh (--set fires no events, so kit_quiet is seeded by hand).
import { sleep, buttons, pressButton, waitButton, prepare, openKiosk, hideText, spriteCheck, watchBubbles, watchBarkAudio, watchTts2, pressEl, hideCss, watchVoice, talkTo, closeBeforeMenu,
  waitVoiceStart, hideLong, narrow, tabs, boxOf } from '../ca16/_ca16.mjs';
import { css, visible, mouseClick, checkSprite } from '../ca13/_ca13.mjs';
export { sleep, buttons, pressButton, waitButton, prepare, openKiosk, hideText, spriteCheck, watchBubbles, watchBarkAudio, watchTts2, pressEl, hideCss, watchVoice, talkTo, closeBeforeMenu,
  waitVoiceStart, hideLong, narrow, tabs, boxOf, css, visible, mouseClick, checkSprite };

export const SCENARIO = 'ca19_malware_and_updates';
const ST = 'episode_e19_malware_and_updates_state', P = 'episode_e19_malware_and_updates';
/** Entry-state flags for run-take.sh (each --set is its own word; JSON has no spaces; backslash-escape the quotes in a shell). */
export const SEEDS = {
  flip: `--set ${ST}={"done":["brief","mistake"]}`,
  defend: `--set ${ST}={"done":["brief","mistake","flip"]}`,
  stepAway: `--set ${ST}={"done":["brief","mistake","flip","defend"]} --set ${P}_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set ${P}_defend_percent=60 --set kit_quiet=true`,
};

/** Marks the player's sprite key. Strict (throws on the hooded hacker) in a real run; the dry run (BE_DRY=1) is lenient because BE_SPRITE is not set there. */
export const sprite = (page, mark) => checkSprite(page, mark, { strict: !process.env.BE_DRY });

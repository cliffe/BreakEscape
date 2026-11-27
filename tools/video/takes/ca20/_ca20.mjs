// Shared helpers for the ca20 (Working away from the office, Tarrowby Logistics) take scripts. Generic helpers come from ../ca16/_ca16.mjs (same kiosk template and
// person-chat helpers) and ../ca13/_ca13.mjs (inbox mouse helpers, sprite check). Nothing here sets a game global: every action is a real click or a bridge interact,
// and the --set seeds below are entry states passed to new-game.sh (--set fires no events, so kit_quiet is seeded by hand).
import { sleep, buttons, pressButton, waitButton, prepare, openKiosk, hideText, spriteCheck, watchBubbles, watchBarkAudio, watchTts2, pressEl, hideCss, watchVoice, talkTo, closeBeforeMenu,
  waitVoiceStart, hideLong, narrow, tabs, boxOf, interactRetry, clickEl } from '../ca16/_ca16.mjs';
import { css, visible, waitVisible, mouseClick, checkSprite } from '../ca13/_ca13.mjs';
export { sleep, buttons, pressButton, waitButton, prepare, openKiosk, hideText, spriteCheck, watchBubbles, watchBarkAudio, watchTts2, pressEl, hideCss, watchVoice, talkTo, closeBeforeMenu,
  waitVoiceStart, hideLong, narrow, tabs, boxOf, interactRetry, clickEl, css, visible, waitVisible, mouseClick, checkSprite };

export const SCENARIO = 'ca20_remote_and_mobile_working';
export const ST = 'episode_e20_remote_and_mobile_working_state';
/** Entry-state flags for run-take.sh (each --set is its own word; JSON has no spaces; backslash-escape the quotes in a shell). */
export const SEEDS = {
  defend: `--set ${ST}={"done":["brief","mistake","flip"]}`,
  /** room and Chidi end: three flags by hand (kit_quiet is set by an event that --set does not fire). Never kit_key_caught or kit_caught. */
  room: '--set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true',
};

/** Marks the player's sprite key. Strict (throws on the hooded hacker) in a real run; the dry run (BE_DRY=1) is lenient because BE_SPRITE is not set there. */
export const sprite = (page, mark) => checkSprite(page, mark, { strict: !process.env.BE_DRY });

/** Hide every NPC world bubble (Phaser containers; CSS cannot reach them). Game state is untouched. Returns true once npcWorldBubbles exists. */
export const HIDE_BUBBLES = () => { window.__hideBub = setInterval(() => { try { const bs = window.npcWorldBubbles && window.npcWorldBubbles.bubbles; if (!bs) return; for (const [, b] of bs) if (b && b.box && !b.box.__hid) { b.box.__hid = true; const o = b.box.setVisible.bind(b.box); b.box.setVisible = () => o(false); b.box.setVisible(false); } } catch (_) {} }, 5); return true; };

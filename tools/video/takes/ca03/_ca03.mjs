// Shared helpers for the ca03 (Help desk resets, Quayholt Insurance) take scripts. Generic helpers come from ../ca08/_ca08.mjs (which
// re-exports ca01, ca15 and ca12b). Nothing here sets a game global: every action is a real click, a select change or a bridge call.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, walkToNpc, talkTo, closeBeforeMenu, keyLegs, watchBubbles, watchTts, watchBarkAudio, narrowPanel, spriteCheck } from '../ca08/_ca08.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, walkToNpc, talkTo, closeBeforeMenu, keyLegs, watchBubbles, watchTts, watchBarkAudio, narrowPanel, spriteCheck };
export const addCss = (page, css) => page.addStyleTag({ content: css });

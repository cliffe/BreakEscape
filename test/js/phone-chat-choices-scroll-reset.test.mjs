// A new reply set renders scrolled to the top, and the "more choices" cue is re-evaluated.
// (Live finding: after picking the last reply of a scrolled set in a landscape call, the next
// set stayed scrolled to the end, hiding replies 1-3 and the cue.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

console.log = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const chat = join(here, '../../public/break_escape/js/minigames/phone-chat');
const dataUrl = (s) => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
const stubs = `
const displayPhoneLine = (type, text) => ({ type, text }), otherSpeaker = () => null,
  displayDashes = (s) => s, messageClockText = () => '9:41', ASSETS_PATH = '';
const noop = () => {};
const portraitFor = () => ({}), npcDmFields = () => ({}), onAccentColour = noop;
class TTSManager {} class MusicController {} class ChatInfluence {} class PhoneChatConversation {} class InkEngine {}
const hasHiddenChoicesBelow = (el) => el.scrollTop + el.clientHeight < el.scrollHeight - 2,
  numberedChoiceText = (t, i) => (i + 1) + '. ' + t, createBottomPin = () => ({ destroy: noop, pin: noop }),
  isPhoneCallMode = () => false, callLabelFor = noop, formatCallDuration = noop, callSubtitle = noop,
  CALL_STATUS_HTML = '', CALL_SPEAKING_HTML = '', CALL_CONTROLS_HTML = '';
`;
const src = readFileSync(join(chat, 'phone-chat-ui.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '');
const mod = await import(dataUrl(stubs + src));
const UI = mod.PhoneChatUI || mod.default;

// Minimal box that behaves like a scroller: clearing it empties the content, so the browser
// clamps scrollTop only if the new content is shorter; here the new set is taller, so the
// stale offset would survive unless addChoices resets it.
function makeUi(callMode) {
    const children = [];
    const box = {
        scrollTop: 123, clientHeight: 93, get scrollHeight() { return 216; },
        set innerHTML(v) { children.length = 0; }, get innerHTML() { return ''; },
        appendChild(c) { children.push(c); },
    };
    const cue = { visible: false, classList: { toggle(_, on) { cue.visible = on; }, remove() { cue.visible = false; } } };
    const ui = Object.create(UI.prototype);
    ui.isCallMode = callMode;
    ui.elements = { choicesContainer: box, choicesMoreCue: cue, conversationView: { classList: { add() {}, remove() {} } } };
    ui.scrollToBottom = () => {};
    ui.syncSkipHint = () => {};
    return { ui, box, cue };
}
globalThis.document = { createElement: () => ({ dataset: {}, className: '' }) };

for (const callMode of [true, false]) {
    test(`addChoices resets the reply box scroll and re-shows the cue (${callMode ? 'call' : 'DM chat'})`, () => {
        const { ui, box, cue } = makeUi(callMode);
        ui.addChoices([{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }]);
        assert.equal(box.scrollTop, 0);
        assert.equal(cue.visible, true);
    });
}

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
        // Chromium keeps the old offset of an emptied scroller and restores it when content
        // comes back, so only a reset made after the append sticks (live run 2, 844x390)
        set innerHTML(v) { children.length = 0; box._restore = box.scrollTop; },
        get innerHTML() { return ''; },
        appendChild(c) { children.push(c); if (box._restore != null) { box.scrollTop = box._restore; box._restore = null; } },
        contains(el) { return !!el && children.includes(el); },
        querySelector() { return children[0] || null; },
        children,
    };
    const cue = { visible: false, classList: { toggle(_, on) { cue.visible = on; }, remove() { cue.visible = false; } } };
    const ui = Object.create(UI.prototype);
    ui.isCallMode = callMode;
    ui.elements = { choicesContainer: box, choicesMoreCue: cue, conversationView: { classList: { add() {}, remove() {} } } };
    ui.scrollToBottom = () => {};
    ui.syncSkipHint = () => {};
    return { ui, box, cue };
}
globalThis.document = {
    activeElement: null,
    createElement: () => {
        const b = { dataset: {}, className: '', focus() { globalThis.document.activeElement = b; },
            matches: (q) => q === ':focus-visible' && globalThis.__keyboardFocus === true };
        return b;
    },
};

for (const callMode of [true, false]) {
    test(`addChoices resets the reply box scroll and re-shows the cue (${callMode ? 'call' : 'DM chat'})`, () => {
        const { ui, box, cue } = makeUi(callMode);
        ui.addChoices([{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }]);
        assert.equal(box.scrollTop, 0);
        assert.equal(cue.visible, true);
    });
}

test('a reply picked from the keyboard hands focus to the first reply of the next set', () => {
    const { ui, box } = makeUi(true);
    ui.addChoices([{ text: 'a' }, { text: 'b' }]);
    globalThis.__keyboardFocus = true;
    box.children[1].focus();               // keyboard player on reply 2
    ui.clearChoices();                     // the pick clears the set; focus would drop to BODY
    document.activeElement = null;
    ui.addChoices([{ text: 'c' }, { text: 'd' }]);
    assert.ok(document.activeElement === box.children[0]);
});

test('focus is left alone when it was not on a reply', () => {
    const { ui, box } = makeUi(false);
    ui.addChoices([{ text: 'a' }]);
    const elsewhere = { focus() {} };
    document.activeElement = elsewhere;
    ui.clearChoices();
    ui.addChoices([{ text: 'b' }]);
    assert.ok(document.activeElement === elsewhere);
});

test('a mouse pick does not move focus to the next set (Space/Enter keep skipping)', () => {
    const { ui, box } = makeUi(true);
    ui.addChoices([{ text: 'a' }, { text: 'b' }]);
    globalThis.__keyboardFocus = false;
    box.children[0].focus();               // a click focuses the button, but not :focus-visible
    ui.clearChoices();
    document.activeElement = null;
    ui.addChoices([{ text: 'c' }]);
    assert.ok(document.activeElement === null);
});

test('a keyboard pick does not pull focus back once the player has moved elsewhere', () => {
    const { ui, box } = makeUi(true);
    ui.addChoices([{ text: 'a' }]);
    globalThis.__keyboardFocus = true;
    box.children[0].focus();
    ui.clearChoices();
    const endButton = { focus() {} };
    document.activeElement = endButton;    // Tab to the end-call button during the typewriter
    ui.addChoices([{ text: 'b' }]);
    assert.ok(document.activeElement === endButton);
});

test('opening another conversation clears a pending hand-off', () => {
    const { ui, box } = makeUi(false);
    ui.addChoices([{ text: 'a' }]);
    globalThis.__keyboardFocus = true;
    box.children[0].focus();
    ui.clearChoices();
    document.activeElement = null;
    assert.equal(ui._refocusChoices, true);
    try { ui.showConversation(null); } catch { /* the guard returns early */ }
    assert.equal(ui._refocusChoices, false);
});

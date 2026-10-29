// ENG-07 (E13): the configurable video-call label and participant tag on the person-chat
// video-call bar. With no videoLabel the bar keeps the default "SECURE VIDEO LINK" (so m02 is
// unchanged); with videoLabel/participantTag it shows those, set via textContent. Runs the real
// person-chat-ui.js initVideoCallOverlay in a jsdom document, with the heavy portrait renderer
// stubbed (the status bar is built before the PiP, so the label is exercised directly).
// Run with: bundle exec node --test test/js/social-video-call-label.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-vc-label-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
// The real file under test, plus the light pure helpers it imports.
for (const rel of [
    'minigames/person-chat/person-chat-ui.js',
    'minigames/person-chat/person-chat-camera.js',
    'utils/display-dashes.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
// Stub the heavy renderer and chrome the UI imports at load, so the overlay can be built without
// the canvas/sprite pipeline. initVideoCallOverlay's status bar runs before the PiP renderer.
writeFileSync(join(dir, 'minigames/person-chat/person-chat-portraits.js'),
    'export default class PersonChatPortraits { constructor() {} init() {} }\n');
mkdirSync(join(dir, 'utils'), { recursive: true });
writeFileSync(join(dir, 'utils/portrait-variants.js'), 'export function portraitFor() { return null; }\n');
mkdirSync(join(dir, 'ui'), { recursive: true });
writeFileSync(join(dir, 'ui/pretext-chrome.js'), 'export class ChatInfluence {}\n');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
console.warn = () => {};
console.error = () => {};

const PersonChatUI = (await import(pathToFileURL(join(dir, 'minigames/person-chat/person-chat-ui.js')))).default;

function overlay(params = {}) {
    const container = document.createElement('div');
    const ui = new PersonChatUI(container, {
        npc: { displayName: 'Gwen Pritchard' },
        playerData: {},
        videoCall: true,
        ...params
    }, { getNPC: () => null });
    ui.elements.root = document.createElement('div');
    ui.initVideoCallOverlay();
    const bar = ui.elements.root.querySelector('.person-chat-vc-statusbar');
    return { ui, bar };
}
const done = (ui) => { if (ui.callTimerInterval) clearInterval(ui.callTimerInterval); };

test('no videoLabel: the bar keeps the default SECURE VIDEO LINK and shows no tag (m02 unchanged)', () => {
    const { ui, bar } = overlay();
    assert.equal(bar.querySelector('.person-chat-vc-link').textContent, 'SECURE VIDEO LINK');
    assert.equal(bar.querySelector('.person-chat-vc-peer').textContent, 'Gwen Pritchard');
    assert.equal(bar.querySelector('.person-chat-vc-tag').hidden, true);
    done(ui);
});

test('videoLabel and participantTag show on the bar, via textContent', () => {
    const { ui, bar } = overlay({ videoLabel: 'Brightwell Meet', participantTag: 'External' });
    assert.equal(bar.querySelector('.person-chat-vc-link').textContent, 'Brightwell Meet');
    const tag = bar.querySelector('.person-chat-vc-tag');
    assert.equal(tag.textContent, 'External');
    assert.equal(tag.hidden, false);
    done(ui);
});

test('a label with markup is set as text, not parsed', () => {
    const { ui, bar } = overlay({ videoLabel: '<b>x</b>' });
    const link = bar.querySelector('.person-chat-vc-link');
    assert.equal(link.textContent, '<b>x</b>');
    assert.equal(link.querySelector('b'), null, 'the value is not parsed as HTML');
    done(ui);
});

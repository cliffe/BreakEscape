// Focus follows the ring layer: when the focused ring button is removed (banner to pill, or the
// ring taken down) keyboard focus must not drop to <body> (focus trap R2 m4).
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const npc = { id: 'caller', displayName: 'Caller One', avatar: 'assets/x.png' };
const ringConfig = (extra = {}) => ({
    handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0, ...extra,
});

async function ringOverKeypad(extra = {}) {
    const w = makeWorld({ npcs: [npc] });
    const doc = w.win.document;
    const container = doc.createElement('div');
    container.innerHTML = '<button id="kp-close">X</button><button id="kp-1">1</button>';
    doc.body.appendChild(container);
    w.fw.startMinigame('keypad', null, {});
    w.fw.currentMinigame.container = container;
    w.nm._handleEventMapping('caller', 'door_unlock_attempt', ringConfig(extra), {});
    await w.advance(300);
    return w;
}

test('m4: Answer on a focused banner button moves focus to the new pill Hang up button', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.querySelector('.incoming-call-answer').focus();
        assert.ok(doc.activeElement.classList.contains('incoming-call-answer'));
        w.click('.incoming-call-answer');
        await w.advance(100);
        const hang = doc.querySelector('#phone-ring-layer .incoming-call-hold button');
        assert.ok(hang, 'pill has Hang up');
        assert.equal(doc.activeElement, hang, 'focus is on Hang up, not body');
    } finally { w.restore(); }
});

test('m4: without focus in the layer, the pill does not take focus', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.getElementById('kp-1').focus();
        w.click('.incoming-call-answer');
        await w.advance(100);
        assert.equal(doc.activeElement.id, 'kp-1');
    } finally { w.restore(); }
});

test('m4: hanging up the pill with focus on it hands focus to the open minigame first control', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.querySelector('.incoming-call-answer').focus();
        w.click('.incoming-call-answer');
        await w.advance(100);
        const hang = doc.querySelector('#phone-ring-layer .incoming-call-hold button');
        hang.focus();
        hang.click();
        await w.advance(100);
        assert.equal(doc.querySelector('#phone-ring-layer .incoming-call'), null, 'ring gone');
        assert.equal(doc.activeElement.id, 'kp-close');
    } finally { w.restore(); }
});

test('m4: declining the focused banner hands focus to the minigame; with no minigame nothing is forced', async () => {
    const w = await ringOverKeypad();
    try {
        const doc = w.win.document;
        doc.querySelector('.incoming-call-decline').focus();
        w.click('.incoming-call-decline');
        await w.advance(100);
        assert.equal(doc.activeElement.id, 'kp-close');
    } finally { w.restore(); }
    const w2 = makeWorld({ npcs: [npc] });
    try {
        const doc = w2.win.document;
        w2.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w2.advance(300);
        doc.querySelector('.incoming-call-decline').focus();
        w2.click('.incoming-call-decline');
        await w2.advance(100);
        assert.equal(doc.querySelector('#phone-ring-layer .incoming-call'), null);
        assert.equal(doc.activeElement, doc.body, 'no minigame: focus is left alone');
    } finally { w2.restore(); }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';
const npc = { id: 'caller', displayName: 'Caller One' };
const ringConfig = () => ({ handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0 });
// A2c R2 m3: the settingAside guard in phone-ringer-dom.js keeps a refused open's retry wait (without it
// the put-aside's deferred nudge zeroes retryAt and a second attempt follows at once).
test('settingAside: a refused open after a put-aside waits RETRY_OPEN_MS before trying again', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const doc = w.win.document;
        const laptop = doc.createElement('div'); laptop.id = 'laptop-popup'; laptop.style.display = 'block'; doc.body.appendChild(laptop);
        w.win.closeLaptop = () => { laptop.style.display = 'none'; w.win.phoneRinger?.onPopupClosed?.(); };
        w.win.openCryptoWorkstation = () => { laptop.style.display = 'block'; };
        const attempts = [];
        const real = w.fw.startMinigame.bind(w.fw);
        w.fw.startMinigame = (type, c, p) => {
            if (type === 'phone-chat') { attempts.push(w.win.performance.now()); if (attempts.length === 1) return null; }
            return real(type, c, p);
        };
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig(), {});
        await w.advance(300);
        w.click('.incoming-call-answer');
        await w.advance(700);
        assert.equal(attempts.length, 1, 'first open refused');
        assert.equal(laptop.style.display, 'none');
        await w.advance(1000);
        assert.equal(attempts.length, 1, 'no second attempt before RETRY_OPEN_MS');
    } finally { w.restore(); }
});

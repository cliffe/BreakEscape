// A2b R1 M3 / m3: the bark hold during a ringer call, driven through the real
// minigame-manager.js endMinigame (drain, then end hook), the real NPCBarkSystem._shouldDefer,
// and the real ringer adapter. Also: the end hook still runs when a cleanup throws.
// Copy list: minigame-manager.js, base-minigame.js, display-dashes.js, npc-barks.js (imports stubbed).
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, endCall, jsRoot } from './phone-ring-harness.mjs';

const dir = mkdtempSync(join(tmpdir(), 'phone-bark-hold-'));
const rd = (p) => readFileSync(join(jsRoot, p), 'utf8');
writeFileSync(join(dir, 'display-dashes.mjs'), rd('utils/display-dashes.js'));
writeFileSync(join(dir, 'base-minigame.mjs'), rd('minigames/framework/base-minigame.js').replace("'../../utils/display-dashes.js'", "'./display-dashes.mjs'"));
writeFileSync(join(dir, 'minigame-manager.mjs'), rd('minigames/framework/minigame-manager.js').replace("'./base-minigame.js'", "'./base-minigame.mjs'"));
writeFileSync(join(dir, 'npc-barks.mjs'), `
const ASSETS_PATH = '', overlayDepth = () => 0, displayDashes = (s) => s, releaseHeldBarks = () => {};
const workstationPopupOpen = () => false, phoneThreadOpenFor = () => false, openPhoneThread = () => null, threadTextKey = () => '';
const barkLifetimeMs = () => 0, barksToTrim = () => 0, BARK_RESUME_MIN_MS = 0, inventoryBlockedByForcedMinigame = () => false;
const phoneBarkText = (s) => s;
class TTSManager {}
` + rd('systems/npc-barks.js').replace(/^import [\s\S]*?;\s*$/gm, '').replace('export default class', 'export class'));
const { MinigameFramework } = await import(pathToFileURL(join(dir, 'minigame-manager.mjs')).href);
const { NPCBarkSystem } = await import(pathToFileURL(join(dir, 'npc-barks.mjs')).href);

const npc = { id: 'caller', displayName: 'Caller One', avatar: 'assets/x.png' };
const ringConfig = { handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0 };

/** The real endMinigame on the harness's fake start; the bark system is the real _shouldDefer. */
function wire(w) {
    const fw = Object.create(MinigameFramework);
    fw.currentMinigame = null;
    fw.startMinigame = function (type, container, params) {
        const mg = { _sceneType: type, params, _ending: false, cleanup() { if (this.boom) throw new Error('cleanup boom'); } };
        this.currentMinigame = mg;
        w.calls.started.push({ type, params });
        w.win.phoneRinger?.onMinigameStarted?.(type, params);
        return mg;
    };
    w.win.MinigameFramework = fw;
    w.win.resumeKeyboardInput = () => {};
    const bark = Object.create(NPCBarkSystem.prototype);
    bark.deferredBarkQueue = [];
    const drained = [];
    bark.drainDeferredBarks = () => { drained.push(bark._shouldDefer({ npcId: 'other', text: 'hello' })); };
    w.win.barkSystem = bark;
    return { fw, bark, drained };
}

test('M3: a bark from another contact is held while a ringer call is connected, including the open delay, and the close drains with the hold released', async () => {
    const w = makeWorld({ npcs: [npc, { id: 'other', displayName: 'Other' }] });
    try {
        const { fw, bark, drained } = wire(w);
        const payload = { npcId: 'other', text: 'hello' };
        assert.equal(bark._shouldDefer(payload), false, 'no call: not held');
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig, {});
        await w.advance(300);
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
        w.click('.incoming-call-answer');
        await w.advance(200);
        assert.equal(w.calls.started.length, 0, 'in the open delay');
        assert.equal(bark._shouldDefer(payload), true, 'held in the gap between Answer and the call opening');
        await w.advance(500);
        assert.equal(w.calls.started.length, 1);
        assert.equal(bark._shouldDefer(payload), true, 'held while the call is open');
        Object.assign(fw.currentMinigame, { _endedByCall: true });
        fw.endMinigame(true);
        await w.advance(100);
        assert.deepEqual(drained, [false], 'the drain at close runs with the hold released');
        assert.equal(bark._shouldDefer(payload), false, 'and after the call');
    } finally { w.restore(); }
});

test('m3: the real endMinigame runs the ringer end hook with the ending minigame when cleanup throws', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        const { fw } = wire(w);
        w.nm._handleEventMapping('caller', 'room_entered', ringConfig, {});
        await w.advance(300);
        w.click('.incoming-call-answer');
        await w.advance(700);
        const mg = fw.currentMinigame;
        assert.ok(mg?.params?.ringerCall);
        mg.boom = true;
        mg._endedByCall = true;
        const seen = [];
        const hook = w.win.phoneRinger.onMinigameEnded;
        w.win.phoneRinger.onMinigameEnded = (m) => { seen.push(m); return hook.call(w.win.phoneRinger, m); };
        assert.throws(() => fw.endMinigame(true), /cleanup boom/);
        assert.deepEqual(seen, [mg], 'the end hook still got the ending minigame');
        await w.advance(100);
        assert.equal(w.ringer.callActive(), false, 'the ringer closed the call');
    } finally { w.restore(); }
});

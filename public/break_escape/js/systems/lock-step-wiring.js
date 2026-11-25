// Boot wiring for a lock's second step (ops layer S8c unit 24). main.js calls wireLockStep() once,
// after window.stateSync exists. It configures the leaf modules with the page's real pieces and
// sets window.lockStep, which api-client.js reaches the way it reaches window.stateSync.
//
// Everything the page owns is read from `win` at CALL time (never captured at wire time), so a
// piece that is installed later (a toast, a sound, the state sync) is still found when it is used.

import { configure as configureLockStep, run, isCancel, cancelFeedback, runCount } from './lock-step.js';
import { openPane, configure as configurePane, findObjectData } from '../ui/lock-step-pane.js';
import { findAllDoorSpritesForRoom } from './npc-game-bridge.js';

const NOT_APPROVED = 'Not approved.';
const TOAST_MS = 3000;

const words = (id) => String(id || '').replace(/[_-]+/g, ' ').trim();

// The lock's name for the pane's title. A room in a scenario has no `name`: it carries `door_sign`
// (the label on its door), so a door is named by that, then by its id read as words. An object is
// named as the pane's own lookup names it (scenario objects, then held items).
export function lockName(win, ctx = {}) {
    if (ctx.targetType === 'door') {
        const room = win.gameScenario?.rooms?.[ctx.targetId];
        for (const key of ['door_sign', 'name']) {
            if (room && typeof room[key] === 'string' && room[key]) return room[key];
        }
        return words(ctx.targetId) || 'this door';
    }
    const data = findObjectData(win, ctx.targetId);
    return data && typeof data.name === 'string' && data.name ? data.name : 'this lock';
}

// True when nothing else holds the screen: no live minigame, no conversation waiting to return,
// no confirm box, and the player is not knocked out.
export function isScreenClear(win = window) {
    const m = win.MinigameFramework?.currentMinigame;
    if (m && !m._ending) return false;
    if (win.pendingConversationReturn) return false;
    if (win.gameConfirmOpen?.()) return false;
    if (win.playerIsKnockedOut?.() === true) return false;
    return true;
}

// True when the client already shows this lock open (a door's room unlocked, an object unlocked)
export function isOpenInClient(win, targetType, targetId) {
    if (targetType === 'door') {
        const room = win.gameScenario?.rooms?.[targetId];
        return !!room && room.locked === false;
    }
    const data = findObjectData(win, targetId);
    return !!data && data.locked === false;
}

// Records who opened a gated door: on the room, and on every door sprite that leads to it
export function writeOpener(win, roomId, opener) {
    const room = win.gameScenario?.rooms?.[roomId];
    if (room) room.npcStepOpener = opener;
    let sprites = [];
    try { sprites = findAllDoorSpritesForRoom(roomId); } catch (e) { sprites = []; }
    for (const s of sprites) {
        if (s && s.doorProperties) s.doorProperties.npcStepOpener = opener;
    }
}

// `timers` ({ setTimer, clearTimer }) is for tests, which never wait on a real timer
export function wireLockStep(win = window, timers = {}) {
    const mfa = win.mfaClient;
    const setTimer = timers.setTimer || ((fn, ms) => setTimeout(fn, ms));
    const clearTimer = timers.clearTimer || ((h) => clearTimeout(h));

    // The pane the second step has open now, kept so the test bridge can read and drive it
    let current = null;
    const trackedOpenPane = (ctx) => {
        const pane = openPane(ctx);
        current = pane;
        Promise.resolve(pane.done).then(() => { if (current === pane) current = null; }, () => {});
        return pane;
    };

    configurePane({ mfa, setTimer, clearTimer, lockName: (ctx) => lockName(win, ctx) });
    configureLockStep({
        mfa,
        // the same poster ApiClient.unlock uses
        post: (path, body) => win.ApiClient.post(path, body),
        nextClientTs: () => win.stateSync?.nextClientTs?.(),
        applyServerWrites: (answer, ts) => win.stateSync?.applyServerWrites?.(answer, ts),
        openPane: trackedOpenPane,
        isClear: () => isScreenClear(win),
        isOpenInClient: (type, id) => isOpenInClient(win, type, id),
        setTimer,
        clearTimer,
        toast: (text) => win.gameAlert?.(text, text === NOT_APPROVED ? 'error' : 'info', '', TOAST_MS),
        rejectTone: () => win.playUISound?.('reject'),
        writeOpener: (roomId, opener) => writeOpener(win, roomId, opener)
    });

    win.lockStep = {
        run,
        isCancel,
        cancelFeedback,
        runCount,
        // for the test bridge: the open pane's own state, or null
        paneState: () => (current && typeof current.getTestState === 'function' ? current.getTestState() : null)
    };
    return win.lockStep;
}

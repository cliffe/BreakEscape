/**
 * Talking to an NPC while another screen is open (m09 blind playtest: a HaX phone chat was
 * open, the player interacted with jesse_tran, person-chat refused as 'minigame-active' and
 * said nothing, so the tester read it as "the NPC has no dialogue").
 *
 * What happens now, decided here and called from interactions.js before person-chat starts:
 *  - a phone TEXT chat is closed the way its X closes it (closeByPlayer, so history and the
 *    unread state are kept), and person-chat opens once the phone has really gone;
 *  - a phone call (voiced, ringer or pretext) stays up: "Hang up to talk to <name>.";
 *  - a phone that cannot be closed (disableClose): "Finish the phone conversation first.";
 *  - any other open screen stays up: "Close <title> first." (or the generic line).
 *
 * No imports, so node tests load it on its own. Installed as window.handleBusyNpcChat by
 * game.js (a dynamic import, so interactions.js needs no new static import).
 */

/** Polls, in ms, for the closing phone to leave the framework; gives up after the cap. */
const CLOSE_POLL_MS = 25;
const CLOSE_CAP_MS = 1500;

/** The minigame in the way, or null when the screen is free (a minigame mid-end is free). */
export function openMinigame(framework) {
    const mg = framework?.currentMinigame;
    return mg && !mg._ending ? mg : null;
}

/** 'locked' | 'call' | 'text' for an open phone-chat. */
export function phoneKind(mg) {
    const p = mg?.params || {};
    if (p.disableClose === true) return 'locked';
    if (p.voiced === true || p.ringerCall || p.pretextCallId || mg?.ui?.isCallMode === true) return 'call';
    return 'text';
}

/**
 * @param {object} ctx
 * @param {object} ctx.framework - window.MinigameFramework
 * @param {string} ctx.npcId
 * @param {string} [ctx.displayName]
 * @param {(msg:string)=>void} ctx.alert - toast, plain text
 * @param {()=>void} ctx.startChat - opens person-chat with the NPC
 * @param {(fn:Function,ms:number)=>any} [ctx.setTimer] - injectable for tests
 * @param {()=>number} [ctx.now]
 * @returns {boolean} true when this call dealt with the interaction (the caller returns);
 *   false when nothing is open and the caller starts person-chat itself
 */
export function handleBusyNpcChat(ctx) {
    const { framework, alert, startChat } = ctx;
    const mg = openMinigame(framework);
    if (!mg) return false;
    const name = ctx.displayName || ctx.npcId || 'them';

    if (mg._sceneType === 'phone-chat') {
        const kind = phoneKind(mg);
        if (kind === 'locked') { alert('Finish the phone conversation first.'); return true; }
        if (kind === 'call') { alert(`Hang up to talk to ${name}.`); return true; }
        // The same path as the X: closedByPlayer, complete(false), the framework's end
        try { mg.closeByPlayer(); } catch (e) { console.warn('phone close failed', e); }
        const setTimer = ctx.setTimer || ((fn, ms) => setTimeout(fn, ms));
        const now = ctx.now || (() => Date.now());
        const t0 = now();
        const wait = () => {
            const still = framework.currentMinigame === mg;
            if (still && now() - t0 < CLOSE_CAP_MS) { setTimer(wait, CLOSE_POLL_MS); return; }
            if (still) { alert('Finish the phone conversation first.'); return; }   // never leave a half-closed phone
            if (!openMinigame(framework)) startChat();
        };
        wait();
        return true;
    }

    const title = typeof mg.params?.title === 'string' ? mg.params.title.trim() : '';
    alert(title ? `Close ${title} first.` : 'Close the open screen first.');
    return true;
}

if (typeof window !== 'undefined') window.handleBusyNpcChat = handleBusyNpcChat;

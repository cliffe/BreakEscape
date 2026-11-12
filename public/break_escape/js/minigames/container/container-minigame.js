// Container Minigame
import { MinigameScene } from '../framework/base-minigame.js';
import { addToInventory, removeFromInventory, inventoryImageKey } from '../../systems/inventory.js';
import { containerImageUrl, containerImageHtml, takeStandIn } from './container-item-image.js';
import { makeDraggable } from '../../utils/helpers.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { resolveObjectField } from '../../utils/conditional-text.js';
import { escapeHtml } from '../../utils/escape-html.js';
import { escapeHtmlKeepWords } from '../../utils/escape-html.js';



/**
 * The line a claimed session's desktop shows above the account bar (UX access R1 finding 5):
 * the player is on someone else's open screen, and it ends without warning. An owner claim
 * ends when the owner comes back to the desk; a guest claim (a screen a borrowing colleague
 * left open, 9.2 H) ends when the screen locks itself. Null for any other session.
 */
export function claimLineText(session) {
    if (!session || session.via !== 'claim') return null;
    const name = session.displayName || session.username || 'someone';
    return session.guest
        ? `You're on the screen ${name} left open. It ends when the screen locks.`
        : `You're on ${name}'s open screen. It ends when they come back or the screen locks.`;
}

/**
 * The choices a takeable file on a sign-in desktop offers (access model 5.1): Open,
 * Copy to inventory, Move to inventory, Cancel; only Open (and Cancel) once it is held.
 * `"transfer": "copy" | "move" | "both"` (default both) restricts the two takes.
 */
export function transferChoices(item, held) {
    if (held) return ['open', 'cancel'];
    const transfer = ['copy', 'move', 'both'].includes(item?.transfer) ? item.transfer : 'both';
    const out = ['open'];
    if (transfer !== 'move') out.push('copy');
    if (transfer !== 'copy') out.push('move');
    out.push('cancel');
    return out;
}

/**
 * True when a container lockable is one of the network screens (slice 9.3a, 4.3): a
 * remote desktop (scenarioData.remote), a share opened from the network view
 * (scenarioData.networkShare, or a folder in one: sourceResourceId), a mapped share on a
 * remote desktop, or a folder opened from a remote session's desktop. A reader opened from
 * one of these reopens it when it closes (text-file-minigame.js cleanup).
 */
export function isNetworkScreenContainer(item) {
    if (!item || typeof item !== 'object') return false;
    const data = item.scenarioData || {};
    if (data.remote && data.remote.footholdId) return true;
    if (data.networkShare && data.networkShare.footholdId) return true;
    if (item.sourceResourceId && !item.sourcePcId) return true;
    if (item.parentLockable) return isNetworkScreenContainer(item.parentLockable);
    const pcId = item.sourcePcId;
    return !!(pcId && typeof window !== 'undefined' && window.pcSessions?.get?.(pcId)?.remote === true);
}
if (typeof window !== 'undefined') window.isNetworkScreenContainer = isNetworkScreenContainer;

/**
 * What the world looked like when a reader (text file, notes) closed and armed its
 * return to the container: the time and the player's room.
 */
export function containerReturnArm() {
    const w = typeof window !== 'undefined' ? window : {};
    return { at: Date.now(), room: w.currentPlayerRoom || '' };
}

/**
 * Why a reader's return to its container must not happen, or null when it may (lab UX
 * review M1). The reader closed some way other than the player's own Close, Cancel or
 * Esc (a hit, the knockout screen, a conversation starting: `ownClose` false); the player
 * is knocked out or was hit since the reader closed; something else has opened; or the
 * player is in another room now.
 * @param {{at:number, room:string}} arm - containerReturnArm() at the close
 * @param {boolean} ownClose - the player closed the reader, or it finished on its own
 */
export function containerReturnBlocked(arm, ownClose = true) {
    const w = typeof window !== 'undefined' ? window : {};
    if (!ownClose) return 'not_own_close';
    try { if (w.playerIsKnockedOut?.()) return 'knocked_out'; } catch (e) { /* no health system */ }
    if (w.minigameClosedByDamage?.()) return 'hit';
    const hitAt = w.lastPlayerHitAt?.();
    if (arm && Number.isFinite(hitAt) && hitAt >= arm.at) return 'hit';
    if (w.MinigameFramework?.currentMinigame) return 'busy';
    if (arm && (w.currentPlayerRoom || '') !== arm.room) return 'room_changed';
    return null;
}
if (typeof window !== 'undefined') {
    window.containerReturnArm = containerReturnArm;
    window.containerReturnBlocked = containerReturnBlocked;
}

/**
 * Which network screen a container is, for networkLinks.landed (4.3): 'desktop' for a remote
 * desktop or anything opened below one, 'share' for a share opened from the view or anything
 * opened below it, null for any other container.
 */
export function networkScreenKind(item) {
    if (!item || typeof item !== 'object') return null;
    const data = item.scenarioData || {};
    if (data.remote && data.remote.footholdId) return 'desktop';
    if (data.networkShare && data.networkShare.footholdId) return 'share';
    if (item.parentLockable) return networkScreenKind(item.parentLockable);
    if (item.sourceResourceId && !item.sourcePcId) return 'share';
    const pcId = item.sourcePcId;
    return pcId && typeof window !== 'undefined' && window.pcSessions?.get?.(pcId)?.remote === true ? 'desktop' : null;
}

// The keyboard refusal at a switched-off PC (user decision q72), if the server sends no text
export const PC_OFF_TEXT = 'This PC is off.';

/**
 * Does a sign-in PC's `affordance.offWhen` hold on these globals? The same reading as
 * unlock-system.js pcSwitchedOff and the server's host_service_off? (a global name, or
 * { name: value } all to match). Kept here so this module imports nothing more.
 */
export function offWhenHolds(pcData, globals = (typeof window !== 'undefined' && window.gameState?.globalVariables) || {}) {
    const cond = pcData?.affordance?.offWhen;
    if (cond === undefined || cond === null || cond === false || cond === '') return false;
    const g = globals || {};
    if (typeof cond === 'string') return !!g[cond];
    if (typeof cond === 'object') return Object.entries(cond).every(([name, value]) => g[name] === value);
    return false;
}

/** The globals an offWhen reads, for the global_variable_changed listeners. */
export function offWhenGlobals(pcData) {
    const cond = pcData?.affordance?.offWhen;
    if (typeof cond === 'string' && cond) return [cond];
    if (cond && typeof cond === 'object') return Object.keys(cond);
    return [];
}

/**
 * The way back from a hand-over to something that is neither a reader nor a container
 * (slice 9.3a, 4.3): a lock screen (a PIN pad, a password, a key or a lockpick), a key
 * alert, a lockout, a phone or a workstation opened from a network screen. Such a screen
 * reports `item` (no landing) and nothing else would bring the player back, so the network
 * screen arms one return, like the capture log's armReturn. It is spent when:
 *   - a container opens (init: a locked folder that opened after its lock, or the screen
 *     itself reopened by a reader), with nothing to do;
 *   - a minigame ends without success and, one tick later, none is open: the network screen
 *     reopens (a cancelled PIN pad, a lockout, a closed phone);
 *   - a minigame ends with success and nothing has opened NETWORK_RETURN_GRACE_MS later
 *     (an unlock opens its folder after a server answer and a short delay; a workstation
 *     closed with success opens nothing): the network screen reopens;
 *   - the hand-over opened nothing at all (a key-locked folder without the key: an alert):
 *     the screen reopens one tick later.
 * A minigame that ends while another is open (a key pad handing over to a lockpick) leaves
 * it armed. Reopening clears pendingContainerReturn when it is still this hand-over's.
 */
export const NETWORK_RETURN_GRACE_MS = 2500;
let networkReturn = null; // { handler, dispatcher, state, timer }

export function disarmNetworkReturn() {
    if (!networkReturn) return;
    const { handler, dispatcher, timer } = networkReturn;
    networkReturn = null;
    if (timer) clearTimeout(timer);
    dispatcher?.off?.('minigame_completed', handler);
    dispatcher?.off?.('minigame_failed', handler);
}

export function networkReturnArmed() {
    return !!networkReturn;
}

function reopenNetworkScreen(state) {
    disarmNetworkReturn();
    if (window.pendingContainerReturn === state) window.pendingContainerReturn = null;
    if (window.MinigameFramework?.currentMinigame) return false;
    if (typeof window.startContainerMinigame !== 'function') return false;
    window.startContainerMinigame(state.containerItem, null, !!state.isTakeable, true);
    return true;
}

/** Check the armed return after `ms`: reopen the network screen if nothing is open by then. */
function scheduleNetworkReturnCheck(ms) {
    const mine = networkReturn;
    if (!mine) return;
    if (mine.timer) clearTimeout(mine.timer);
    mine.timer = setTimeout(() => {
        if (networkReturn !== mine) return;
        mine.timer = null;
        if (window.MinigameFramework?.currentMinigame) return; // stays armed
        if (typeof window.isInteractionMenuOpen === 'function' && window.isInteractionMenuOpen()) return;
        reopenNetworkScreen(mine.state);
    }, ms);
}

/** Arm the one return for a hand-over from a network screen (state: its pendingContainerReturn). */
export function armNetworkReturn(state) {
    disarmNetworkReturn();
    if (!state?.containerItem) return;
    const dispatcher = window.eventDispatcher;
    const handler = (data) => {
        if (!networkReturn || networkReturn.handler !== handler) return;
        scheduleNetworkReturnCheck(data?.success === true ? NETWORK_RETURN_GRACE_MS : 0);
    };
    networkReturn = { handler, dispatcher, state, timer: null };
    if (dispatcher && typeof dispatcher.on === 'function') {
        dispatcher.on('minigame_completed', handler);
        dispatcher.on('minigame_failed', handler);
    }
}

/** The folder picture for a share stub (it has no object sprite of its own). */
const SHARE_ICON = '/break_escape/assets/objects/m09_folder1.png';

const TRANSFER_LABELS = {
    open: 'Open',
    copy: 'Copy to inventory',
    move: 'Move to inventory',
    cancel: 'Cancel'
};

export class ContainerMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, params);
        this.containerItem = params.containerItem;
        // Don't set contents here - let init() load from server if available
        // Only use passed contents as fallback for locked containers or local games
        this.contents = [];
        this.isTakeable = params.isTakeable || false;
        
        // NPC mode support
        this.mode = params.mode || 'container'; // 'container', 'pc', or 'npc'
        this.npcId = params.npcId || null;
        this.npcDisplayName = params.npcDisplayName || null;
        this.npcAvatar = params.npcAvatar || null;
        
        // Auto-detect desktop mode for PC/tablet containers (not used in NPC mode)
        this.desktopMode = (this.mode !== 'npc') && (params.desktopMode || this.shouldUseDesktopMode());

        // A sign-in PC's desktop (access model 5.3): its contents come from the session, and
        // a folder opened from it (a locked archive) keeps the PC as the source of its files.
        const data = this.containerItem?.scenarioData || {};
        this.loginPcId = this.mode !== 'npc' && data.lockType === 'login' && data.id ? data.id : null;
        this.sourcePcId = this.mode === 'npc' ? null
            : (params.sourcePcId || this.containerItem?.sourcePcId || this.loginPcId || null);
        if (this.loginPcId) this.desktopMode = true;
        this._unregisterDesktop = null;
        this.transferDialog = null;

        // The network screens (slice 9.3a, 4.3 and 4.5). A remote desktop: its lockable
        // carries remote: { footholdId }. A share opened from the view: networkShare, and
        // what is taken from it (or from a folder in it) carries sourceResourceId. A mapped
        // share on a desktop keeps the desktop's lockable (parentLockable) and reopens it.
        this.remote = this.loginPcId && data.remote && data.remote.footholdId ? data.remote : null;
        this.parentLockable = this.mode === 'npc' ? null : (this.containerItem?.parentLockable || null);
        this.sourceResourceId = this.mode === 'npc' || this.sourcePcId ? null
            : (params.sourceResourceId || this.containerItem?.sourceResourceId
                || (data.networkShare && data.networkShare.footholdId ? data.id : null) || null);
        // Why this screen closed, reported to networkLinks.landed from cleanup (4.3)
        this.exitReason = 'close';
    }

    /** The session this sign-in desktop shows (pc-sessions.js), or null. */
    loginSession() {
        return this.loginPcId ? (window.pcSessions?.get?.(this.loginPcId) || null) : null;
    }

    /** True when the player already holds this item (by id). */
    isHeld(item) {
        if (!item?.id) return false;
        return (window.inventory?.items || []).some(i => i?.scenarioData?.id === item.id);
    }
        /**
     * Test bridge state (see MinigameScene.getTestState).
     *
     * Containers NEST. Clicking an item does one of two things:
     *   - `kind: "take"` — the item goes straight into the inventory and the
     *     container stays open.
     *   - `kind: "view"` — the item is taken AND a viewer opens on top (notes,
     *     text-file, …). Closing that viewer RE-OPENS this container, via
     *     window.pendingContainerReturn.
     *
     * So an agent that closes a viewer must expect to land back here, not in
     * the overworld. `returnsToContainer` on the viewer's own state says so.
     *
     * Items are read from the live DOM because the markup differs by mode:
     * `.container-content-item` for bins and safes, `.desktop-icon` for PCs.
     * Use minigame.take(nameOrIndex) rather than matching those classes yourself.
     */
    getTestState() {
        const root = this.container;
        const nodes = root
            ? Array.from(root.querySelectorAll('.container-content-item, .desktop-icon'))
                  .filter(el => el.offsetParent !== null)
            : [];

        const items = nodes.map((el, i) => {
            const isDesktop = el.classList.contains('desktop-icon');
            const name = (el.title || el.alt ||
                          el.querySelector('.desktop-icon-label')?.textContent || '').trim();
            // scenarioData for this entry, matched by name — tells us whether
            // clicking opens a viewer or just pockets the item.
            const data = (this.contents || []).find(c => displayDashes(c?.name || '') === name) || {};
            const opensViewer = !!(data.readable || data.noteContent || data.text ||
                                   ['notes', 'note', 'text-file', 'document'].includes(data.type));
            return {
                index: i,
                name,
                type: data.type ?? null,
                kind: opensViewer ? 'view' : 'take',
                selector: isDesktop ? '.desktop-icon' : '.container-content-item'
            };
        });

        return {
            ...super.getTestState(),
            mode: this.mode,
            npcId: this.npcId || null,
            containerName: this.containerItem?.scenarioData?.name || null,
            // A sign-in desktop: the account shown, and the Copy / Move dialog when open
            signedInAs: this.loginSession() ? { username: this.loginSession().username, displayName: this.loginSession().displayName } : null,
            sourcePcId: this.sourcePcId || null,
            transferDialog: this.transferDialog ? { item: this.transferDialog.item?.name || null, choices: this.transferDialog.choices.map(c => TRANSFER_LABELS[c]) } : null,
            items,
            // Still listed for reference; `items` is what you act on.
            contents: (this.contents || []).map(item => ({
                id: item?.id ?? null,
                name: item?.name ?? null,
                type: item?.type ?? null
            })),
            takeHint: 'take("<item name>") — handles both container and desktop markup.'
        };
    }

    /** The header's observations, with observationVariants resolved (m08 E5). */
    headerObservations() {
        return resolveObjectField(this.containerItem?.scenarioData, 'observations', '') || '';
    }

    getContainerImageUrl() {
        return containerImageUrl(this.containerItem, inventoryImageKey);
    }

    /** The header picture; nothing when the container has none to show. */
    containerImageHtml() {
        return containerImageHtml(this.getContainerImageUrl(), this.containerItem?.scenarioData?.name);
    }

    shouldUseDesktopMode() {
        // Check if the container is a PC, tablet, or computer-related device
        const containerName = this.containerItem?.scenarioData?.name?.toLowerCase() || '';
        const containerType = this.containerItem?.scenarioData?.type?.toLowerCase() || '';
        const containerImage = this.containerItem?.name?.toLowerCase() || '';

        // Keywords that indicate desktop/computer devices
        const desktopKeywords = [
            'computer', 'pc', 'laptop', 'desktop', 'terminal', 'workstation',
            'tablet', 'ipad', 'surface', 'monitor', 'screen', 'display',
            'server', 'mainframe', 'console', 'kiosk', 'smartboard'
        ];

        // Check if any keyword matches
        const allText = `${containerName} ${containerType} ${containerImage}`.toLowerCase();
        return desktopKeywords.some(keyword => allText.includes(keyword));
    }

    async loadContainerContents() {
        // Try multiple sources for gameId
        const gameId = window.gameId || window.breakEscapeConfig?.gameId;
        const containerId = this.containerItem.scenarioData.id ||
                           this.containerItem.scenarioData.name ||
                           this.containerItem.objectId;

        if (!gameId) {
            console.error('No gameId available for container loading. Checked window.gameId and window.breakEscapeConfig?.gameId');
            return [];
        }

        console.log(`Loading contents for container: ${containerId} (gameId: ${gameId})`);

        try {
            const response = await fetch(`/break_escape/games/${gameId}/container/${containerId}`, {
                headers: { 'Accept': 'application/json' }
            });
            this._loadStatus = response.status;

            if (!response.ok) {
                // A folder or share from a desktop whose PC is now off (review R3 nit 2): say so,
                // rather than open it empty with a generic error
                if (offWhenHolds(this.powerPcData())) {
                    this.closeForPowerOff({ evenIfNotCurrent: true });
                    return [];
                }
                if (response.status === 403) {
                    if (window.gameAlert) {
                        window.gameAlert('Container is locked', 'error', 'Locked', 2000);
                    }
                    this.complete(false);
                    return [];
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`Loaded ${data.contents?.length || 0} items from container ${containerId}:`, data.contents);
            return data.contents || [];
        } catch (error) {
            console.error('Failed to load container contents:', error);
            if (window.gameAlert) {
                window.gameAlert('Could not load container contents', 'error', 'Error', 3000);
            }
            return [];
        }
    }

    /**
     * Fetch a sign-in desktop for the current session. A 403 means the server holds no
     * session here (a reset, or one ended elsewhere): pc-sessions.js drops its copy with
     * no request, the desktop closes and the sign-in screen opens. Resolves null then.
     */
    async loadLoginDesktop() {
        const gameId = window.gameId || window.breakEscapeConfig?.gameId;
        const pcId = this.loginPcId;
        // A remote desktop names its foothold on every fetch (slice 9.3a, 4.4)
        const query = this.remote ? `?foothold=${encodeURIComponent(this.remote.footholdId)}` : '';
        try {
            const response = await fetch(`/break_escape/games/${gameId}/container/${encodeURIComponent(pcId)}${query}`, {
                headers: { 'Accept': 'application/json' }
            });
            let refusal = null;
            if (response.status === 403) {
                try { refusal = await response.json(); } catch (e) { /* no body */ }
            }
            if (response.status === 403 && this.remote) {
                // Back to the network view, never the physical sign-in screen (4.3): with
                // no_session the client drops its copy; with unreachable or not_responding (the
                // host's own service is off, 9.3b plan 5.2) it keeps it
                const reason = ['unreachable', 'not_responding'].includes(refusal?.reason) ? refusal.reason : 'no_session';
                if (reason === 'no_session') window.pcSessions?.dropLocal?.(pcId);
                this.exitReason = reason;
                this.complete(false);
                return null;
            }
            if (response.status === 403 && refusal?.reason === 'off') {
                // At the keyboard of a switched-off PC (q72): the session is kept for when it
                // comes back on, and no sign-in screen opens
                this.complete(false);
                window.gameAlert?.(refusal.error || PC_OFF_TEXT, 'info', this.containerItem?.scenarioData?.name || 'PC', 3000);
                return null;
            }
            if (response.status === 403 && this.params?.fromReturn) {
                // Reopened after a reader: the session ended meanwhile. Back to the world
                // with the reason, never the sign-in screen (lab UX review M2)
                window.pcSessions?.dropLocal?.(pcId);
                const ended = window.pcSessions?.takeEndedMessage?.(pcId);
                this.complete(false);
                window.gameAlert?.(ended?.message || 'Signed out', 'info', this.containerItem?.scenarioData?.name || 'PC', 3000);
                return null;
            }
            if (response.status === 403) {
                window.pcSessions?.dropLocal?.(pcId);
                this.complete(false);
                const lockable = this.containerItem;
                setTimeout(() => window.openLoginSignIn?.(lockable), 50);
                return null;
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const data = await response.json();
            // The answer carries the session: a keyboard fetch settles a remote one (4.4)
            if (data.session) window.pcSessions?.settle?.(pcId, data.session);
            if (window.pcSessions?.registerDesktop) {
                this._unregisterDesktop = window.pcSessions.registerDesktop(pcId, (message, reason) => this.closeForSessionEnd(message, reason));
            }
            window.pcSessions?.desktopOpened?.(pcId);
            return data.contents || [];
        } catch (error) {
            console.error('Failed to load the sign-in desktop:', error);
            window.gameAlert?.('Could not load the desktop', 'error', 'Error', 3000);
            this.complete(false);
            return null;
        }
    }

    /** The session ended while this desktop was open: close it with a one-line message. */
    closeForSessionEnd(message, reason = null) {
        this._unregisterDesktop = null;
        if (reason) this.exitReason = reason;
        const name = this.containerItem?.scenarioData?.name || 'PC';
        if (window.MinigameFramework?.currentMinigame === this) this.complete(false);
        if (message) window.gameAlert?.(message, 'info', name, 3000);
    }

    /** The sign-in PC this screen shows or came from, as the scenario defines it, or null. */
    powerPcData() {
        const pcId = this.loginPcId || this.sourcePcId;
        if (!pcId) return null;
        if (this.loginPcId) return this.containerItem?.scenarioData || null;
        const parent = this.parentLockable?.scenarioData;
        if (parent?.id === pcId) return parent;
        const rooms = window.gameScenario?.rooms || {};
        for (const room of Object.values(rooms)) {
            const found = (Array.isArray(room?.objects) ? room.objects : []).find(o => o?.id === pcId);
            if (found) return found;
        }
        return null;
    }

    /**
     * A desktop (or a folder or share opened from one) left open when its PC is switched
     * off closes (review R3 nit 2): at the keyboard with "This PC is off.", remotely back to
     * the network view as "not responding". The session itself is kept, as the server keeps it.
     */
    watchPcPower() {
        if (this.mode === 'npc' || this._unwatchPower) return;
        const pc = this.powerPcData();
        const names = offWhenGlobals(pc);
        const d = window.eventDispatcher;
        if (!names.length || typeof d?.on !== 'function') return;
        const handler = () => { if (offWhenHolds(pc)) this.closeForPowerOff(); };
        names.forEach(n => d.on(`global_variable_changed:${n}`, handler));
        this._unwatchPower = () => names.forEach(n => d.off?.(`global_variable_changed:${n}`, handler));
    }

    closeForPowerOff({ evenIfNotCurrent = false } = {}) {
        if (this._unwatchPower) { this._unwatchPower(); this._unwatchPower = null; }
        if (!evenIfNotCurrent && window.MinigameFramework?.currentMinigame !== this) return;
        const pcId = this.loginPcId || this.sourcePcId;
        const remote = !!this.remote || window.pcSessions?.get?.(pcId)?.remote === true;
        if (remote) {
            this.exitReason = 'not_responding';
            this.complete(false);
            return;
        }
        // 'off': a share or folder does not reopen the desktop it came from (reportNetworkExit)
        this.exitReason = 'off';
        this.complete(false);
        window.gameAlert?.(PC_OFF_TEXT, 'info', this.powerPcData()?.name || 'PC', 3000);
    }

    cleanup() {
        if (this._unwatchPower) {
            this._unwatchPower();
            this._unwatchPower = null;
        }
        if (this._unregisterDesktop) {
            this._unregisterDesktop();
            this._unregisterDesktop = null;
        }
        if (typeof super.cleanup === 'function') super.cleanup();
        this.reportNetworkExit();
    }

    /** The PC this screen works through (the desktop's own, or the session a folder came from). */
    networkDetail() {
        const pcId = this.loginPcId || this.sourcePcId || null;
        const host = this.containerItem?.scenarioData?.host || window.pcSessions?.get?.(pcId)?.host || null;
        return { pcId, host };
    }

    /**
     * A network screen says why it closed (4.3, "Getting back"): exitReason is close unless
     * the closing path set another (handover, switch, item, share, no_session, unreachable,
     * or a session end: sign_out, link_dropped, displaced). A container opened from another
     * (a mapped share, or a folder opened below a network screen: parentLockable) reopens
     * that container when closed by its Close; a folder from a remote desktop with no parent
     * recorded reopens that desktop; every other network screen hands the pair to
     * networkLinks.landed.
     * Other containers report nothing.
     */
    reportNetworkExit() {
        if (this._networkReported || this.mode === 'npc') return;
        this._networkReported = true;
        const reason = this.exitReason || 'close';
        const links = window.networkLinks;
        const minigameOpen = () => !!window.MinigameFramework?.currentMinigame
            && window.MinigameFramework.currentMinigame !== this;
        if (this.parentLockable) {
            const parent = this.parentLockable;
            if (reason === 'close') {
                setTimeout(() => {
                    if (!minigameOpen() && typeof window.startContainerMinigame === 'function') {
                        window.startContainerMinigame(parent, null, false, true);
                    }
                }, 0);
            } else {
                const kind = networkScreenKind(parent);
                if (kind) links?.landed?.(kind, reason, kind === 'desktop' ? this.networkDetail() : {});
            }
            return;
        }
        if (this.remote) {
            links?.landed?.('desktop', reason, this.networkDetail());
            return;
        }
        if (this.sourceResourceId) {
            links?.landed?.('share', reason, {});
            return;
        }
        const session = this.sourcePcId ? window.pcSessions?.get?.(this.sourcePcId) : null;
        if (session?.remote === true) {
            // A folder opened from a remote desktop: closed, the desktop again
            if (reason === 'close' && typeof window.openRemoteDesktop === 'function') {
                const pcId = this.sourcePcId;
                setTimeout(() => { if (!minigameOpen()) window.openRemoteDesktop(pcId, session.footholdId); }, 0);
                return;
            }
            links?.landed?.('desktop', reason, this.networkDetail());
        }
    }

    /**
     * A share's contents loaded (4.5): network_share_opened { resourceId, via, pcId }, via
     * `foothold` for a share opened from the view and `session` for a mapped share.
     */
    shareOpened() {
        const data = this.containerItem?.scenarioData || {};
        if (data.type !== 'network_share' || !data.id || this._loadStatus !== 200) return;
        const fromView = !!this.sourceResourceId;
        const payload = { resourceId: data.id, via: fromView ? 'foothold' : 'session', pcId: fromView ? null : (this.sourcePcId || null) };
        if (fromView) payload.footholdId = data.networkShare?.footholdId ?? null;
        try {
            window.eventDispatcher?.emit?.('network_share_opened', payload);
            window.eventDispatcher?.emit?.(`network_share_opened:${data.id}`, payload);
        } catch (e) { console.warn('network_share_opened listeners threw', e); }
    }

    async init() {
        // Call parent init first
        super.init();

        // A container opening now means no reader is about to hand back to a network screen
        // recorded earlier (a locked folder that opened after its PIN leaves one behind), so
        // a later text file read from the world must not reopen it (slice 9.3a, 4.3)
        const pending = window.pendingContainerReturn;
        if (pending?.containerItem && isNetworkScreenContainer(pending.containerItem)) window.pendingContainerReturn = null;
        disarmNetworkReturn();

        // A folder opened from a sign-in desktop shows the session's files too, so it closes
        // with the same message when that session ends (owner back, auto lock, sign out).
        if (!this.loginPcId && this.sourcePcId && this.mode !== 'npc' && window.pcSessions?.registerDesktop) {
            this._unregisterDesktop = window.pcSessions.registerDesktop(this.sourcePcId, (message, reason) => this.closeForSessionEnd(message, reason));
        }

        // Switched off while open: close rather than serve an empty share (review R3 nit 2)
        this.watchPcPower();

        // Play drawer/container opening sound (not for PC/desktop containers)
        if (this.mode !== 'pc' && !this.desktopMode) {
            try {
                if (window.game && window.game.sound) {
                    const sound = window.game.sound.get('drawer_open') || window.game.sound.add('drawer_open');
                    sound.play({ volume: 0.8 });
                }
            } catch (e) {
                // Sound not available
            }
        }

        // Update header with container name
        if (this.headerElement) {
            this.headerElement.innerHTML = `
                <h3>${escapeHtml(displayDashes(this.containerItem.scenarioData.name))}</h3>
                <p>${escapeHtml(displayDashes(this.headerObservations()))}</p>
            `;
        }

        // Add notebook button to minigame controls if postit note exists (before cancel button)
        if (this.controlsElement && this.containerItem.scenarioData.postitNote && this.containerItem.scenarioData.showPostit) {
            const notebookBtn = document.createElement('button');
            notebookBtn.className = 'minigame-button';
            notebookBtn.id = 'minigame-notebook-postit';
            notebookBtn.innerHTML = '<img src="/break_escape/assets/icons/notes.png" alt="Notepad" class="icon-small notepad-btn-icon"> Add to Notepad';
            // Insert before the cancel button (first child in controls)
            this.controlsElement.insertBefore(notebookBtn, this.controlsElement.firstChild);
        }

        // Show loading state
        this.gameContainer.innerHTML = '<div class="loading" style="text-align: center; padding: 20px;">Loading contents...</div>';

        // Always load contents from server if gameId exists and container is unlocked
        // This ensures we get the latest contents (with items already in inventory filtered out)
        // Even if contents were passed in params, reload from server to get accurate state
        const gameId = window.gameId || window.breakEscapeConfig?.gameId;
        if (gameId && this.loginPcId) {
            // A sign-in PC stays locked in room data: its session, not the lock, opens it.
            const loaded = await this.loadLoginDesktop();
            if (loaded === null) return;
            this.contents = loaded;
        } else if (gameId && this.containerItem.scenarioData.locked === false) {
            console.log('Reloading container contents from server to get latest state');
            this.contents = await this.loadContainerContents();
            this.shareOpened();
        } else if (this.params.contents && this.params.contents.length > 0) {
            // Only use passed contents if server loading isn't available (locked container or local game)
            console.log('Using passed contents (container locked or no server)');
            this.contents = this.params.contents;
        }

        // Create the container minigame UI
        this.createContainerUI();
    }
    
    createContainerUI() {
        if (this.mode === 'npc') {
            this.createNPCUI();
        } else if (this.desktopMode) {
            this.createDesktopUI();
        } else {
            this.createStandardUI();
        }
        
        // Populate contents
        this.populateContents();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    createNPCUI() {
        // NPC mode - show NPC avatar and offer items
        let avatarHtml = '';
        if (this.npcAvatar) {
            avatarHtml = `<img src="${escapeHtml(this.npcAvatar)}" alt="${escapeHtml(this.npcDisplayName)}" class="npc-avatar" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">`;
        }
        
        this.gameContainer.innerHTML = `
            <div class="container-minigame npc-mode">
                ${avatarHtml}
                <h3 style="text-align: center; margin-bottom: 20px;">${escapeHtml(displayDashes(this.npcDisplayName || 'NPC'))} offers you items</h3>
                <div class="container-contents-section">
                    <h4 style="text-align: center;">Available Items</h4>
                    <div class="container-contents-grid" id="container-contents-grid">
                        <!-- Contents will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }
    
    createStandardUI() {
        this.gameContainer.innerHTML = `
            <div class="container-minigame">
                <div class="container-image-section">
                    ${this.containerImageHtml()}
                    <div class="container-info">
                        <h4>${escapeHtml(displayDashes(this.containerItem.scenarioData.name))}</h4>
                        <p>${escapeHtml(displayDashes(this.headerObservations()))}</p>
                    </div>
                </div>

                <div class="container-contents-section">
                    <h4>Contents</h4>
                    <div class="container-contents-grid" id="container-contents-grid">
                        <!-- Contents will be populated here -->
                    </div>
                </div>
                
                <div class="container-actions">
                    ${this.isTakeable ? '<button class="minigame-button" id="take-container-btn">Take Container</button>' : ''}
                </div>
            </div>
        `;
    }
    
    /** The signed-in account with Switch user and Sign out, for a sign-in desktop's header. */
    accountBarHtml() {
        const session = this.loginSession();
        if (!session) return '';
        const name = session.displayName || session.username;
        const linkName = this.remote ? (window.networkLinks?.get?.(this.remote.footholdId)?.name || 'your link') : null;
        const remoteLine = this.remote
            ? `
                    <div class="desktop-remote-line">Remote session through ${escapeHtml(displayDashes(linkName))}</div>` : '';
        const claim = claimLineText(session);
        const claimLine = claim ? `
                    <div class="desktop-claim-line">${escapeHtml(claim)}</div>` : '';
        const who = session.via === 'claim'
            ? `Using <strong>${escapeHtml(name)}</strong>'s session (${escapeHtml(session.username)})`
            : `Signed in as <strong>${escapeHtml(name)}</strong> (${escapeHtml(session.username)})`;
        return `${remoteLine}${claimLine}
                    <div class="desktop-account-bar">
                        <span class="desktop-account-name">${who}</span>
                        <span class="desktop-account-actions">
                            <button type="button" class="minigame-button desktop-account-btn" id="desktop-switch-user">Switch user</button>
                            <button type="button" class="minigame-button desktop-account-btn" id="desktop-sign-out">Sign out</button>
                        </span>
                    </div>`;
    }

    createDesktopUI() {
        this.gameContainer.innerHTML = `
            <div class="container-image-section">
                ${this.containerImageHtml()}
                <div class="container-info">
                    <h4>${escapeHtml(displayDashes(this.containerItem.scenarioData.name))}</h4>${this.accountBarHtml()}
                    <p>${escapeHtml(displayDashes(this.headerObservations()))}</p>
                </div>
            </div>
            <div class="container-minigame desktop-mode">
                <div class="container-monitor-bezel">
                    <div class="desktop-background">
                        <div class="desktop-wallpaper"></div>
                        <div class="desktop-icons" id="desktop-icons">
                            <!-- Desktop icons will be populated here -->
                        </div>
                    </div>
                    
                </div>

                <div class="desktop-taskbar">
                    <div class="desktop-actions">
                        ${this.isTakeable ? '<button class="minigame-button" id="take-container-btn">Take Container</button>' : ''}
                    </div>
                </div>
            </div>
        `;

        if (this.containerItem.scenarioData.postitNote && this.containerItem.scenarioData.showPostit) {
            const postit = document.createElement('div');
            postit.className = 'postit-note';
            postit.innerHTML = escapeHtmlKeepWords(displayDashes(this.containerItem.scenarioData.postitNote));
            makeDraggable(postit);
            this.gameContainer.appendChild(postit);
        }
    }
    
    populateContents() {
        if (this.desktopMode) {
            this.populateDesktopIcons();
        } else {
            this.populateStandardContents();
        }
    }
    
    populateStandardContents() {
        const contentsGrid = document.getElementById('container-contents-grid');
        if (!contentsGrid) return;
        
        if (this.contents.length === 0) {
            contentsGrid.innerHTML = '<p class="empty-contents">This container is empty.</p>';
            return;
        }
        
        this.contents.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = 'container-content-slot';
            
            const itemImg = document.createElement('img');
            itemImg.className = 'container-content-item';
            // An item may override its icon with an explicit path (e.g. a .zip archive on a
            // desktop that has no object sprite of its own).
            itemImg.src = item.iconImage || `/break_escape/assets/objects/${item.type}.png`;
            itemImg.alt = item.name;
            itemImg.title = displayDashes(item.name);
            
            // Add item data
            itemImg.scenarioData = item;
            itemImg.name = item.type;
            itemImg.objectId = `container_${index}`;
            
            // Add click handler for all items (both takeable and interactive)
            itemImg.style.cursor = 'pointer';
            
            if (item.type === 'network_share') {
                // A mapped share (4.5): its own folder, never the generic flow
                if (!item.iconImage) itemImg.src = SHARE_ICON;
                itemImg.addEventListener('click', () => this.openMappedShare(item));
            } else if (this.offersTransfer(item)) {
                // A takeable file from a sign-in desktop offers Open / Copy / Move first
                itemImg.addEventListener('click', () => this.showTransferDialog(item, itemImg));
            } else if (this.isInteractiveItem(item)) {
                // Check if this is an interactive item that should trigger a minigame
                itemImg.addEventListener('click', () => this.handleInteractiveItem(item, itemImg));
            } else if (item.takeable) {
                // Regular takeable items
                itemImg.addEventListener('click', () => this.takeItem(item, itemImg));
            }
            
            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'container-content-tooltip';
            tooltip.textContent = displayDashes(item.name);
            
            slot.appendChild(itemImg);
            slot.appendChild(tooltip);
            contentsGrid.appendChild(slot);
        });
    }
    
    populateDesktopIcons() {
        const desktopIcons = document.getElementById('desktop-icons');
        if (!desktopIcons) return;
        
        if (this.contents.length === 0) {
            desktopIcons.innerHTML = '<div class="empty-desktop">Desktop is empty</div>';
            return;
        }
        
        this.contents.forEach((item, index) => {
            const icon = document.createElement('div');
            icon.className = 'desktop-icon';
            
            const iconImg = document.createElement('img');
            iconImg.className = 'desktop-icon-image';
            iconImg.src = item.iconImage || `/break_escape/assets/objects/${item.type}.png`;
            iconImg.alt = item.name;
            
            const iconLabel = document.createElement('div');
            iconLabel.className = 'desktop-icon-label';
            iconLabel.textContent = displayDashes(item.name);
            
            // Add item data
            iconImg.scenarioData = item;
            iconImg.name = item.type;
            iconImg.objectId = `desktop_${index}`;
            
            // Add click handler for all items (both takeable and interactive)
            icon.style.cursor = 'pointer';
            
            // A mapped share (4.5) opens as a folder fetched from the server, never through
            // handleObjectInteraction or POST /unlock
            if (item.type === 'network_share') {
                if (!item.iconImage) iconImg.src = SHARE_ICON;
                icon.dataset.resourceId = item.id || '';
                icon.addEventListener('click', () => this.openMappedShare(item));
            } else if (this.offersTransfer(item)) {
                // A takeable file from a sign-in desktop offers Open / Copy / Move first
                icon.addEventListener('click', () => this.showTransferDialog(item, iconImg));
            } else if (this.isInteractiveItem(item)) {
                // Check if this is an interactive item that should trigger a minigame
                icon.addEventListener('click', () => this.handleInteractiveItem(item, iconImg));
            } else if (item.takeable) {
                // Regular takeable items
                icon.addEventListener('click', () => this.takeItem(item, iconImg));
            }
            
            icon.appendChild(iconImg);
            icon.appendChild(iconLabel);
            desktopIcons.appendChild(icon);
        });
    }
    
    setupEventListeners() {
        // Take container button
        const takeContainerBtn = document.getElementById('take-container-btn');
        if (takeContainerBtn) {
            this.addEventListener(takeContainerBtn, 'click', () => this.takeContainer());
        }
        
        // Close button
        const closeBtn = document.getElementById('close-container-btn');
        if (closeBtn) {
            this.addEventListener(closeBtn, 'click', () => this.complete(false));
        }

        // Add to Notepad button
        const addToNotebookBtn = document.getElementById('minigame-notebook-postit');
        if (addToNotebookBtn) {
            this.addEventListener(addToNotebookBtn, 'click', () => this.addPostitToNotebook());
        }

        // A sign-in desktop's Switch user and Sign out (through pc-sessions.js)
        const switchBtn = this.gameContainer?.querySelector('#desktop-switch-user');
        if (switchBtn) {
            // The sign-in screen replaces this desktop; the session stays until another
            // account signs in, and leaving the screen comes back here.
            this.addEventListener(switchBtn, 'click', () => {
                this.exitReason = 'switch';
                // A remote desktop's Switch user is the remote screen: no tiles, no sticky note.
                // It starts at once and replaces this desktop; if it did not, this desktop is
                // still open and its own Close must land as a close (review R1 minor 1)
                window.openLoginSignIn?.(this.containerItem, this.remote ? { switching: true, remote: this.remote } : { switching: true });
                if (this.remote && window.MinigameFramework?.currentMinigame === this && !this._ending) this.exitReason = 'close';
            });
        }
        const signOutBtn = this.gameContainer?.querySelector('#desktop-sign-out');
        if (signOutBtn) {
            this.addEventListener(signOutBtn, 'click', () => window.pcSessions?.signOut?.(this.loginPcId));
        }
    }

    /** A takeable item (not a locked folder) seen through a sign-in desktop's session. */
    offersTransfer(item) {
        return !!(this.sourcePcId || this.sourceResourceId) && this.mode !== 'npc' && item?.takeable === true && item.locked !== true;
    }

    /**
     * Open a mapped share's stub (4.5): a folder whose contents come from
     * GET /container/<resourceId>. It keeps this desktop's lockable and reopens it on Close.
     */
    openMappedShare(item) {
        if (!item?.id) return;
        const share = {
            scenarioData: { ...item, locked: false },
            name: 'network_share',
            objectId: `share_${item.id}`,
            sourcePcId: this.sourcePcId || undefined,
            parentLockable: this.containerItem
        };
        this.exitReason = 'share';
        this.complete(false);
        if (typeof window.startContainerMinigame === 'function') window.startContainerMinigame(share, null, false, true);
    }

    /**
     * What a stand-in for an item opened from here (a reader, a locked folder) carries: its
     * source, and below a network screen this container as its parent, so a folder that opens
     * from it reopens it on Close (4.3; the plan's round 3 review, R3-M1).
     */
    childExtras() {
        const extras = this.sourceExtras();
        if (this.mode !== 'npc' && isNetworkScreenContainer(this.containerItem)) extras.parentLockable = this.containerItem;
        return extras;
    }

    /** What a stand-in for an item taken or read from here carries: the PC or the share it came from. */
    sourceExtras() {
        if (this.mode === 'npc') return {};
        if (this.sourcePcId) return { sourcePcId: this.sourcePcId };
        if (this.sourceResourceId) return { sourceResourceId: this.sourceResourceId };
        return {};
    }

    /**
     * The desktop-themed dialog for a takeable file on a sign-in desktop: Open, Copy to
     * inventory, Move to inventory, Cancel (only Open once held; `transfer` restricts the
     * takes). Shown in the PC's window chrome over the desktop.
     */
    showTransferDialog(item, element) {
        this.closeTransferDialog();
        const held = this.isHeld(item);
        const choices = transferChoices(item, held);
        const host = this.gameContainer.querySelector('.desktop-background') || this.gameContainer;
        const dialog = document.createElement('div');
        dialog.className = 'desktop-transfer-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.innerHTML = `
            <div class="desktop-window-titlebar">
                <span class="desktop-window-title">${escapeHtml(displayDashes(item.name || 'File'))}</span>
            </div>
            <div class="desktop-window-body">
                <p>${held ? 'You already have this file.' : 'What do you want to do with this file?'}</p>
                <div class="desktop-window-buttons">
                    ${choices.map(c => `<button type="button" class="minigame-button desktop-transfer-btn" data-choice="${c}">${TRANSFER_LABELS[c]}</button>`).join('')}
                </div>
            </div>`;
        host.appendChild(dialog);
        this.transferDialog = { item, element, choices, el: dialog };
        dialog.querySelectorAll('[data-choice]').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                e.stopPropagation();
                this.chooseTransfer(btn.dataset.choice);
            });
        });
    }

    closeTransferDialog() {
        if (this.transferDialog?.el?.parentElement) this.transferDialog.el.parentElement.removeChild(this.transferDialog.el);
        this.transferDialog = null;
    }

    chooseTransfer(choice) {
        const dialog = this.transferDialog;
        if (!dialog || !dialog.choices.includes(choice)) return;
        const { item, element } = dialog;
        this.closeTransferDialog();
        if (choice === 'cancel') return;
        if (choice === 'open') { this.openFileInPlace(item); return; }
        this.takeItem(item, element, choice);
    }

    /** Open a file without taking it: the viewer (or notes) for something with text. */
    openFileInPlace(item) {
        const text = resolveObjectField(item, 'text', null);
        if (!text) {
            const obs = resolveObjectField(item, 'observations', '') || 'Nothing to open.';
            this.showMessage(displayDashes(obs), 'info');
            return;
        }
        // The container comes back when the reader closes: a network screen (4.3) and, as
        // for a file opened with a click, any other (lab UX review M4). Only for the types
        // whose reader spends it (the text file viewer, a readable note): any other type with
        // text opens no reader, and the armed return would reopen this desktop after a later
        // note read in the world (review R2 n3)
        const opensReader = item.type === 'text_file' || (/^notes\d*$/.test(item.type) && !!item.readable);
        if (opensReader) {
            window.pendingContainerReturn = { containerItem: this.containerItem, contents: this.contents, isTakeable: this.isTakeable, npcOptions: null };
        }
        this.exitReason = 'item';
        this.complete(false);
        const viewItem = { ...item, takeable: false };
        if (window.handleObjectInteraction) {
            window.handleObjectInteraction({ scenarioData: viewItem, name: item.type, objectId: `temp_${Date.now()}` });
        }
    }
    
    isInteractiveItem(item) {
        // Check if this item should trigger a minigame instead of being taken

        // Notes with readable text (all notes variants: notes, notes2, notes3, ...)
        if (/^notes\d*$/.test(item.type) && item.readable && item.text) {
            return true;
        }

        // Text files — always interactive (never taken, even without text)
        if (item.type === 'text_file') {
            return true;
        }

        // A locked nested container (e.g. a password-protected archive on a desktop) delegates to
        // the main object handler, which runs its unlock/password flow and then opens it.
        if (item.locked === true) {
            return true;
        }
        
        // Phone with messages
        if (item.type === 'phone' && (item.text || item.voice)) {
            return true;
        }
        
        // Workstation (crypto workstation)
        if (item.type === 'workstation') {
            return true;
        }
        
        // Add more interactive item types as needed

        // Custom minigame types (VM-01, VM-02 and future minigame objects in containers)
        if (item.type === 'scada_historian' ||
            item.type === 'log_filter_terminal' ||
            item.type === 'drug_library_terminal' ||
            item.minigameId) {
            return true;
        }

        return false;
    }
    
    handleInteractiveItem(item, itemElement) {
        console.log('Handling interactive item from container:', item);

        // Apply onRead.setVariable (or legacy onPickup.setVariable) when item is read/used.
        // onRead is preferred for non-takeable readable items; onPickup is kept as fallback.
        const readAction = item.onRead || item.onPickup;
        if (readAction?.setVariable && window.gameState?.globalVariables) {
            Object.entries(readAction.setVariable).forEach(([varName, value]) => {
                const oldValue = window.gameState.globalVariables[varName];
                window.gameState.globalVariables[varName] = value;
                console.log(`📖 onRead.setVariable: ${varName} = ${value}`);
                if (window.npcConversationStateManager) {
                    window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
                }
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
                        name: varName, value, oldValue
                    });
                    console.log(`📡 Emitted event: global_variable_changed:${varName}`);
                }
            });

            // Emit item_picked_up so collect_items tasks can track reads of non-takeable files
            if (window.eventDispatcher) {
                window.eventDispatcher.emit(`item_picked_up:${item.type}`, {
                    itemType: item.type,
                    itemName: item.name,
                    itemId: item.id || item.name,
                    collectionGroup: item.collection_group || null,
                    roomId: window.currentPlayerRoom
                });
            }
        }

        // For readable notes items (all variants), open notes minigame — goes to notepad, not inventory
        if (/^notes\d*$/.test(item.type) && item.readable && item.text) {
            console.log('Notes item is takeable - will trigger minigame then take item');
            
            // Store container state for return after minigame
            const containerState = {
                containerItem: this.containerItem,
                contents: this.contents,
                isTakeable: this.isTakeable,
                itemToTake: item,  // Store the item to take after minigame
                itemElement: itemElement,
                // Where the note came from (a PC or a share), so the server's add finds it
                sourceExtras: this.sourceExtras(),
                // Preserve NPC context if in NPC mode
                npcOptions: this.mode === 'npc' ? {
                    mode: this.mode,
                    npcId: this.npcId,
                    npcDisplayName: this.npcDisplayName,
                    npcAvatar: this.npcAvatar
                } : null
            };
            
            // Store the container state globally so we can return to it
            this.exitReason = 'item';
            window.pendingContainerReturn = containerState;
            
            // Close the container minigame first
            this.complete(false);
            
            // Create a temporary sprite-like object for the main game handler
            const tempSprite = {
                scenarioData: item,
                name: item.type,
                objectId: `temp_${Date.now()}`,
                ...this.childExtras()
            };
            
            // Delegate to main game's handler for viewing/reading items (notes, phone, files, etc.)
            if (window.handleObjectInteraction) {
                window.handleObjectInteraction(tempSprite);
            } else {
                console.error('handleObjectInteraction not available');
                window.gameAlert('Could not handle item interaction', 'error', 'Error', 3000);
            }
            return;
        }
        
        // For other takeable items, use takeItem to properly remove from container
        if (item.takeable) {
            console.log('Item is takeable, using takeItem method');
            this.takeItem(item, itemElement);
            return;
        }
        
        // Store container state for return after minigame
        const containerState = {
            containerItem: this.containerItem,
            contents: this.contents,
            isTakeable: this.isTakeable,
            // Preserve NPC context if in NPC mode
            npcOptions: this.mode === 'npc' ? {
                mode: this.mode,
                npcId: this.npcId,
                npcDisplayName: this.npcDisplayName,
                npcAvatar: this.npcAvatar
            } : null
        };
        
        // Store the container state globally so we can return to it
        this.exitReason = 'item';
        window.pendingContainerReturn = containerState;
        
        // Close the container minigame first
        this.complete(false);

        // From a network screen, a hand-over to anything but the text-file reader (which
        // reopens the screen itself) comes back here when it ends without opening a
        // container: a cancelled PIN pad, a key alert, a lockout, a phone (4.3)
        const armReturn = this.mode !== 'npc' && item.type !== 'text_file'
            && isNetworkScreenContainer(this.containerItem);
        if (armReturn) armNetworkReturn(containerState);
        
        // Create a temporary sprite-like object for the main game handler
        const tempSprite = {
            scenarioData: item,
            name: item.type,
            objectId: `temp_${Date.now()}`,
            ...this.childExtras()
        };
        
        // Delegate to main game's handler for viewing/reading items (notes, phone, files, etc.)
        if (window.handleObjectInteraction) {
            window.handleObjectInteraction(tempSprite);
        } else {
            console.error('handleObjectInteraction not available');
            window.gameAlert('Could not handle item interaction', 'error', 'Error', 3000);
        }
        // Nothing opened (a key-locked folder without the key shows an alert): back at once
        if (armReturn) scheduleNetworkReturnCheck(0);
    }
    
    addPostitToNotebook() {
        console.log('Adding postit note to notebook:', this.containerItem.scenarioData.postitNote);

        const postitNote = this.containerItem.scenarioData.postitNote;
        if (!postitNote || postitNote.trim() === '') {
            this.showMessage('No postit note to add.', 'error');
            return;
        }

        // Create comprehensive notebook content
        const notebookTitle = `Postit Note - ${this.containerItem.scenarioData.name}`;
        let notebookContent = `Postit Note:\n${'-'.repeat(50)}\n\n${postitNote}`;
        
        // Add container contents list
        notebookContent += `\n\n${'='.repeat(20)}\n`;
        notebookContent += `CONTAINER CONTENTS: ${this.containerItem.scenarioData.name}\n`;
        notebookContent += `${'='.repeat(20)}\n`;
        
        if (this.contents && this.contents.length > 0) {
            this.contents.forEach((item, index) => {
                notebookContent += `${index + 1}. ${item.name || item.type}`;
                if (item.description) {
                    notebookContent += ` - ${item.description}`;
                }
                notebookContent += '\n';
            });
        } else {
            notebookContent += 'No items found\n';
        }
        
        notebookContent += `${'='.repeat(20)}\n`;
        notebookContent += `Date: ${new Date().toLocaleString()}`;
        
        const notebookObservations = `Postit note found in ${this.containerItem.scenarioData.name}.`;

        // Check if notes minigame is available
        if (window.startNotesMinigame) {
            // Store the container state globally so we can return to it
            const containerState = {
                containerItem: this.containerItem,
                contents: this.contents,
                isTakeable: this.isTakeable,
                // Preserve NPC context if in NPC mode
                npcOptions: this.mode === 'npc' ? {
                    mode: this.mode,
                    npcId: this.npcId,
                    npcDisplayName: this.npcDisplayName,
                    npcAvatar: this.npcAvatar
                } : null
            };

            window.pendingContainerReturn = containerState;

            // Create a postit item for the notes minigame
            const postitItem = {
                scenarioData: {
                    type: 'postit_note',
                    name: notebookTitle,
                    text: notebookContent,
                    observations: notebookObservations,
                    important: true
                }
            };

            // Start notes minigame
            window.startNotesMinigame(
                postitItem,
                notebookContent,
                notebookObservations,
                null,
                false,
                false
            );

            this.showMessage("Added postit note to notepad", 'success');
        } else {
            console.error('Notes minigame not available');
            this.showMessage('Notepad not available', 'error');
        }
    }
    
    // async because addToInventory is: `if (addToInventory(...))` tests a
    // Promise, which is always truthy, so this used to take the success branch
    // even when the server refused the item and removed the row anyway.
    // transfer: 'copy' or 'move' for a file from a sign-in desktop (access model 5.1).
    async takeItem(item, itemElement, transfer = null) {
        console.log('Taking item from container:', item);
        // From a sign-in desktop, a mapped share (sourcePcId) or a share opened from the
        // network view (sourceResourceId, slice 9.3a 4.5)
        const fromSignIn = !!(this.sourcePcId || this.sourceResourceId) && this.mode !== 'npc';
        const isCopy = fromSignIn && transfer === 'copy';
        
        // Create a temporary sprite-like object for the inventory system
        const tempSprite = takeStandIn(item, inventoryImageKey,
            fromSignIn ? { ...this.sourceExtras(), transfer: transfer || 'move' } : {});
        
        // Add to inventory
        const addResult = await addToInventory(tempSprite);
        if (addResult && addResult.ok && isCopy) {
            // A copy stays on the PC (and in its profile on every PC)
            if (window.playUISound) window.playUISound('item');
            this.showMessage(`Copied ${displayDashes(item.name)} to inventory`, 'success');
        } else if (addResult && addResult.ok) {
            if (window.playUISound) window.playUISound('item');
            // Remove from container display
            itemElement.parentElement.remove();
            
            // Remove from contents array
            const itemIndex = this.contents.findIndex(content => content === item);
            if (itemIndex !== -1) {
                this.contents.splice(itemIndex, 1);
                
                // If in NPC mode, also remove from NPC's itemsHeld
                if (this.mode === 'npc' && this.npcId && window.npcManager) {
                    const npc = window.npcManager.getNPC(this.npcId);
                    if (npc && npc.itemsHeld) {
                        const npcItemIndex = npc.itemsHeld.findIndex(i => i === item);
                        if (npcItemIndex !== -1) {
                            npc.itemsHeld.splice(npcItemIndex, 1);
                            
                            // Emit event to update Ink variables
                            if (window.eventDispatcher) {
                                window.eventDispatcher.emit('npc_items_changed', { 
                                    npcId: this.npcId 
                                });
                            }
                        }
                    }
                }
            }
            
            // Show success message
            this.showMessage(fromSignIn ? `Moved ${displayDashes(item.name)} to inventory` : `Added ${displayDashes(item.name)} to inventory`, 'success');
            
            // If container is now empty, update display
            if (this.contents.length === 0) {
                const contentsGrid = document.getElementById('container-contents-grid');
                if (contentsGrid) {
                    contentsGrid.innerHTML = '<p class="empty-contents">This container is empty.</p>';
                }
            }
        } else {
            if (window.playUISound) window.playUISound('reject');
            this.showMessage(`Failed to add ${displayDashes(item.name)} to inventory`, 'error');
        }
    }

    // async for the same reason as takeItem above.
    async takeContainer() {
        console.log('Taking container:', this.containerItem);
        
        // Ensure container item has setVisible method if it doesn't already
        if (!this.containerItem.setVisible) {
            this.containerItem.setVisible = function(visible) {
                console.log(`Mock setVisible(${visible}) called on container item`);
            };
        }
        
        // Add container to inventory
        const addResult = await addToInventory(this.containerItem);
        if (addResult && addResult.ok) {
            this.showMessage(`Added ${displayDashes(this.containerItem.scenarioData.name)} to inventory`, 'success');
            
            // Close the minigame after a short delay
            setTimeout(() => {
                this.complete(true);
            }, 1500);
        } else {
            this.showMessage(`Failed to add ${displayDashes(this.containerItem.scenarioData.name)} to inventory`, 'error');
        }
    }
    
    showMessage(message, type) {
        const messageElement = document.createElement('div');
        messageElement.className = `container-message container-message-${type}`;
        messageElement.textContent = message;
        
        this.messageContainer.appendChild(messageElement);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.parentElement.removeChild(messageElement);
            }
        }, 3000);
    }
    
    /**
     * Complete the minigame
     * Override to handle returning to conversation for NPC inventory mode
     */
    complete(success) {
        // If in NPC mode, return to the conversation instead of just closing
        if (this.mode === 'npc') {
            // Check if we're in the middle of transitioning to another minigame (e.g., notes)
            // If pendingContainerReturn exists, it means we should return to container, not conversation
            if (window.pendingContainerReturn) {
                console.log('Container minigame (NPC mode) closing - but pendingContainerReturn exists, so just closing');
                // Just close normally - we'll return to container after the next minigame
                super.complete(success);
            } else {
                console.log('Container minigame (NPC mode) closing - returning to conversation');
                
                // Call the parent complete to close the minigame
                super.complete(success);
                
                // Then return to the conversation via the minigame framework
                if (window.returnToConversationAfterNPCInventory) {
                    // Delay slightly to ensure minigame is fully closed
                    setTimeout(() => {
                        window.returnToConversationAfterNPCInventory();
                    }, 100);
                }
            }
        } else {
            // For regular containers, just close normally
            super.complete(success);
        }
    }
}

// Function to start the container minigame
export function startContainerMinigame(containerItem, contents, isTakeable = false, desktopMode = null, npcOptions = null, extra = null) {
    // Auto-detect desktop mode if not explicitly set
    if (desktopMode === null) {
        desktopMode = shouldUseDesktopModeForContainer(containerItem);
    }
    
    console.log('Starting container minigame', { containerItem, contents, isTakeable, desktopMode, npcOptions });
    
    // Initialize the minigame framework if not already done
    if (!window.MinigameFramework) {
        console.error('MinigameFramework not available');
        return;
    }
    
    if (!window.MinigameFramework.mainGameScene) {
        window.MinigameFramework.init(window.game);
    }
    
    // Start the container minigame
    window.MinigameFramework.startMinigame('container', null, {
        title: containerItem.scenarioData.name,
        containerItem: containerItem,
        contents: contents,
        isTakeable: isTakeable,
        desktopMode: desktopMode,
        cancelText: 'Close',
        showCancel: true,
        // A reopen after a reader closed: a sign-in desktop never falls through to the
        // sign-in screen (loadLoginDesktop)
        fromReturn: !!extra?.fromReturn,
        ...(npcOptions && {
            mode: npcOptions.mode || 'container',
            npcId: npcOptions.npcId,
            npcDisplayName: npcOptions.npcDisplayName,
            npcAvatar: npcOptions.npcAvatar
        }),
        onComplete: (success, result) => {
            console.log('Container minigame completed', { success, result });
        }
    });
}

// Helper function to determine if a container should use desktop mode
function shouldUseDesktopModeForContainer(containerItem) {
    // Check if the container is a PC, tablet, or computer-related device
    const containerName = containerItem?.scenarioData?.name?.toLowerCase() || '';
    const containerType = containerItem?.scenarioData?.type?.toLowerCase() || '';
    const containerImage = containerItem?.name?.toLowerCase() || '';
    
    // Keywords that indicate desktop/computer devices
    const desktopKeywords = [
        'computer', 'pc', 'laptop', 'desktop', 'terminal', 'workstation',
        'tablet', 'ipad', 'surface', 'monitor', 'screen', 'display',
        'server', 'mainframe', 'console', 'kiosk', 'smartboard'
    ];
    
    // Check if any keyword matches
    const allText = `${containerName} ${containerType} ${containerImage}`.toLowerCase();
    return desktopKeywords.some(keyword => allText.includes(keyword));
}

// Function to return to container after notes minigame
export function returnToContainerAfterNotes({ reopen = true } = {}) {
    console.log('Returning to container after notes minigame');
    
    // Check if there's a pending container return
    if (window.pendingContainerReturn) {
        const containerState = window.pendingContainerReturn;
        
        // Clear the pending return state
        window.pendingContainerReturn = null;
        
        // Check if we should remove a notes item after the notes minigame
        if (containerState.itemToTake) {
            console.log('Removing notes item after notes minigame:', containerState.itemToTake);
            
            // Notes-family items: register with server so the container filters them on next load.
            // inventory.js skips the UI slot for notes types — they live in the notepad.
            // (takeable was set to false by interactions.js before opening the minigame.)
            if (window.addToInventory) {
                const tempSprite = {
                    scenarioData: containerState.itemToTake,
                    name: containerState.itemToTake.type,
                    objectId: `temp_${Date.now()}`,
                    ...(containerState.sourceExtras || {}),
                    setVisible: function() {}
                };
                window.addToInventory(tempSprite);
            }
            
            // Remove from container display
            if (containerState.itemElement && containerState.itemElement.parentElement) {
                containerState.itemElement.parentElement.remove();
            }
            
            // Remove from contents array
            const itemIndex = containerState.contents.findIndex(content => content === containerState.itemToTake);
            if (itemIndex !== -1) {
                containerState.contents.splice(itemIndex, 1);
            }
            
            // The container reopens just below, so this toast waits for it with the
            // others. Shown now it was pulled back by the container opening and shown
            // again when it closed: "has been noted" twice (F13, engine F24).
            window.expectPanelWithin?.(1000);
            // The container reopens just below, so this toast waits for it with the
            // others. Shown now it was pulled back by the container opening and shown
            // again when it closed: "has been noted" twice (F13, engine F24).
            window.expectPanelWithin?.(1000);
            window.gameAlert(`${containerState.itemToTake.name} has been noted`, 'success', 'Added to Notes', 2000);
        }
        
        // A hit, the knockout screen, a conversation or a room change closed the reader
        // (containerReturnBlocked): the note above is still taken, the container stays shut
        if (!reopen) return;

        // A PC's sign-in desktop whose session ended while the file was open (the owner came
        // back, the screen locked, someone signed in there): the desktop was not open to
        // close, so its message is shown now and the player stays in the world. Never the
        // PC's sign-in screen from here: that skips the check for an owner at the desk
        // (lab UX review M2).
        const lockable = containerState.containerItem;
        const pcData = lockable?.scenarioData;
        if (!containerState.npcOptions && pcData?.lockType === 'login' && pcData.id
            && !isNetworkScreenContainer(lockable) && window.pcSessions
            && typeof window.pcSessions.has === 'function' && !window.pcSessions.has(pcData.id)) {
            const ended = window.pcSessions.takeEndedMessage?.(pcData.id);
            window.gameAlert?.(ended?.message || 'Signed out', 'info', pcData.name || 'PC', 3000);
            return;
        }

        // Start the container minigame - don't pass contents, let it reload from server
        // This ensures items already in inventory are filtered out
        startContainerMinigame(
            containerState.containerItem,
            null, // Don't pass contents - let it reload from server
            containerState.isTakeable,
            // A network screen keeps its desktop layout (a share from the view has no PC
            // sprite to auto-detect it from); others auto-detect or use npcOptions
            isNetworkScreenContainer(containerState.containerItem) ? true : null,
            containerState.npcOptions, // Restore NPC context if it was saved
            { fromReturn: true }
        );
    } else {
        console.log('No pending container return found');
    }
}

/**
 * Return to the conversation after closing the NPC inventory container
 * This handles the flow: Conversation → NPC Inventory → Back to Conversation
 */
export function returnToConversationAfterNPCInventory() {
    console.log('Returning to conversation after NPC inventory');
    
    // Check if there's a pending conversation return
    if (window.pendingConversationReturn) {
        const conversationState = window.pendingConversationReturn;
        
        // Clear the pending return state
        window.pendingConversationReturn = null;
        
        console.log('Restoring conversation:', conversationState);
        
        // Restart the appropriate conversation minigame
        if (window.MinigameFramework) {
            // Small delay to ensure container is fully closed
            setTimeout(() => {
                if (conversationState.type === 'person-chat') {
                    // Restart person-chat minigame
                    window.MinigameFramework.startMinigame('person-chat', null, {
                        npcId: conversationState.npcId,
                        fromTag: true  // Flag to indicate we're resuming from a tag action
                    });
                } else if (conversationState.type === 'phone-chat') {
                    // Restart phone-chat minigame
                    window.MinigameFramework.startMinigame('phone-chat', null, {
                        npcId: conversationState.npcId,
                        fromTag: true  // Flag to indicate we're resuming from a tag action
                    });
                }
            }, 50);
        }
    } else {
        console.log('No pending conversation return found');
    }
}

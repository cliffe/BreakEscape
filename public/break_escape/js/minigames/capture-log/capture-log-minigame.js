// The capture log (engine plan section 6): an inventory holder for credentials, sessions and
// findings. Its screen lists three sections, each hidden when empty:
//
//   Captures  se_captures entries, oldest first: role, address, host, the secret or the mask, the
//             note. Read in place.
//   Sessions  filed network link items (with 9.3a's networkLinks), the remote sessions under them
//             (with 9.3a's pcSessions), and filed items whose click opens a view (contents).
//   Findings  filed readable items; a click runs the item's ordinary click.
//
// Filing is a view of the inventory, not a move: one tray rule hides the slot of an item whose
// storeIn names a held holder, and draws the holder's badge (the count of new rows). The module
// registers the capture_log type with the minigame starter registry, so a tray click reaches it
// through interactions.js's registry branch.
//
// Returning to the device: it never closes itself to make way. A Findings or view row runs the
// item's click while the device is open, and the next screen displaces it (no event). Then one
// return listener (at most one at a time) waits for that screen's minigame_completed or
// minigame_failed and reopens the device. An event from the device's own class spends the
// listener (the player has left the device), and starting the device drops any armed listener.

import { MinigameScene } from '../framework/base-minigame.js';
import { MinigameFramework } from '../framework/minigame-manager.js';
import { registerMinigameStarter } from '../../systems/minigame-registry.js';
import { registerTrayRule, refreshInventoryTray } from '../../systems/inventory.js';
import { writeGlobal } from '../../systems/global-writer.js';
import {
    SEEN_GLOBAL, HOLDER_TYPE, buildSections, filedIn, isHolder, newKeys, readSeen, rowKeys
} from './capture-log-model.js';
import { buildCaptureRow, captureBannerText, capturesReveal, applyCaptureSecrets, loadCaptureSecrets } from './capture-rows.js';

export const SCENE_TYPE = 'capture-log';

const win = () => (typeof window !== 'undefined' ? window : {});
const globals = () => win().gameState?.globalVariables || {};
const items = () => (Array.isArray(win().inventory?.items) ? win().inventory.items : []);
const social = () => win().gameScenario?.social || {};

/**
 * The remote sessions source (section 6, Sessions source 2), present only when both 9.3a's
 * window.pcSessions.list and window.networkLinks.openSession exist (feature detection: before
 * 9.3a's client steps the section has no session rows and nothing fails).
 */
export function sessionsSource() {
    const w = win();
    if (typeof w.pcSessions?.list !== 'function' || typeof w.networkLinks?.openSession !== 'function') return null;
    try {
        const list = w.pcSessions.list();
        return Array.isArray(list) ? list : null;
    } catch (err) {
        console.warn('[capture-log] pcSessions.list failed:', err);
        return null;
    }
}

function sectionsFor(holder) {
    return buildSections({ holder, items: items(), globals: globals(), sessionsSource: sessionsSource() });
}

function findHolder(holderId) {
    return items().find((it) => it?.scenarioData?.id === holderId && isHolder(it)) || null;
}

// ---- the tray rule ----------------------------------------------------------------------

/** The rule registered with registerTrayRule: file items in their holder, badge the holder. */
export function captureLogTrayRule(item, list) {
    ensureListening();
    const holderId = filedIn(item, list);
    if (holderId) return { hidden: true, holderId };
    if (isHolder(item)) {
        const sections = buildSections({ holder: item, items: list, globals: globals(), sessionsSource: sessionsSource() });
        return { badge: newKeys(sections, readSeen(globals())).length };
    }
    return null;
}

// ---- events -------------------------------------------------------------------------------

let listeningOn = null;
let openScene = null;

function onCapturesChanged() {
    refreshInventoryTray();
    if (openScene) { openScene.redraw(); openScene.loadSecrets(); }
}
function onSessionsChanged() {
    refreshInventoryTray();
    openScene?.redraw();
}
function onInventoryChanged() {
    openScene?.redraw();
}

/** Listen on the current dispatcher (idempotent; a dispatcher replaced later gets its own). */
export function ensureListening() {
    const d = win().eventDispatcher;
    if (!d || typeof d.on !== 'function' || listeningOn === d) return false;
    listeningOn = d;
    d.on('global_variable_changed:se_captures', onCapturesChanged);
    for (const name of ['pc_signed_in', 'pc_signed_out', 'network_device_unplugged']) d.on(name, onSessionsChanged);
    d.on('inventory_changed', onInventoryChanged);
    return true;
}

// ---- returning to the device --------------------------------------------------------------

let armed = null; // { handler, dispatcher }

export function disarmReturn() {
    if (!armed) return;
    const { handler, dispatcher } = armed;
    armed = null;
    dispatcher?.off?.('minigame_completed', handler);
    dispatcher?.off?.('minigame_failed', handler);
}

export function returnArmed() {
    return !!armed;
}

/**
 * Arm the one return listener, after an item's click has returned. It waits for the next
 * minigame_completed or minigame_failed: one from the device itself spends it; any other waits
 * one tick and, if no minigame is open and no file is on its way back to a desktop
 * (window.pendingContainerReturn), reopens the device and is spent; otherwise it stays armed.
 */
export function armReturn(holderId) {
    disarmReturn();
    const dispatcher = win().eventDispatcher;
    if (!dispatcher || typeof dispatcher.on !== 'function') return;
    const handler = (data) => {
        if (!armed || armed.handler !== handler) return;
        if (data?.minigameName === CaptureLogMinigame.name) { disarmReturn(); return; }
        setTimeout(() => {
            if (!armed || armed.handler !== handler) return;
            if (MinigameFramework.currentMinigame || win().pendingContainerReturn) return; // stays armed
            disarmReturn();
            reopenCaptureLog(holderId);
        }, 0);
    };
    armed = { handler, dispatcher };
    dispatcher.on('minigame_completed', handler);
    dispatcher.on('minigame_failed', handler);
}

/** Reopen the device (a trip's returnTo, the return listener). Nothing happens if it left the inventory. */
export function reopenCaptureLog(holderId) {
    const holder = findHolder(holderId);
    if (!holder) return false;
    startCaptureLog(holder);
    return true;
}

// ---- the screen ---------------------------------------------------------------------------

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
}

export class CaptureLogMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, { title: 'Capture log', cancelText: 'Close', headerElement: true, ...params });
        this.holderId = params?.holderId || null;
        this.secrets = null;
        this.secretRows = [];
        this.lastKeys = [];
    }

    init() {
        super.init();
        this.container.classList?.add('capture-log-minigame');
        this.root = el('div', 'capture-log');
        this.gameContainer.appendChild(this.root);
        this.redraw();
    }

    start() {
        super.start();
        openScene = this;
        this.loadSecrets();
    }

    cleanup() {
        if (openScene === this) openScene = null;
        super.cleanup();
    }

    holder() {
        return findHolder(this.holderId);
    }

    async loadSecrets() {
        if (!capturesReveal(social())) return;
        const secrets = await loadCaptureSecrets();
        if (!secrets || openScene !== this) return;
        this.secrets = secrets;
        applyCaptureSecrets(this.secretRows, secrets);
    }

    redraw() {
        if (!this.root) return;
        const holder = this.holder();
        const sections = holder ? sectionsFor(holder) : { captures: [], sessions: [], findings: [] };
        const seen = readSeen(globals());
        const fresh = new Set(newKeys(sections, seen));
        this.root.textContent = '';
        this.secretRows = [];

        const reveal = capturesReveal(social());
        const appendSection = (id, title, rows, build) => {
            if (!rows.length) return;
            const section = el('section', `capture-log-section capture-log-${id}`);
            section.dataset.section = id;
            section.appendChild(el('h4', 'capture-log-heading', title));
            if (id === 'captures') section.appendChild(el('p', 'lpb-captures-banner capture-log-banner', captureBannerText(reveal)));
            const list = el('ul', 'capture-log-list');
            for (const row of rows) {
                const node = build(row);
                node.dataset.key = row.key;
                if (fresh.has(row.key)) {
                    node.classList.add('capture-log-new');
                    node.appendChild(el('span', 'capture-log-new-mark', 'New'));
                }
                list.appendChild(node);
            }
            section.appendChild(list);
            this.root.appendChild(section);
        };

        appendSection('captures', 'Captures', sections.captures, ({ entry }) => {
            const { row, secretNode } = buildCaptureRow(entry, social(), this.secrets);
            if (secretNode) this.secretRows.push({ targetId: entry.targetId, node: secretNode });
            return row;
        });
        appendSection('sessions', 'Sessions', sections.sessions, (row) => this.sessionRow(row));
        appendSection('findings', 'Findings', sections.findings, (row) => this.itemRow(row, null, () => this.openItem(row.item)));

        if (!this.root.children.length) {
            this.root.appendChild(el('p', 'capture-log-empty', 'Nothing recorded yet.'));
        }

        // A row is new until the device has been opened with it listed.
        const keys = rowKeys(sections);
        this.lastKeys = keys;
        const grown = keys.filter((k) => !seen.includes(k));
        if (grown.length) {
            writeGlobal(SEEN_GLOBAL, [...seen, ...grown], { openChat: false });
            refreshInventoryTray();
        }
    }

    itemRow(row, line, onClick) {
        const li = el('li', 'capture-log-row');
        const button = el('button', 'capture-log-open');
        button.type = 'button';
        const src = row.item?.src || row.picture;
        if (typeof src === 'string' && src) {
            const img = el('img', 'capture-log-picture');
            img.src = src;
            img.alt = '';
            button.appendChild(img);
        }
        const text = el('span', 'capture-log-text');
        text.appendChild(el('span', 'capture-log-name', row.name));
        if (line) text.appendChild(el('span', 'capture-log-line', line));
        button.appendChild(text);
        this.addEventListener(button, 'click', (e) => {
            e.preventDefault?.(); e.stopPropagation?.();
            onClick();
        });
        li.appendChild(button);
        return li;
    }

    sessionRow(row) {
        const returnTo = () => reopenCaptureLog(this.holderId);
        if (row.kind === 'link') {
            return this.itemRow(row, row.line, () => {
                const links = win().networkLinks;
                if (typeof links?.open === 'function' && row.footholdId) links.open(row.footholdId, { returnTo });
                else this.openItem(row.item);
            });
        }
        if (row.kind === 'session') {
            const li = this.itemRow(row, [row.host, row.line].filter(Boolean).join(' · '), () => {
                win().networkLinks?.openSession?.(row.pcId, { returnTo });
            });
            li.classList.add('capture-log-session');
            return li;
        }
        return this.itemRow(row, row.line, () => this.openItem(row.item));
    }

    /** The item's ordinary click, while the device is still open, then the return listener. */
    openItem(item) {
        const handle = win().handleObjectInteraction;
        if (typeof handle !== 'function' || !item) return;
        handle(item);
        armReturn(this.holderId);
    }

    getTestState() {
        const holder = this.holder();
        const sections = holder ? sectionsFor(holder) : { captures: [], sessions: [], findings: [] };
        const summary = (rows) => rows.map((r) => ({ key: r.key, kind: r.kind || 'capture', name: r.name || r.entry?.roleLabel || null }));
        return {
            ...super.getTestState(),
            captureLog: {
                holderId: this.holderId,
                captures: summary(sections.captures),
                sessions: summary(sections.sessions),
                findings: summary(sections.findings),
                secrets: [...this.root.querySelectorAll('.lpb-captures-secret')].map((n) => n.textContent),
                newMarks: [...this.root.querySelectorAll('.capture-log-new')].map((n) => n.dataset.key)
            }
        };
    }
}

/** Open the device for a held holder (the registry's start, the reopen path). */
export function startCaptureLog(obj) {
    disarmReturn();
    const data = obj?.scenarioData || {};
    if (!MinigameFramework.mainGameScene && win().game) MinigameFramework.init(win().game);
    MinigameFramework.startMinigame(SCENE_TYPE, null, {
        title: data.name || 'Capture log',
        holderId: data.id || null
    });
}

MinigameFramework.registerScene(SCENE_TYPE, CaptureLogMinigame);
registerMinigameStarter(HOLDER_TYPE, { start: startCaptureLog, unavailable: 'Capture log unavailable.' });
// After the module graph has evaluated, so inventory.js is ready whatever the import order.
// Registering runs a refresh, which files what is already held.
queueMicrotask(() => registerTrayRule(captureLogTrayRule));
if (typeof window !== 'undefined') window.captureLog = { open: reopenCaptureLog, armed: returnArmed };

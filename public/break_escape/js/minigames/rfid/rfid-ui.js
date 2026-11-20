/**
 * RFID UI Renderer
 *
 * Renders RFID Flipper-style RFID interface:
 * - Main menu (Read / Saved)
 * - Tap interface (unlock mode)
 * - Saved cards list
 * - Emulation screen
 * - Card reading screen (clone mode)
 * - Card data display
 * - Protocol-specific displays for all supported protocols
 *
 * @module rfid-ui
 */

import { getProtocolInfo, detectProtocol, getReadProfile } from './rfid-protocols.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { escapeHtml } from '../../utils/escape-html.js';

// Result messages can name a card from the scenario: escaped once on the way into HTML.

/** Shown under "No keycards in inventory" on the Read screen. */
export const NO_KEYCARDS_HINT = 'The cloner reads a badge at close range: one you hold, or one someone is carrying.';

/** How long the emulation screen (card name, protocol, data) stays up before the result. */
export const EMULATION_HOLD_MS = 1500;

/** The cue under the copier's screen while its content runs on past the bottom edge. */
export const MORE_BELOW_TEXT = 'More below';

/** The offset that moves a box onto whole device pixels. A box centred in a space of odd
 *  size sits half a pixel off, and every edge of the copier's stepped frame (outline,
 *  bevel, each 2px step) then blends across two rows (UX slice 3a R1 m1). */
export function wholePixelOffset(rect, dpr = 1) {
    const snap = (v) => Math.round(v * dpr) / dpr - v;
    const x = snap(rect.left), y = snap(rect.top);
    // Round off float noise, so a box already on whole pixels gets exactly 0
    const tidy = (v) => (Math.abs(v) < 1e-6 ? 0 : Math.round(v * 1e4) / 1e4);
    return { x: tidy(x), y: tidy(y) };
}

/** What the device is called on screen and in the menus: the scenario's own name for the
 *  rfid_cloner item ("Card copier"), so the inventory, the menus and the device agree. */
export const DEFAULT_CLONER_NAME = 'Card copier';
export function clonerName(items = (typeof window !== 'undefined' && window.inventory && window.inventory.items) || []) {
    const cloner = (items || []).find(it => it && it.scenarioData && it.scenarioData.type === 'rfid_cloner');
    const name = cloner && cloner.scenarioData.name;
    return (typeof name === 'string' && name.trim()) ? name.trim() : DEFAULT_CLONER_NAME;
}
/** The name inside a sentence: "card copier", but "RFID cloner" keeps its capitals. */
export function clonerNameInSentence(items) {
    const name = clonerName(items);
    return /^[A-Z][a-z]/.test(name) ? name[0].toLowerCase() + name.slice(1) : name;
}
// The one rule for the device's name: systems/action-menu.js (no static imports) reads it here
if (typeof window !== 'undefined') window.clonerNameInSentence = clonerNameInSentence;

// Pixel-art icons (UI rule: no emoji in game UI). Each is a grid of palette letters, drawn as
// an inline SVG of whole pixels at a whole-number scale with crisp edges. '.' is clear.
const PX = {
    K: '#141414', Y: '#ffcc33', y: '#b87d00', W: '#f2f2f2', w: '#9a9a9a',
    G: '#4cd964', g: '#23803a', O: '#ff8200', o: '#b35a00', D: '#4a4a4a', R: '#ff5a4a'
};
export const PIXEL_ICONS = {
    key: ['.KKKK.........', 'KYYYYK........', 'KYKKYKKKKKKKK.', 'KYKKYYYYYYYYYK',
          'KYYYYKKKYKYKK.', '.KKKK...KYKYK.', '........KKKKK.'],
    card: ['KKKKKKKKKKKK', 'KWWWWWWWWWWK', 'KWYYWWWWWWWK', 'KWyyWWKKKKWK',
           'KWWWWWWWWWWK', 'KWKKKKKKKWWK', 'KWWWWWWWWWWK', 'KKKKKKKKKKKK'],
    signal: ['..O.....O..', '.O..O.O..O.', 'O..O...O..O', 'O..O.W.O..O',
             '.O..O.O..O.', '..O..W..O..', '.....W.....', '.....W.....', '....WWW....'],
    lock: ['..KKKKK..', '.KK...KK.', '.K.....K.', '.K.....K.', 'KKKKKKKKK',
           'KYYYYYYYK', 'KYYYKYYYK', 'KYYYKYYYK', 'KYYYYYYYK', 'KKKKKKKKK'],
    unlock: ['.....KKKKK.', '....KK...KK', '....K.....K', '....K......', 'KKKKKKKKK..',
             'KGGGGGGGK..', 'KGGGKGGGK..', 'KGGGKGGGK..', 'KGGGGGGGK..', 'KKKKKKKKK..'],
    warning: ['....K....', '...KYK...', '...KYK...', '..KYKYK..', '..KYKYK..',
              '.KYYYYYK.', '.KYYKYYK.', 'KKKKKKKKK'],
    battery: ['KKKKKKKKKKK.', 'KGGGGGGGGGKK', 'KGGGGGGGGGKK', 'KGGGGGGGGGKK', 'KKKKKKKKKKK.'],
    reader: ['KKKKKKKK', 'KDDDDDDK', 'KDGGGGDK', 'KDDDDDDK', 'KDDDDDDK',
             'KDDWWDDK', 'KDWDDWDK', 'KDDWWDDK', 'KDDDDDDK', 'KKKKKKKK'],
    back: ['...K.....', '..KWK....', '.KWWKKKKK', 'KWWWWWWWK', '.KWWKKKKK', '..KWK....', '...K.....'],
    tick: ['.......GG', '......GG.', 'G....GG..', 'GG..GG...', '.GGGG....', '..GG.....'],
    cross: ['RR...RR', 'RRR.RRR', '.RRRRR.', '..RRR..', '.RRRRR.', 'RRR.RRR', 'RR...RR']
};

/**
 * An icon as an SVG string: one rect per run of same-coloured pixels. Unknown names give ''.
 * @param {string} name - a PIXEL_ICONS key
 * @param {number} [scale] - screen pixels per art pixel (whole number)
 */
export function pixelIcon(name, scale = 3) {
    const rows = PIXEL_ICONS[name];
    if (!rows) return '';
    const k = Math.max(1, Math.round(scale));
    const w = Math.max(...rows.map(r => r.length)), h = rows.length;
    let rects = '';
    rows.forEach((row, y) => {
        let x = 0;
        while (x < row.length) {
            const c = row[x];
            let run = 1;
            while (x + run < row.length && row[x + run] === c) run++;
            if (PX[c]) rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${PX[c]}"/>`;
            x += run;
        }
    });
    return `<svg class="px-icon px-icon-${name}" width="${w * k}" height="${h * k}" viewBox="0 0 ${w} ${h}" ` +
        `shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}</svg>`;
}

/**
 * A copier control: a real button, so Tab reaches it and Enter or Space presses it
 * (UX slice 3a R5 n1). The role is kept for the test bridge, which finds controls by role.
 */
export function controlButton(className, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.setAttribute?.('role', 'button');
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
}

/** The keys that move between the copier's controls: back (-1) or on (+1). */
export const ARROW_STEPS = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };

/** A Back button: the pixel arrow, then the word (no text arrow glyph). */
function backButton(onClick) {
    const back = controlButton('flipper-button-back', onClick);
    const art = document.createElement('span');
    art.className = 'px-icon-holder';
    art.innerHTML = pixelIcon('back', 2);
    const words = document.createElement('span');
    words.textContent = 'Back';
    back.appendChild(art);
    back.appendChild(words);
    return back;
}

/** One line on when each key attack works, shown where the first crack is a choice. */
function crackChoiceNote() {
    const note = document.createElement('div');
    note.className = 'flipper-info flipper-crack-choice';
    note.textContent = 'Dictionary tries factory-default keys: instant, but only works if the owner never changed them. Darkside works on any Classic card, but takes longer.';
    return note;
}

/** A line with a pixel icon in front of (escaped) text. */
function iconLine(className, icon, text, scale = 2) {
    const el = document.createElement('div');
    el.className = className;
    const art = document.createElement('span');
    art.className = 'px-icon-holder';
    art.innerHTML = pixelIcon(icon, scale);
    const words = document.createElement('span');
    words.textContent = String(text ?? '');  // scenario text: a text node, never markup
    el.appendChild(art);
    el.appendChild(words);
    return el;
}

export class RFIDUIRenderer {
    constructor(minigame) {
        this.minigame = minigame;
        this.container = minigame.gameContainer;
        this.dataManager = minigame.dataManager;
        console.log('RFIDUIRenderer initialized');
    }

    /**
     * Create unlock mode interface
     */
    createUnlockInterface() {
        this.clear();

        // Create RFID Flipper frame
        const flipper = this.createFlipperFrame();

        // Append to container first so screen element is in the DOM
        this.container.appendChild(flipper);
        this.snapFrameToPixels(flipper);

        // At a reader the copier opens on that reader: the saved cards to play back and the
        // cards held to tap, one press each. From the inventory (no reader) it opens on its menu.
        if (this.minigame.isLockingAttempt) this.showDoorScreen();
        else this.showMainMenu('unlock');
    }

    /**
     * The copier held up to a door's (or a cabinet's) reader: every saved card offered for
     * playback and every keycard held offered for a tap. It does not mark which card the
     * reader wants: trying them is the player's job.
     */
    showDoorScreen() {
        const screen = this.freshScreen();
        if (!screen) return;

        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Reader';
        screen.appendChild(breadcrumb);

        const readerName = this.minigame.params?.readerName;
        screen.appendChild(iconLine('flipper-reader-head', 'reader', readerName ? `At the reader: ${displayDashes(readerName)}` : 'At the reader', 3));

        // At an access list the held badges may have been tried already and refused: say so,
        // and leave them out of the tap list, so the player is not invited to try them again
        // (UX slice 3b R1 m3)
        const refusedIds = (this.minigame.params?.refusedKeycards || []).map(String);
        const cardIdOf = (data) => data ? (data.card_id || (typeof window !== 'undefined' && window.lockRef ? window.lockRef(data) : null)) : null;
        if (refusedIds.length > 0) {
            const refused = document.createElement('div');
            refused.className = 'flipper-info-dim flipper-reader-refused';
            refused.textContent = refusedIds.length > 1
                ? 'Your badges were refused. Try a saved card.'
                : 'Your badge was refused. Try a saved card.';
            screen.appendChild(refused);
        }
        // A held card tapped here: "Checking..." while the server answers (R1 m7)
        const status = document.createElement('div');
        status.className = 'flipper-emulating flipper-reader-status';
        status.hidden = true;
        screen.appendChild(status);
        this._doorStatus = status;

        const saved = this.dataManager.getSavedCards();
        const held = (this.minigame.params?.availableCards || [])
            .filter(card => !refusedIds.includes(String(cardIdOf(card && card.scenarioData))));
        // While one card is being checked the list does nothing, so a second choice cannot
        // start under the first one's answer (R1 m7)
        const unlessBusy = (f) => () => { if (!this.minigame._accessPending) f(); };
        const list = document.createElement('div');
        list.className = 'flipper-card-list flipper-door-list';
        const entries = [];

        if (saved.length > 0) {
            const head = document.createElement('div');
            head.className = 'flipper-section-head';
            head.textContent = 'Play back a saved card';
            list.appendChild(head);
            saved.forEach(card => {
                const item = this.listEntry('door', entries.length, unlessBusy(() => this.showEmulationScreen(card)));
                item.innerHTML = `${pixelIcon('signal', 2)}<span>Emulate ${escapeHtml(displayDashes(card.name || 'Card'))}</span>`;
                entries.push(item);
                list.appendChild(item);
            });
        }
        if (held.length > 0) {
            const head = document.createElement('div');
            head.className = 'flipper-section-head';
            head.textContent = 'Tap a card you hold';
            list.appendChild(head);
            held.forEach(card => {
                const name = displayDashes(card.scenarioData?.name || 'Keycard');
                const item = this.listEntry('door', entries.length, unlessBusy(() => this.minigame.handleCardTap(card)));
                item.innerHTML = `${pixelIcon('card', 2)}<span>Tap ${escapeHtml(name)}</span>`;
                entries.push(item);
                list.appendChild(item);
            });
        }
        if (saved.length === 0 && held.length === 0) {
            const none = document.createElement('div');
            none.className = 'flipper-info';
            none.textContent = 'No saved cards and no keycard to tap';
            list.appendChild(none);
            const how = document.createElement('div');
            how.className = 'flipper-info-dim';
            how.textContent = NO_KEYCARDS_HINT;
            list.appendChild(how);
        }
        screen.appendChild(list);
        this._doorEntries = entries;
        // Back from a refusal: the list where the player left it (R5 n3)
        this.showList('door', entries);
    }

    /**
     * A held card tapped at an access-list reader while the server answers: "Checking <card>..."
     * under the reader head, and the door list disabled until the answer replaces the screen
     * (UX slice 3b R1 m7). Emulate needs none of this: its own screen says "Emulating...".
     */
    showAccessChecking(cardName) {
        const status = this._doorStatus;
        if (status) {
            status.textContent = cardName ? `Checking ${displayDashes(cardName)}...` : 'Checking...';
            status.hidden = false;
        }
        (this._doorEntries || []).forEach(entry => {
            entry.disabled = true;
            entry.setAttribute?.('aria-disabled', 'true');
        });
    }

    /**
     * Create clone mode interface
     */
    createCloneInterface() {
        this.clear();

        // Create RFID Flipper frame
        const flipper = this.createFlipperFrame();

        // Append to container first so screen element is in the DOM
        this.container.appendChild(flipper);
        this.snapFrameToPixels(flipper);

        // Auto-start reading if card provided
        if (this.minigame.params.cardToClone) {
            this.showReadingScreen();
        } else {
            this.showMainMenu('clone');
        }
    }

    /**
     * Create RFID Flipper device frame
     * @returns {HTMLElement} Flipper frame element
     */
    createFlipperFrame() {
        const frame = document.createElement('div');
        frame.className = 'flipper-zero-frame';

        // The dark bevel layer, between ::before (light bevel) and ::after (body), so the
        // dark edge follows the stepped corners too (rfid-minigame.css, R2 n1)
        const bevel = document.createElement('div');
        bevel.className = 'flipper-bevel';
        bevel.setAttribute('aria-hidden', 'true');
        frame.appendChild(bevel);

        // Header with logo and battery
        const header = document.createElement('div');
        header.className = 'flipper-header';

        // Logo
        const logo = document.createElement('div');
        logo.className = 'flipper-logo';
        // The scenario's name for the item, so the device, the inventory and the menus agree
        logo.textContent = clonerName().toUpperCase();

        const battery = document.createElement('div');
        battery.className = 'flipper-battery';
        battery.innerHTML = `${pixelIcon('battery', 2)}<span>100%</span>`;

        header.appendChild(logo);
        header.appendChild(battery);

        // The layout of the network view (UX slice 1): a fixed header, a scrolling body and
        // a fixed footer (UX slice 3a R4 m1). The display is the grey screen: the body
        // (#rfid-screen, which every screen fills) scrolls inside it, over a "More below"
        // strip shown while the body runs on. The footer holds the screen's main controls
        // (Save and Abandon, Emulate and Back), so they show at every window size.
        const display = document.createElement('div');
        display.className = 'flipper-display';

        const screen = document.createElement('div');
        screen.className = 'flipper-screen pixel-scroll';
        screen.id = 'rfid-screen';

        const more = document.createElement('div');
        more.className = 'flipper-more';
        more.hidden = true;
        more.setAttribute('aria-hidden', 'true');
        more.innerHTML = `<span class="flipper-more-arrow"></span><span>${MORE_BELOW_TEXT}</span>`;

        display.appendChild(screen);
        display.appendChild(more);

        const footer = document.createElement('div');
        footer.className = 'flipper-footer';
        footer.id = 'rfid-footer';

        frame.appendChild(header);
        frame.appendChild(display);
        frame.appendChild(footer);

        this.moreElement = more;
        this.frameElement = frame;
        screen.addEventListener('scroll', () => this.updateScrollCue());
        // Enter, Space and the arrow keys on the copier's controls (R5 n1). Esc is left to
        // bubble to the minigame's own close handler.
        frame.addEventListener('keydown', (e) => this.onKey(e));

        return frame;
    }

    /** The copier's controls in screen order: the body's entries, then the footer's. */
    controls() {
        const frame = this.frameElement;
        if (!frame || typeof frame.querySelectorAll !== 'function') return [];
        return Array.from(frame.querySelectorAll('button')).filter(b => !b.disabled);
    }

    /**
     * A key on the copier. Enter or Space presses the focused control (handled here and
     * not left to the browser, so a key the game captures cannot swallow it); the arrow
     * keys move between controls. Neither reaches the world behind the copier.
     */
    onKey(e) {
        if (!e) return false;
        const target = e.target;
        const isControl = !!(target && target.tagName === 'BUTTON' && this.frameElement?.contains?.(target));
        if ((e.key === 'Enter' || e.key === ' ') && isControl) {
            e.preventDefault?.();
            e.stopPropagation?.();
            if (!e.repeat) target.click();
            return true;
        }
        const step = ARROW_STEPS[e.key];
        if (step) {
            const list = this.controls();
            if (list.length === 0) return false;
            e.preventDefault?.();
            e.stopPropagation?.();
            const at = list.indexOf(typeof document !== 'undefined' ? document.activeElement : null);
            const next = at < 0 ? list[0] : list[Math.max(0, Math.min(list.length - 1, at + step))];
            next.focus?.();
            return true;
        }
        return false;
    }

    /**
     * Give a screen's main control the keyboard focus, so Enter does the screen's main
     * action (R5 n1). Once more on the next tick, for a copier whose overlay is not yet
     * shown when the first screen is built.
     */
    focusMain(el, options) {
        if (!el || typeof el.focus !== 'function') return;
        const go = () => {
            if (!el.isConnected) return;
            if (typeof document !== 'undefined' && document.activeElement === el) return;
            try { el.focus(options); } catch (e) { /* not focusable yet */ }
        };
        go();
        setTimeout(go, 0);
    }

    /**
     * A list entry (a saved card, a held card): a button that remembers which entry was
     * chosen, so the list comes back at that entry (R5 n3).
     */
    listEntry(key, index, onClick) {
        return controlButton('flipper-menu-item', () => {
            this._listChosen = { ...(this._listChosen || {}), [key]: index };
            onClick();
        });
    }

    /**
     * Show a list screen: back at the scroll position and entry the player left it at when
     * coming back to it (from a card's details, or after a refusal), else at its top with
     * the first entry focused. `fallback` takes the focus when the list is empty.
     */
    showList(key, entries, fallback) {
        const screen = this.getScreen();
        this._listKey = key;
        const top = this._listScroll && this._listScroll[key];
        const chosen = this._listChosen && this._listChosen[key];
        const restoring = typeof top === 'number' && screen && 'scrollTop' in screen;
        const target = entries[restoring && chosen != null ? chosen : 0] || entries[0] || fallback;
        if (restoring) {
            this.focusMain(target, { preventScroll: true });
            screen.scrollTop = top;
            this.updateScrollCue();
        } else {
            this.focusMain(target);
        }
    }

    /** Forget where the lists were left: the copier is back at its menu. */
    forgetLists() {
        this._listScroll = {};
        this._listChosen = {};
    }

    /**
     * Get screen element
     * @returns {HTMLElement} Screen element
     */
    getScreen() {
        return document.getElementById('rfid-screen');
    }

    /** The frame's footer, under the screen (null before the frame is built). */
    getFooter() {
        return document.getElementById('rfid-footer');
    }

    /**
     * The screen, emptied for the next view, with the footer emptied too and the body
     * scrolled back to its top. Null when the copier has no screen.
     */
    freshScreen() {
        const screen = this.getScreen();
        if (!screen) return null;
        // Leaving a list: keep where it was scrolled to, for the way back (R5 n3)
        if (this._listKey && typeof screen.scrollTop === 'number') {
            this._listScroll = { ...(this._listScroll || {}), [this._listKey]: screen.scrollTop };
        }
        this._listKey = null;
        screen.innerHTML = '';
        if ('scrollTop' in screen) screen.scrollTop = 0;
        const footer = this.getFooter();
        if (footer) footer.innerHTML = '';
        this.watchScreen(screen);
        return screen;
    }

    /**
     * Put a screen's main controls in the frame's footer, outside the scrolling body, so
     * they show without scrolling. Without a footer (a frame built elsewhere) they go at
     * the end of the screen, as before.
     */
    addToFooter(...controls) {
        const target = this.getFooter() || this.getScreen();
        if (!target) return;
        for (const c of controls) target.appendChild(c);
        this.updateScrollCue();
    }

    /**
     * Show "More below" while the body runs past the display's bottom edge; hide it at the
     * end. A pixel or two of rounding is not more below.
     */
    updateScrollCue() {
        const screen = this.getScreen();
        const more = this.moreElement;
        if (!screen || !more) return false;
        const below = (screen.scrollHeight - screen.clientHeight - screen.scrollTop) > 2;
        more.hidden = !below;
        return below;
    }

    /**
     * Re-check the cue whenever the body's content changes (a new view, a progress line).
     * One observer per copier, on its own screen, disconnected on cleanup.
     */
    watchScreen(screen) {
        if (typeof window === 'undefined' || typeof window.MutationObserver !== 'function') return;
        if (this._screenObserver && this._watchedScreen === screen) return;
        if (this._screenObserver) this._screenObserver.disconnect();
        this._watchedScreen = screen;
        this._screenObserver = new window.MutationObserver(() => this.updateScrollCue());
        this._screenObserver.observe(screen, { childList: true, subtree: true, characterData: true });
    }

    /**
     * Show main menu
     * @param {string} mode - 'unlock' or 'clone'
     */
    showMainMenu(mode) {
        const screen = this.freshScreen();

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID';
        screen.appendChild(breadcrumb);

        // Menu items
        const menu = document.createElement('div');
        menu.className = 'flipper-menu';

        // Back at the menu: the lists open at their tops again
        this.forgetLists();
        let first = null;

        if (mode === 'unlock') {
            // Read option (tap cards)
            const readOption = controlButton('flipper-menu-item', () => this.showTapInterface());
            readOption.textContent = '> Read';
            menu.appendChild(readOption);
            first = readOption;

            // Saved option (emulate)
            const savedOption = controlButton('flipper-menu-item', () => this.showSavedCards());
            savedOption.textContent = '  Saved';
            menu.appendChild(savedOption);

            // Nothing cloned yet: say so up front rather than after a trip into Saved
            if (this.dataManager.getSavedCards().length === 0) {
                const none = document.createElement('div');
                none.className = 'flipper-info-dim';
                none.textContent = 'No saved cards to emulate yet';
                menu.appendChild(none);
            }
        } else {
            // Clone mode - just show "Reading..." message
            const info = document.createElement('div');
            info.className = 'flipper-info';
            info.textContent = 'Place card...';
            menu.appendChild(info);
        }

        screen.appendChild(menu);
        this.focusMain(first);
    }

    /**
     * Show tap interface for unlock mode
     */
    showTapInterface() {
        // At a reader both lists live on the door screen
        if (this.minigame.isLockingAttempt) return this.showDoorScreen();
        const screen = this.freshScreen();

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Read';
        screen.appendChild(breadcrumb);

        // NFC waves animation
        const waves = document.createElement('div');
        waves.className = 'rfid-nfc-waves-container';
        waves.innerHTML = `<div class="rfid-nfc-icon">${pixelIcon('signal', 4)}</div>`;
        screen.appendChild(waves);

        // Instruction
        const instruction = document.createElement('div');
        instruction.className = 'flipper-info';
        instruction.textContent = 'Place card near reader...';
        screen.appendChild(instruction);

        // List available keycards
        const cardList = document.createElement('div');
        cardList.className = 'flipper-card-list';

        const availableCards = this.minigame.params.availableCards || [];

        if (availableCards.length === 0) {
            const noCards = document.createElement('div');
            noCards.className = 'flipper-info-dim';
            noCards.textContent = 'No keycards in inventory';
            cardList.appendChild(noCards);

            // Where a card comes from (lab playtest E11: the empty list gave no lead).
            // True of every scenario and names no one: a read happens on a keycard the
            // player holds or, in conversation, on a badge someone carries.
            const how = document.createElement('div');
            how.className = 'flipper-info-dim';
            how.textContent = NO_KEYCARDS_HINT;
            cardList.appendChild(how);
        }
        const entries = availableCards.map((card, i) => {
            const cardItem = this.listEntry('tap', i, () => this.minigame.handleCardTap(card));
            cardItem.textContent = `> ${displayDashes(card.scenarioData?.name || 'Keycard')}`;
            cardList.appendChild(cardItem);
            return cardItem;
        });

        screen.appendChild(cardList);

        // Back button, in the footer
        const back = backButton(() => this.showMainMenu('unlock'));
        this.addToFooter(back);
        this.showList('tap', entries, back);
    }

    /**
     * Show saved cards list
     */
    showSavedCards() {
        // At a reader both lists live on the door screen
        if (this.minigame.isLockingAttempt) return this.showDoorScreen();
        const screen = this.freshScreen();

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Saved';
        screen.appendChild(breadcrumb);

        // Get saved cards
        const savedCards = this.dataManager.getSavedCards();

        if (savedCards.length === 0) {
            const noCards = document.createElement('div');
            noCards.className = 'flipper-info';
            noCards.textContent = 'No saved cards';
            screen.appendChild(noCards);

            const how = document.createElement('div');
            how.className = 'flipper-info-dim';
            how.textContent = `Nothing to emulate yet. Read a keycard with the ${clonerNameInSentence()} to save it here.`;
            screen.appendChild(how);
        }
        const entries = [];
        if (savedCards.length > 0) {
            // Card list
            const cardList = document.createElement('div');
            cardList.className = 'flipper-card-list';

            savedCards.forEach((card, i) => {
                const cardItem = this.listEntry('saved', i, () => this.showCardDetails(card));
                cardItem.textContent = `> ${displayDashes(card.name)}`;
                cardList.appendChild(cardItem);
                entries.push(cardItem);
            });

            screen.appendChild(cardList);
        }

        // Back button, in the footer
        const back = backButton(() => this.showMainMenu('unlock'));
        this.addToFooter(back);
        // Back from a card's details or a refusal: the list where the player left it (R5 n3)
        this.showList('saved', entries, back);
    }

    /**
     * Show card details with Emulate button
     * @param {Object} card - Card to display
     */
    showCardDetails(card) {
        const screen = this.freshScreen();

        const displayData = this.dataManager.getCardDisplayData(card);

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Saved > Details';
        screen.appendChild(breadcrumb);

        // Card icon
        const icon = document.createElement('div');
        icon.className = 'rfid-emulate-icon';
        icon.innerHTML = pixelIcon('card', 5);
        screen.appendChild(icon);

        // Protocol, with its security icon
        screen.appendChild(iconLine('flipper-info flipper-protocol-line', displayData.icon, displayData.protocolName));

        // Card name
        const name = document.createElement('div');
        name.className = 'flipper-card-name';
        name.textContent = displayDashes(card.name || 'Card');
        screen.appendChild(name);

        // Card data fields
        const data = document.createElement('div');
        data.className = 'flipper-card-data';

        // Show first 3 fields (most relevant for emulation)
        displayData.fields.slice(0, 3).forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.textContent = `${field.label}: ${field.value}`;
            data.appendChild(fieldDiv);
        });

        screen.appendChild(data);

        // Emulate: a button in the copier's palette, like Save (R5 n2)
        const emulateBtn = controlButton('flipper-button', () => this.showEmulationScreen(card));
        emulateBtn.textContent = '> Emulate';

        // Emulate and Back in the footer, so both show at every window size (R4 m1)
        this.addToFooter(emulateBtn, backButton(() => this.showSavedCards()));
        this.focusMain(emulateBtn);
    }

    /**
     * Show emulation screen (supports all protocols)
     * @param {Object} card - Card to emulate
     */
    showEmulationScreen(card) {
        const screen = this.freshScreen();

        // Get protocol-specific display data
        const displayData = this.dataManager.getCardDisplayData(card);

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        // From a door the copier opened on that reader's screen ("RFID > Reader"), so the
        // trail carries on from it
        breadcrumb.textContent = this.minigame.isLockingAttempt ? 'RFID > Reader > Emulating' : 'RFID > Saved > Emulating';
        screen.appendChild(breadcrumb);

        // Emulating message: first, so the status shows at every window size before the
        // screen moves on (R4 m1)
        const emulating = document.createElement('div');
        emulating.className = 'flipper-emulating';
        if (displayData.protocol === 'MIFARE_DESFire' && !card.rfid_data?.masterKeyKnown) {
            emulating.textContent = 'Emulating UID only...';
        } else {
            emulating.textContent = 'Emulating...';
        }
        screen.appendChild(emulating);

        // Emulation icon
        const icon = document.createElement('div');
        icon.className = 'rfid-emulate-icon';
        icon.innerHTML = pixelIcon('signal', 5);
        screen.appendChild(icon);

        // Protocol, with its security icon
        screen.appendChild(iconLine('flipper-info flipper-protocol-line', displayData.icon, displayData.protocolName));

        // Card name
        const name = document.createElement('div');
        name.className = 'flipper-card-name';
        name.textContent = displayDashes(card.name || 'Card');
        screen.appendChild(name);

        // Card data fields
        const data = document.createElement('div');
        data.className = 'flipper-card-data';

        // Show first 3 fields (most relevant for emulation)
        displayData.fields.slice(0, 3).forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.textContent = `${field.label}: ${field.value}`;
            data.appendChild(fieldDiv);
        });

        screen.appendChild(data);

        // Trigger emulation once the player has had time to read this screen (it showed for
        // only half a second before, too short to see). If it throws (bad card data), say so
        // rather than leaving "Emulating..." up with nothing happening.
        // The timer is this copier's own: Cancel or close clears it (cleanup), and it checks
        // that this copier is still the one open, because #rfid-screen is a global id and a
        // copier opened again within the hold has a screen of the same id (R1 m2).
        this.clearTimers();
        this._emulationTimer = setTimeout(() => {
            this._emulationTimer = null;
            if (!this.isLive() || !this.getScreen()) return; // closed or replaced meanwhile
            try {
                this.minigame.handleEmulate(card);
            } catch (e) {
                console.error('Emulation failed:', e);
                this.showError('Emulation failed', 'The saved card data is unreadable. Read the card again.');
                this._fallbackTimer = setTimeout(() => {
                    this._fallbackTimer = null;
                    if (this.isLive() && this.getScreen()) this.showSavedCards();
                }, 3000);
            }
        }, EMULATION_HOLD_MS);
    }

    /** True while this renderer's copier is the minigame on screen. */
    isLive() {
        const framework = typeof window !== 'undefined' ? window.MinigameFramework : null;
        if (framework && framework.currentMinigame !== this.minigame) return false;
        return this.minigame?.gameState?.isActive !== false;
    }

    clearTimers() {
        if (this._emulationTimer) { clearTimeout(this._emulationTimer); this._emulationTimer = null; }
        if (this._fallbackTimer) { clearTimeout(this._fallbackTimer); this._fallbackTimer = null; }
    }

    /**
     * Move the frame onto whole pixels (see wholePixelOffset), now and on every resize, so
     * the stepped corners stay crisp at any window size. Only this frame: the overlay's
     * centring is each minigame's own nested flex layout, so snapping it centrally would
     * move every minigame (R1 m1).
     */
    snapFrameToPixels(frame) {
        if (typeof window === 'undefined' || !frame || typeof frame.getBoundingClientRect !== 'function') return;
        // A layout offset (the frame is position: relative), not a transform: Chrome snaps
        // the box's own paint to whole pixels but draws the clip-path where layout put it,
        // so at y 164.5 the box is crisp and its stepped clip is blurred. A transform moves
        // both by the same half pixel and swaps which one blurs; top/left moves the layout.
        const snap = () => {
            if (!frame.isConnected) return;
            frame.style.left = '';
            frame.style.top = '';
            const { x, y } = wholePixelOffset(frame.getBoundingClientRect(), window.devicePixelRatio || 1);
            if (x) frame.style.left = `${x}px`;
            if (y) frame.style.top = `${y}px`;
        };
        snap();
        // Once more after the first paint, in case fonts or the overlay settle the layout
        if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(snap);
        if (this._onResize) window.removeEventListener('resize', this._onResize);
        this._onResize = snap;
        window.addEventListener('resize', snap);
        // A layout change inside the overlay with no window resize (a message, the controls
        // row) can also move the frame: watch the copier's container and the frame. The snap
        // changes only top/left, never a size, so it cannot retrigger itself (R2 n2).
        this.disconnectResizeObserver();
        const RO = window.ResizeObserver;
        if (typeof RO === 'function') {
            // The cue too: a new size can bring the body's end into view or push it out
            this._resizeObserver = new RO(() => { snap(); this.updateScrollCue(); });
            if (this.container) this._resizeObserver.observe(this.container);
            this._resizeObserver.observe(frame);
        }
    }

    disconnectResizeObserver() {
        if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
    }

    /** Called from the minigame's cleanup: no timer, listener or observer outlives the copier. */
    cleanup() {
        this.clearTimers();
        if (this._onResize && typeof window !== 'undefined') window.removeEventListener('resize', this._onResize);
        this._onResize = null;
        this.disconnectResizeObserver();
        if (this._screenObserver) { this._screenObserver.disconnect(); this._screenObserver = null; }
        this._watchedScreen = null;
    }

    /**
     * Show protocol information screen with attack options
     * @param {Object} cardData - Card data to display protocol info for
     */
    showProtocolInfo(cardData) {
        const screen = this.freshScreen();

        const displayData = this.dataManager.getCardDisplayData(cardData);
        const protocol = displayData.protocol;

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Info';
        screen.appendChild(breadcrumb);

        // Protocol header with icon and color
        const header = document.createElement('div');
        header.className = 'flipper-protocol-header';
        header.innerHTML = `
            <div class="protocol-header-top">
                <span class="protocol-icon">${pixelIcon(displayData.icon, 2)}</span>
                <span class="protocol-name">${escapeHtml(displayData.protocolName)}</span>
            </div>
            <div class="protocol-meta">
                <span>${displayData.frequency}</span>
                <span class="security-badge security-${displayData.security}">
                    ${displayData.security.toUpperCase()}
                </span>
            </div>
        `;
        screen.appendChild(header);

        // Security note. Where the first crack is a choice, the note says when each attack
        // works instead (it sits above the data so it shows without scrolling).
        const firstCrackChoice = (protocol === 'MIFARE_Classic_Weak_Defaults' || protocol === 'MIFARE_Classic_Custom_Keys')
            && !(cardData.rfid_data?.sectors && Object.keys(cardData.rfid_data.sectors).length);
        if (firstCrackChoice) {
            screen.appendChild(crackChoiceNote());
            // A dictionary miss leaves this line behind after the 3 s result screen, so the
            // player still reads why the next move is Darkside (gate m03: it passed unseen).
            if (this.minigame?.dictionaryMissUid && this.minigame.dictionaryMissUid === cardData.rfid_data?.uid) {
                screen.appendChild(iconLine('flipper-info flipper-dict-miss', 'signal',
                    'Dictionary found no keys: this card uses custom keys. Run a Darkside attack instead.'));
            }
        } else if (displayData.securityNote) {
            const note = document.createElement('div');
            note.className = 'flipper-info';
            note.textContent = displayData.securityNote;
            screen.appendChild(note);
        }

        // Card data fields
        const dataDiv = document.createElement('div');
        dataDiv.className = 'flipper-card-data';
        displayData.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            // Field values carry scenario card data: text nodes only
            const strong = document.createElement('span');
            strong.className = 'mg-field-label';
            strong.textContent = `${field.label}:`;
            const value = document.createElement('span');
            value.textContent = ` ${field.value}`;
            fieldDiv.appendChild(strong);
            fieldDiv.appendChild(value);
            dataDiv.appendChild(fieldDiv);
        });
        screen.appendChild(dataDiv);

        // Actions based on protocol. They go in the footer, above Back and Abandon read, so
        // the screen's action shows without scrolling at every window size (R5 m1).
        const actions = document.createElement('div');
        actions.className = 'flipper-buttons flipper-footer-actions';
        const action = (text, onClick, dim) => {
            const btn = controlButton(dim ? 'flipper-button flipper-button-secondary' : 'flipper-button', onClick);
            btn.textContent = text;
            actions.appendChild(btn);
            return btn;
        };

        if (protocol === 'MIFARE_Classic_Weak_Defaults') {
            const keysKnown = cardData.rfid_data?.sectors ?
                Object.keys(cardData.rfid_data.sectors).length : 0;

            if (keysKnown === 0) {
                // Dictionary first, Darkside as the slower attack that works on any card:
                // the choice (and when each works) is the lesson, so both are offered.
                action('> Dictionary Attack (instant)', () => this.minigame.startKeyAttack('dictionary', cardData));
                action('  Darkside Attack (~10 sec)', () => this.minigame.startKeyAttack('darkside', cardData), true);
            } else if (keysKnown < 16) {
                // Some keys found
                action(`> Nested Attack (${16 - keysKnown} sectors)`, () => this.minigame.startKeyAttack('nested', cardData));
            } else {
                // All keys - can clone
                action('> Read & Clone', () => this.showCardDataScreen(cardData));
            }

        } else if (protocol === 'MIFARE_Classic_Custom_Keys') {
            const keysKnown = cardData.rfid_data?.sectors ?
                Object.keys(cardData.rfid_data.sectors).length : 0;

            if (keysKnown === 0) {
                // No keys - suggest Darkside
                action('> Darkside Attack (~30 sec)', () => this.minigame.startKeyAttack('darkside', cardData));
                // Dictionary unlikely but allow try
                action('  Dictionary Attack (unlikely)', () => this.minigame.startKeyAttack('dictionary', cardData), true);
            } else if (keysKnown < 16) {
                // Some keys - nested attack
                action('> Nested Attack (~10 sec)', () => this.minigame.startKeyAttack('nested', cardData));
            } else {
                // All keys
                action('> Read & Clone', () => this.showCardDataScreen(cardData));
            }

        } else if (protocol === 'MIFARE_DESFire') {
            // UID only
            action('> Save UID Only', () => this.showCardDataScreen(cardData));

        } else {
            // EM4100 - instant
            action('> Read & Clone', () => this.showReadingScreen());
        }

        // Back goes one step, to the read screen, keeping the read and any keys
        // already cracked. Abandoning the read is a separate, explicit choice.
        // Both in the footer, on one row under the action (R4 m1, R5 m1).
        const backBtn = backButton(() => this.showCardDataScreen(cardData));
        const abandonBtn = controlButton('flipper-button-back', () => this.minigame.complete(false));
        abandonBtn.textContent = 'Abandon read';
        const row = document.createElement('div');
        row.className = 'flipper-footer-row';
        row.appendChild(backBtn);
        row.appendChild(abandonBtn);

        this.addToFooter(actions, row);
        this.focusMain(actions.children[0]);
    }

    /**
     * Show card reading screen (clone mode)
     */
    showReadingScreen() {
        const screen = this.freshScreen();

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Read';
        screen.appendChild(breadcrumb);

        // What the cloner sees on this card: band, protocol and whether it is encrypted
        const card = this.minigame.cardToClone || {};
        const profile = getReadProfile(detectProtocol(card));

        // The read status and its progress bar first, so they show at every window size
        // (R4 m1); what the cloner sees on the card follows
        const status = document.createElement('div');
        status.className = 'flipper-info';
        status.textContent = profile.cryptoClass === 'open' ? 'Reading ID...' : 'Reading UID...';
        screen.appendChild(status);

        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'rfid-progress-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'rfid-progress-bar';
        progressBar.id = 'rfid-progress-bar';

        progressContainer.appendChild(progressBar);
        screen.appendChild(progressContainer);

        // Instruction
        const instruction = document.createElement('div');
        instruction.className = 'flipper-info-dim';
        instruction.textContent = "Don't move card...";
        screen.appendChild(instruction);

        const band = document.createElement('div');
        band.className = 'flipper-info-dim';
        band.textContent = profile.band;
        screen.appendChild(band);

        screen.appendChild(this.createCryptoLine(profile));

        // Start reading animation
        this.minigame.startCardReading(profile.readMs);
    }

    /**
     * One line saying whether the card's data is encrypted: green for "in clear",
     * amber with a padlock for encrypted.
     * @param {{cryptoLine: string, cryptoClass: string}} profile - from getReadProfile
     */
    createCryptoLine(profile) {
        const line = document.createElement('div');
        return iconLine(`rfid-crypto-line rfid-crypto-${profile.cryptoClass}`,
            profile.cryptoClass === 'open' ? 'unlock' : 'lock', profile.cryptoLine);
    }

    /**
     * A MIFARE Classic 1K card's 16 sectors as a row of cells: lit once its key is known.
     * @param {number} known - sectors whose key is recovered
     * @param {string} [id] - element id, so an attack can light cells as it goes
     */
    createSectorGrid(known, id) {
        const grid = document.createElement('div');
        grid.className = 'rfid-sector-grid';
        if (id) grid.id = id;
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = i < known ? 'rfid-sector rfid-sector-open' : 'rfid-sector';
            grid.appendChild(cell);
        }
        return grid;
    }

    /** Light the first `known` cells of a sector grid already on screen. */
    updateSectorGrid(id, known) {
        const grid = document.getElementById(id);
        if (!grid || !grid.children) return;
        Array.from(grid.children).forEach((cell, i) => {
            cell.className = i < known ? 'rfid-sector rfid-sector-open' : 'rfid-sector';
        });
    }

    /**
     * Update reading progress
     * @param {number} progress - Progress percentage (0-100)
     */
    updateReadingProgress(progress) {
        const progressBar = document.getElementById('rfid-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;

            // Change color based on progress
            if (progress < 50) {
                progressBar.style.backgroundColor = '#FF8200';
            } else if (progress < 100) {
                progressBar.style.backgroundColor = '#FFA500';
            } else {
                progressBar.style.backgroundColor = '#00FF00';
            }
        }
    }

    /**
     * Show card data screen after reading (supports all protocols)
     * @param {Object} cardData - Read card data
     */
    showCardDataScreen(cardData) {
        const screen = this.freshScreen();

        // Get protocol-specific display data
        const displayData = this.dataManager.getCardDisplayData(cardData);

        // Breadcrumb, naming the card read (shot 17: only its raw data was shown)
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = cardData && cardData.name ? `RFID > Read: ${displayDashes(cardData.name)}` : 'RFID > Read';
        screen.appendChild(breadcrumb);

        // Protocol header
        const protocolHeader = document.createElement('div');
        protocolHeader.className = 'flipper-protocol-header';
        protocolHeader.innerHTML = `
            <div class="protocol-header-top">
                <span class="protocol-icon">${pixelIcon(displayData.icon, 2)}</span>
                <span class="protocol-name">${escapeHtml(displayData.protocolName)}</span>
            </div>
            <div class="protocol-meta">
                <span>${displayData.frequency}</span>
                <span class="security-badge security-${displayData.security}">
                    ${displayData.security.toUpperCase()}
                </span>
            </div>
        `;
        screen.appendChild(protocolHeader);

        // Security note (if applicable)
        // A keyless MIFARE read shows the crack hint instead (keeps the buttons on screen).
        const keyless = !this.dataManager.canClone(cardData);
        if (displayData.securityNote && !keyless) {
            const note = document.createElement('div');
            note.className = 'flipper-info';
            note.textContent = displayData.securityNote;
            screen.appendChild(note);
        }

        // A keyless MIFARE read: why there is no plain Save, above the data so it shows
        // with the footer's "Crack keys first" (R4 m1)
        if (keyless) {
            screen.appendChild(iconLine('flipper-info flipper-crack-hint', 'lock',
                'Sectors encrypted: recover the keys to read them. Default keys fall to a dictionary attack; custom keys need Darkside.'));
        }

        // Card data fields
        const data = document.createElement('div');
        // Compact when the keyless hint or the sector grid needs the room
        const compact = keyless || displayData.protocol.startsWith('MIFARE_Classic');
        data.className = compact ? 'flipper-card-data flipper-card-data-compact' : 'flipper-card-data';
        displayData.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            // Field values carry scenario card data: text nodes only
            const strong = document.createElement('span');
            strong.className = 'mg-field-label';
            strong.textContent = `${field.label}:`;
            const value = document.createElement('span');
            value.textContent = ` ${field.value}`;
            fieldDiv.appendChild(strong);
            fieldDiv.appendChild(value);
            data.appendChild(fieldDiv);
        });

        // For EM4100, add checksum (legacy)
        if (displayData.protocol === 'EM4100') {
            const hex = cardData.rfid_data?.hex || cardData.rfid_hex;
            if (hex) {
                const checksum = this.dataManager.calculateChecksum(hex);
                const checksumDiv = document.createElement('div');
                checksumDiv.innerHTML = `<span class="mg-field-label">Checksum:</span> 0x${checksum.toString(16).toUpperCase().padStart(2, '0')}`;
                data.appendChild(checksumDiv);
            }
        }

        screen.appendChild(data);

        // MIFARE Classic: show the 16 sectors, locked until their keys are recovered
        if (displayData.protocol.startsWith('MIFARE_Classic')) {
            screen.appendChild(this.createSectorGrid(this.dataManager.getKnownKeyCount(cardData)));
        }

        // Buttons
        const buttons = document.createElement('div');
        buttons.className = 'flipper-buttons';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'flipper-button';
        if (keyless) {
            // MIFARE Classic with no keys: no plain Save, point at the attack menu.
            saveBtn.textContent = 'Crack keys first';
            saveBtn.addEventListener('click', () => this.showProtocolInfo(cardData));
        } else {
            saveBtn.textContent = displayData.protocol === 'MIFARE_DESFire' ? 'Save UID' : 'Save';
            saveBtn.addEventListener('click', () => this.minigame.handleSaveCard(cardData));
        }

        // The read screen is the first step of a clone, so its only way out is to
        // abandon the read: say so rather than "Cancel".
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'flipper-button flipper-button-secondary';
        cancelBtn.textContent = 'Abandon read';
        cancelBtn.addEventListener('click', () => this.minigame.complete(false));

        buttons.appendChild(saveBtn);
        buttons.appendChild(cancelBtn);
        // In the footer, outside the scrolling body: Save and Abandon show at every
        // window size, however long the card data (R4 m1)
        this.addToFooter(buttons);
        this.focusMain(saveBtn);
    }

    /**
     * Show attack progress screen
     * @param {Object} data - Attack data {type, progress, currentSector, etc.}
     */
    showAttackProgress(data) {
        const screen = this.freshScreen();

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = `RFID > ${data.type} Attack`;
        screen.appendChild(breadcrumb);

        // Attack type
        const type = document.createElement('div');
        type.className = 'flipper-info';
        type.textContent = `${data.type} Attack`;
        type.style.fontSize = '16px';
        type.style.marginBottom = '10px';
        screen.appendChild(type);

        // Status
        const status = document.createElement('div');
        status.className = 'flipper-info-dim';
        status.id = 'attack-status';
        if (data.currentSector !== undefined) {
            status.textContent = `Sector ${data.currentSector}/${data.totalSectors || 16}`;
        } else if (data.sectorsRemaining !== undefined) {
            status.textContent = `${data.sectorsRemaining} sectors remaining`;
        } else {
            status.textContent = 'Working...';
        }
        screen.appendChild(status);

        // The MIFARE stage EM4100 never needs
        screen.appendChild(this.createCryptoLine({ cryptoClass: 'locked', cryptoLine: 'Sectors encrypted: recovering keys' }));
        screen.appendChild(this.createSectorGrid(this.sectorsKnownFrom(data), 'attack-sector-grid'));

        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'rfid-progress-container';
        progressContainer.style.marginTop = '12px';

        const progressBar = document.createElement('div');
        progressBar.className = 'rfid-progress-bar';
        progressBar.id = 'attack-progress-bar';
        progressBar.style.width = `${data.progress || 0}%`;

        progressContainer.appendChild(progressBar);
        screen.appendChild(progressContainer);

        // Percentage
        const percentage = document.createElement('div');
        percentage.className = 'flipper-info';
        percentage.id = 'attack-percentage';
        percentage.textContent = `${Math.floor(data.progress || 0)}%`;
        percentage.style.textAlign = 'center';
        percentage.style.marginTop = '10px';
        screen.appendChild(percentage);
    }

    /**
     * Update attack progress
     * @param {Object} data - Progress data
     */
    updateAttackProgress(data) {
        const progressBar = document.getElementById('attack-progress-bar');
        const status = document.getElementById('attack-status');
        const percentage = document.getElementById('attack-percentage');

        if (progressBar) {
            progressBar.style.width = `${data.progress}%`;

            // Change color based on progress
            if (data.progress < 50) {
                progressBar.style.backgroundColor = '#FF8200';
            } else if (data.progress < 100) {
                progressBar.style.backgroundColor = '#FFA500';
            } else {
                progressBar.style.backgroundColor = '#00FF00';
            }
        }

        if (status) {
            if (data.currentSector !== undefined) {
                status.textContent = `Sector ${data.currentSector}/${data.totalSectors || 16}`;
            } else if (data.sectorsRemaining !== undefined) {
                status.textContent = `${data.sectorsRemaining} sectors remaining`;
            }
        }

        if (percentage) {
            percentage.textContent = `${Math.floor(data.progress)}%`;
        }

        this.updateSectorGrid('attack-sector-grid', this.sectorsKnownFrom(data));
    }

    /** Sectors cracked so far, from an attack's progress data. */
    sectorsKnownFrom(data) {
        if (data.progress >= 100) return 16;
        if (data.sectorsRemaining !== undefined) return 16 - data.sectorsRemaining;
        if (data.currentSector !== undefined) return data.currentSector;
        return 0;
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const screen = this.freshScreen();

        const success = document.createElement('div');
        success.className = 'flipper-success';
        // The message can name a card from the scenario: escaped, not parsed
        success.innerHTML = `
            <div class="flipper-success-icon">${pixelIcon('tick', 6)}</div>
            <div class="flipper-success-message">${escapeHtml(message)}</div>
        `;
        screen.appendChild(success);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     * @param {string} [detail] - Short line underneath saying why
     * @param {string} [tone] - 'notice' for "nothing happened" (amber, no cross)
     */
    showError(message, detail, tone) {
        const screen = this.freshScreen();
        if (!screen) return;

        const notice = tone === 'notice';
        const error = document.createElement('div');
        error.className = notice ? 'flipper-error flipper-notice' : 'flipper-error';
        error.innerHTML = `
            <div class="flipper-error-icon">${notice ? pixelIcon('signal', 5) : pixelIcon('cross', 6)}</div>
            <div class="flipper-error-message">${escapeHtml(message)}</div>
        `;
        if (detail) {
            const why = document.createElement('div');
            why.className = 'flipper-error-detail';
            why.textContent = detail;
            error.appendChild(why);
        }
        screen.appendChild(error);
    }

    /**
     * Clear screen
     */
    clear() {
        this.container.innerHTML = '';
    }
}

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
             'KDDWWDDK', 'KDWDDWDK', 'KDDWWDDK', 'KDDDDDDK', 'KKKKKKKK']
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
        const screen = this.getScreen();
        if (!screen) return;
        screen.innerHTML = '';

        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Reader';
        screen.appendChild(breadcrumb);

        const readerName = this.minigame.params?.readerName;
        screen.appendChild(iconLine('flipper-reader-head', 'reader', readerName ? `At the reader: ${displayDashes(readerName)}` : 'At the reader', 3));

        const saved = this.dataManager.getSavedCards();
        const held = this.minigame.params?.availableCards || [];
        const list = document.createElement('div');
        list.className = 'flipper-card-list flipper-door-list';

        if (saved.length > 0) {
            const head = document.createElement('div');
            head.className = 'flipper-section-head';
            head.textContent = 'Play back a saved card';
            list.appendChild(head);
            saved.forEach(card => {
                const item = document.createElement('div');
                item.className = 'flipper-menu-item';
                item.setAttribute?.('role', 'button');
                item.innerHTML = `${pixelIcon('signal', 2)}<span>Emulate ${escapeHtml(displayDashes(card.name || 'Card'))}</span>`;
                item.addEventListener('click', () => this.showEmulationScreen(card));
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
                const item = document.createElement('div');
                item.className = 'flipper-menu-item';
                item.setAttribute?.('role', 'button');
                item.innerHTML = `${pixelIcon('card', 2)}<span>Tap ${escapeHtml(name)}</span>`;
                item.addEventListener('click', () => this.minigame.handleCardTap(card));
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

        // Screen container
        const screen = document.createElement('div');
        screen.className = 'flipper-screen';
        screen.id = 'rfid-screen';

        frame.appendChild(header);
        frame.appendChild(screen);

        return frame;
    }

    /**
     * Get screen element
     * @returns {HTMLElement} Screen element
     */
    getScreen() {
        return document.getElementById('rfid-screen');
    }

    /**
     * Show main menu
     * @param {string} mode - 'unlock' or 'clone'
     */
    showMainMenu(mode) {
        const screen = this.getScreen();
        screen.innerHTML = '';

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID';
        screen.appendChild(breadcrumb);

        // Menu items
        const menu = document.createElement('div');
        menu.className = 'flipper-menu';

        if (mode === 'unlock') {
            // Read option (tap cards)
            const readOption = document.createElement('div');
            readOption.className = 'flipper-menu-item';
            readOption.textContent = '> Read';
            readOption.addEventListener('click', () => this.showTapInterface());
            menu.appendChild(readOption);

            // Saved option (emulate)
            const savedOption = document.createElement('div');
            savedOption.className = 'flipper-menu-item';
            savedOption.textContent = '  Saved';
            savedOption.addEventListener('click', () => this.showSavedCards());
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
    }

    /**
     * Show tap interface for unlock mode
     */
    showTapInterface() {
        // At a reader both lists live on the door screen
        if (this.minigame.isLockingAttempt) return this.showDoorScreen();
        const screen = this.getScreen();
        screen.innerHTML = '';

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
        } else {
            availableCards.forEach(card => {
                const cardItem = document.createElement('div');
                cardItem.className = 'flipper-menu-item';
                cardItem.textContent = `> ${displayDashes(card.scenarioData?.name || 'Keycard')}`;
                cardItem.addEventListener('click', () => {
                    this.minigame.handleCardTap(card);
                });
                cardList.appendChild(cardItem);
            });
        }

        screen.appendChild(cardList);

        // Back button
        const back = document.createElement('div');
        back.className = 'flipper-button-back';
        back.textContent = '← Back';
        back.addEventListener('click', () => this.showMainMenu('unlock'));
        screen.appendChild(back);
    }

    /**
     * Show saved cards list
     */
    showSavedCards() {
        // At a reader both lists live on the door screen
        if (this.minigame.isLockingAttempt) return this.showDoorScreen();
        const screen = this.getScreen();
        screen.innerHTML = '';

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
        } else {
            // Card list
            const cardList = document.createElement('div');
            cardList.className = 'flipper-card-list';

            savedCards.forEach(card => {
                const cardItem = document.createElement('div');
                cardItem.className = 'flipper-menu-item';
                cardItem.textContent = `> ${displayDashes(card.name)}`;
                cardItem.addEventListener('click', () => this.showCardDetails(card));
                cardList.appendChild(cardItem);
            });

            screen.appendChild(cardList);
        }

        // Back button
        const back = document.createElement('div');
        back.className = 'flipper-button-back';
        back.textContent = '← Back';
        back.addEventListener('click', () => this.showMainMenu('unlock'));
        screen.appendChild(back);
    }

    /**
     * Show card details with Emulate button
     * @param {Object} card - Card to display
     */
    showCardDetails(card) {
        const screen = this.getScreen();
        screen.innerHTML = '';

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

        // Emulate button
        const emulateBtn = document.createElement('div');
        emulateBtn.className = 'flipper-menu-item';
        emulateBtn.textContent = '> Emulate';
        emulateBtn.addEventListener('click', () => this.showEmulationScreen(card));
        screen.appendChild(emulateBtn);

        // Back button
        const back = document.createElement('div');
        back.className = 'flipper-button-back';
        back.textContent = '← Back';
        back.addEventListener('click', () => this.showSavedCards());
        screen.appendChild(back);
    }

    /**
     * Show emulation screen (supports all protocols)
     * @param {Object} card - Card to emulate
     */
    showEmulationScreen(card) {
        const screen = this.getScreen();
        screen.innerHTML = '';

        // Get protocol-specific display data
        const displayData = this.dataManager.getCardDisplayData(card);

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Saved > Emulating';
        screen.appendChild(breadcrumb);

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

        // Emulating message
        const emulating = document.createElement('div');
        emulating.className = 'flipper-emulating';
        if (displayData.protocol === 'MIFARE_DESFire' && !card.rfid_data?.masterKeyKnown) {
            emulating.textContent = 'Emulating UID only...';
        } else {
            emulating.textContent = 'Emulating...';
        }
        screen.appendChild(emulating);

        // Trigger emulation after showing screen. If it throws (bad card data), say so
        // rather than leaving "Emulating..." up with nothing happening.
        setTimeout(() => {
            if (!this.getScreen()) return; // closed meanwhile
            try {
                this.minigame.handleEmulate(card);
            } catch (e) {
                console.error('Emulation failed:', e);
                this.showError('Emulation failed', 'The saved card data is unreadable. Read the card again.');
                setTimeout(() => { if (this.getScreen()) this.showSavedCards(); }, 3000);
            }
        }, 500);
    }

    /**
     * Show protocol information screen with attack options
     * @param {Object} cardData - Card data to display protocol info for
     */
    showProtocolInfo(cardData) {
        const screen = this.getScreen();
        screen.innerHTML = '';

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

        // Security note
        if (displayData.securityNote) {
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
            const strong = document.createElement('strong');
            strong.textContent = `${field.label}:`;
            const value = document.createElement('span');
            value.textContent = ` ${field.value}`;
            fieldDiv.appendChild(strong);
            fieldDiv.appendChild(value);
            dataDiv.appendChild(fieldDiv);
        });
        screen.appendChild(dataDiv);

        // Actions based on protocol
        const actions = document.createElement('div');
        actions.className = 'flipper-menu';
        actions.style.marginTop = '20px';

        if (protocol === 'MIFARE_Classic_Weak_Defaults') {
            const keysKnown = cardData.rfid_data?.sectors ?
                Object.keys(cardData.rfid_data.sectors).length : 0;

            if (keysKnown === 0) {
                // Suggest dictionary first
                const dictBtn = document.createElement('div');
                dictBtn.className = 'flipper-menu-item';
                dictBtn.textContent = '> Dictionary Attack (instant)';
                dictBtn.addEventListener('click', () =>
                    this.minigame.startKeyAttack('dictionary', cardData));
                actions.appendChild(dictBtn);
            } else if (keysKnown < 16) {
                // Some keys found
                const nestedBtn = document.createElement('div');
                nestedBtn.className = 'flipper-menu-item';
                nestedBtn.textContent = `> Nested Attack (${16 - keysKnown} sectors)`;
                nestedBtn.addEventListener('click', () =>
                    this.minigame.startKeyAttack('nested', cardData));
                actions.appendChild(nestedBtn);
            } else {
                // All keys - can clone
                const readBtn = document.createElement('div');
                readBtn.className = 'flipper-menu-item';
                readBtn.textContent = '> Read & Clone';
                readBtn.addEventListener('click', () =>
                    this.showCardDataScreen(cardData));
                actions.appendChild(readBtn);
            }

        } else if (protocol === 'MIFARE_Classic_Custom_Keys') {
            const keysKnown = cardData.rfid_data?.sectors ?
                Object.keys(cardData.rfid_data.sectors).length : 0;

            if (keysKnown === 0) {
                // No keys - suggest Darkside
                const darksideBtn = document.createElement('div');
                darksideBtn.className = 'flipper-menu-item';
                darksideBtn.textContent = '> Darkside Attack (~30 sec)';
                darksideBtn.addEventListener('click', () =>
                    this.minigame.startKeyAttack('darkside', cardData));
                actions.appendChild(darksideBtn);

                // Dictionary unlikely but allow try
                const dictBtn = document.createElement('div');
                dictBtn.className = 'flipper-menu-item flipper-menu-item-dim';
                dictBtn.textContent = '  Dictionary Attack (unlikely)';
                dictBtn.addEventListener('click', () =>
                    this.minigame.startKeyAttack('dictionary', cardData));
                actions.appendChild(dictBtn);
            } else if (keysKnown < 16) {
                // Some keys - nested attack
                const nestedBtn = document.createElement('div');
                nestedBtn.className = 'flipper-menu-item';
                nestedBtn.textContent = `> Nested Attack (~10 sec)`;
                nestedBtn.addEventListener('click', () =>
                    this.minigame.startKeyAttack('nested', cardData));
                actions.appendChild(nestedBtn);
            } else {
                // All keys
                const readBtn = document.createElement('div');
                readBtn.className = 'flipper-menu-item';
                readBtn.textContent = '> Read & Clone';
                readBtn.addEventListener('click', () =>
                    this.showCardDataScreen(cardData));
                actions.appendChild(readBtn);
            }

        } else if (protocol === 'MIFARE_DESFire') {
            // UID only
            const uidBtn = document.createElement('div');
            uidBtn.className = 'flipper-menu-item';
            uidBtn.textContent = '> Save UID Only';
            uidBtn.addEventListener('click', () =>
                this.showCardDataScreen(cardData));
            actions.appendChild(uidBtn);

        } else {
            // EM4100 - instant
            const readBtn = document.createElement('div');
            readBtn.className = 'flipper-menu-item';
            readBtn.textContent = '> Read & Clone';
            readBtn.addEventListener('click', () =>
                this.showReadingScreen());
            actions.appendChild(readBtn);
        }

        // Back goes one step, to the read screen, keeping the read and any keys
        // already cracked. Abandoning the read is a separate, explicit choice.
        const backBtn = document.createElement('div');
        backBtn.className = 'flipper-button-back';
        backBtn.textContent = '← Back';
        backBtn.addEventListener('click', () => this.showCardDataScreen(cardData));
        actions.appendChild(backBtn);

        const abandonBtn = document.createElement('div');
        abandonBtn.className = 'flipper-button-back';
        abandonBtn.textContent = 'Abandon read';
        abandonBtn.addEventListener('click', () => this.minigame.complete(false));
        actions.appendChild(abandonBtn);

        // The menu entries are divs: mark them as buttons for assistive tech and the
        // test bridge, which finds controls by role.
        for (const item of actions.children) item.setAttribute?.('role', 'button');

        screen.appendChild(actions);
    }

    /**
     * Show card reading screen (clone mode)
     */
    showReadingScreen() {
        const screen = this.getScreen();
        screen.innerHTML = '';

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = 'RFID > Read';
        screen.appendChild(breadcrumb);

        // What the cloner sees on this card: band, protocol and whether it is encrypted
        const card = this.minigame.cardToClone || {};
        const profile = getReadProfile(detectProtocol(card));

        const band = document.createElement('div');
        band.className = 'flipper-info-dim';
        band.textContent = profile.band;
        screen.appendChild(band);

        const status = document.createElement('div');
        status.className = 'flipper-info';
        status.textContent = profile.cryptoClass === 'open' ? 'Reading ID...' : 'Reading UID...';
        screen.appendChild(status);

        screen.appendChild(this.createCryptoLine(profile));

        // Instruction
        const instruction = document.createElement('div');
        instruction.className = 'flipper-info-dim';
        instruction.textContent = "Don't move card...";
        screen.appendChild(instruction);

        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'rfid-progress-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'rfid-progress-bar';
        progressBar.id = 'rfid-progress-bar';

        progressContainer.appendChild(progressBar);
        screen.appendChild(progressContainer);

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
        const screen = this.getScreen();
        screen.innerHTML = '';

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

        // Card data fields
        const data = document.createElement('div');
        // Compact when the keyless hint or the sector grid needs the room
        const compact = keyless || displayData.protocol.startsWith('MIFARE_Classic');
        data.className = compact ? 'flipper-card-data flipper-card-data-compact' : 'flipper-card-data';
        displayData.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            // Field values carry scenario card data: text nodes only
            const strong = document.createElement('strong');
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
                checksumDiv.innerHTML = `<strong>Checksum:</strong> 0x${checksum.toString(16).toUpperCase().padStart(2, '0')}`;
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
            screen.appendChild(iconLine('flipper-info flipper-crack-hint', 'lock',
                'Sectors encrypted: recover the keys to read them. Default keys fall to a dictionary attack; custom keys need Darkside.'));
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
        screen.appendChild(buttons);
    }

    /**
     * Show attack progress screen
     * @param {Object} data - Attack data {type, progress, currentSector, etc.}
     */
    showAttackProgress(data) {
        const screen = this.getScreen();
        screen.innerHTML = '';

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'flipper-breadcrumb';
        breadcrumb.textContent = `RFID > ${data.type} Attack`;
        screen.appendChild(breadcrumb);

        // Attack type
        const type = document.createElement('div');
        type.className = 'flipper-info';
        type.textContent = `${data.type} Attack`;
        type.style.fontSize = '18px';
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
        const screen = this.getScreen();
        screen.innerHTML = '';

        const success = document.createElement('div');
        success.className = 'flipper-success';
        // The message can name a card from the scenario: escaped, not parsed
        success.innerHTML = `
            <div class="flipper-success-icon">✓</div>
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
        const screen = this.getScreen();
        if (!screen) return;
        screen.innerHTML = '';

        const notice = tone === 'notice';
        const error = document.createElement('div');
        error.className = notice ? 'flipper-error flipper-notice' : 'flipper-error';
        error.innerHTML = `
            <div class="flipper-error-icon">${notice ? pixelIcon('signal', 5) : '✗'}</div>
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

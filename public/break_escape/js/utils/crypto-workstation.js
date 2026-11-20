// Crypto workstation functionality
import { writeGlobal } from '../systems/global-writer.js';

export function createCryptoWorkstation(objectData) {
    // Create the workstation sprite
    const workstationSprite = this.add.sprite(0, 0, 'workstation');
    workstationSprite.setVisible(false);
    workstationSprite.name = "workstation";
    workstationSprite.scenarioData = objectData;
    workstationSprite.setInteractive({ useHandCursor: true });
    
    return workstationSprite;
}

const CYBERCHEF_PATH = '/break_escape/assets/cyberchef/CyberChef_v10.19.4.html';

// ---- Decode watch -------------------------------------------------------
// A workstation item can carry `decodeWatch: [{ contains, setVariable }]`. While the
// popup is open the CyberChef output is read now and then; when it contains a marker
// (matched ignoring case and runs of whitespace) the named global is set once, so a
// task can tick on the player decoding something rather than on opening it. The
// markers are plaintext phrases that only a correct decode prints.
export const DECODE_WATCH_INTERVAL_MS = 800;

const squash = (t) => String(t || '').replace(/\s+/g, ' ').toLowerCase();

/** The watches whose marker appears in `outputText`, minus any already fired. */
export function matchDecodeWatches(outputText, watches, fired = new Set()) {
    const hay = squash(outputText);
    if (!hay || !Array.isArray(watches)) return [];
    return watches.filter((w) => w && typeof w.contains === 'string' && w.contains
        && w.setVariable && !fired.has(w.setVariable)
        && hay.includes(squash(w.contains)));
}

/** The CyberChef output pane text, '' when the frame is not readable yet. */
export function readCyberChefOutput(frame) {
    try {
        const doc = frame && frame.contentDocument;
        const pane = doc && (doc.querySelector('#output-text .cm-content') || doc.querySelector('#output-text'));
        return pane ? (pane.innerText || pane.textContent || '') : '';
    } catch (e) {
        return '';
    }
}

function applyDecodeGlobal(name) {
    // The shared writer updates gameState, cached and open-chat stories, and emits the event.
    writeGlobal(name, true);
}

function decodeWatchesFromInventory() {
    const items = (typeof window !== 'undefined' && window.inventory && window.inventory.items) || [];
    for (const it of items) {
        const d = it && (it.scenarioObject?.scenarioData || it.scenarioData);
        if (d && d.type === 'workstation' && Array.isArray(d.decodeWatch)) return d.decodeWatch;
    }
    return [];
}

let decodeTimer = null;
let decodeTick = null;
const firedWatches = new Set();

function stopDecodeWatch() {
    if (decodeTick) { try { decodeTick(); } catch (e) { /* frame gone */ } decodeTick = null; }
    if (decodeTimer) { clearInterval(decodeTimer); decodeTimer = null; }
}

function startDecodeWatch() {
    stopDecodeWatch();
    const watches = decodeWatchesFromInventory();
    if (!watches.length || typeof setInterval !== 'function') return;
    const tick = () => {
        const frame = document.getElementById('cyberchef-frame');
        for (const m of matchDecodeWatches(readCyberChefOutput(frame), watches, firedWatches)) {
            firedWatches.add(m.setVariable);
            applyDecodeGlobal(m.setVariable);
        }
    };
    decodeTick = tick;
    decodeTimer = setInterval(tick, DECODE_WATCH_INTERVAL_MS);
}

// Open the crypto workstation
export function openCryptoWorkstation() {
    const laptopPopup = document.getElementById('laptop-popup');
    const cyberchefFrame = document.getElementById('cyberchef-frame');
    
    // Load CyberChef only the first time. Closing the laptop keeps the frame
    // loaded, so the player's recipe and input survive close and reopen.
    if (cyberchefFrame.getAttribute('src') !== CYBERCHEF_PATH) {
        cyberchefFrame.src = CYBERCHEF_PATH;
    }
    
    // Show the laptop popup
    laptopPopup.style.display = 'block';
    // Toasts over the popup keep clear of its title bar and X (ui/hud-lanes.js, toast plan 2.8)
    window.hudLanesRelayout?.();
    
    startDecodeWatch();

    // Disable game input while laptop is open
    if (window.game && window.game.input) {
        window.game.input.mouse.enabled = false;
        window.game.input.keyboard.enabled = false;
    }
}

// Close the crypto workstation
export function closeLaptop() {
    const laptopPopup = document.getElementById('laptop-popup');
    // Hide the laptop popup
    laptopPopup.style.display = 'none';
    stopDecodeWatch();
    
    // Leave the iframe loaded (do not clear src) so the recipe and input persist.
    
    // Re-enable game input
    if (window.game && window.game.input) {
        window.game.input.mouse.enabled = true;
        window.game.input.keyboard.enabled = true;
    }

    // Barks held while the popup was open (npc-barks.js _shouldDefer)
    window.barkSystem?.drainDeferredBarks?.();
    // A held or queued call can ring or open now (phone calls plan 2.9)
    window.phoneRinger?.onPopupClosed?.();
    // Toasts placed over the popup go back to the lane (toast plan 2.8)
    window.hudLanesRelayout?.();
}

// Open the crypto workstation iframe in a new tab. CyberChef keeps the recipe
// and input in the URL hash, so opening the frame's live location carries them over.
export function openCryptoWorkstationInNewTab() {
    const cyberchefFrame = document.getElementById('cyberchef-frame');
    if (!cyberchefFrame) return;

    let url = CYBERCHEF_PATH;
    try {
        const live = cyberchefFrame.contentWindow && cyberchefFrame.contentWindow.location.href;
        if (live && live.indexOf(CYBERCHEF_PATH) !== -1) url = live;
    } catch (e) {
        // Cross-origin or not loaded: fall back to the base URL.
    }
    window.open(url, '_blank');
}

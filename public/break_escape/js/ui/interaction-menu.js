import { displayDashes } from '../utils/display-dashes.js';
/**
 * Interaction disambiguation menu.
 *
 * When a tap/click lands near several interactable entities that are all within
 * the player's reach (e.g. a memo lying next to an NPC), we can't reliably guess
 * which one the player meant — on touch screens the finger covers everything.
 * Instead of forcing the player to shove characters out of the way, we pop a
 * small HTML overlay listing each candidate by its observation text and let the
 * player choose.
 *
 * Rendered as a DOM overlay (not on the Phaser canvas) so text stays crisp at
 * any device resolution and is easy to tap.
 */

let overlayEl = null;       // full-screen backdrop + menu container
let menuEl = null;          // the menu box itself
let stylesInjected = false;

function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;

    const style = document.createElement('style');
    style.id = 'be-interaction-menu-styles';
    style.textContent = `
        #be-interaction-menu-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            /* Transparent backdrop captures the outside-tap to dismiss */
            background: transparent;
            touch-action: manipulation;
        }
        #be-interaction-menu {
            position: absolute;
            min-width: 160px;
            max-width: min(80vw, 340px);
            background: rgba(0, 0, 0, 0.82);
            border: 2px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.6);
            padding: 4px;
            font-family: 'GNF', 'Courier New', monospace;
            color: #ffffff;
            max-height: calc(100vh - 24px);
            overflow-y: auto;
            overflow-x: hidden;
            image-rendering: pixelated;
        }
        #be-interaction-menu .be-im-title {
            font-size: 13px;
            line-height: 1.4;
            text-transform: uppercase;
            color: #4da6ff;
            padding: 6px 8px 8px;
        }
        #be-interaction-menu .be-im-item {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            text-align: left;
            background: transparent;
            border: 2px solid transparent;
            padding: 8px;
            cursor: pointer;
            color: inherit;
            font-family: inherit;
            line-height: 1.4;
        }
        #be-interaction-menu .be-im-item:hover,
        #be-interaction-menu .be-im-item:focus {
            background: rgba(77, 166, 255, 0.18);
            border-color: rgba(77, 166, 255, 0.55);
            outline: none;
        }
        #be-interaction-menu .be-im-item:active {
            background: rgba(77, 166, 255, 0.32);
        }
        #be-interaction-menu .be-im-icon {
            flex: 0 0 auto;
            width: 64px;
            height: 64px;
            image-rendering: pixelated;
            background-repeat: no-repeat;
        }
        #be-interaction-menu .be-im-text {
            flex: 1 1 auto;
            min-width: 0;
        }
        #be-interaction-menu .be-im-label {
            display: block;
            font-size: 16px;
            color: #ffffff;
        }
        #be-interaction-menu .be-im-detail {
            display: -webkit-box;
            font-size: 16px;
            line-height: 1.5;
            color: #9fb0c4;
            margin-top: 6px;
            white-space: normal;
            overflow: hidden;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
    `;
    document.head.appendChild(style);
}

export function isInteractionMenuOpen() {
    return overlayEl !== null;
}

export function closeInteractionMenu() {
    if (overlayEl) {
        overlayEl.remove();
        overlayEl = null;
        menuEl = null;
        document.removeEventListener('keydown', onKeyDown, true);
    }
}

function onKeyDown(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeInteractionMenu();
    }
}

/**
 * @param {Array<{label:string, detail?:string, icon?:{src:string, frame?:number, cols?:number, cell?:number}, onSelect:Function}>} candidates
 * @param {number} clientX - viewport X of the tap (event.clientX)
 * @param {number} clientY - viewport Y of the tap (event.clientY)
 */
export function showInteractionMenu(candidates, clientX, clientY) {
    if (!candidates || candidates.length === 0) return;
    injectStyles();
    closeInteractionMenu(); // never stack two menus

    overlayEl = document.createElement('div');
    overlayEl.id = 'be-interaction-menu-overlay';

    menuEl = document.createElement('div');
    menuEl.id = 'be-interaction-menu';
    menuEl.setAttribute('role', 'menu');

    const title = document.createElement('div');
    title.className = 'be-im-title';
    title.textContent = 'Interact with…';
    menuEl.appendChild(title);

    candidates.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'be-im-item';
        btn.setAttribute('role', 'menuitem');
        btn.type = 'button';

        // Icon: a plain image, or one frame cropped from a sprite sheet, scaled up
        // to the 64px display box (DISPLAY/cell). Both the sheet and the frame
        // offsets are scaled together so the crop stays aligned.
        if (c.icon && c.icon.src) {
            const DISPLAY = 64;
            const icon = document.createElement('span');
            icon.className = 'be-im-icon';
            icon.style.backgroundImage = `url("${c.icon.src}")`;
            if (Number.isInteger(c.icon.frame)) {
                const cols = c.icon.cols || 4;
                const cell = c.icon.cell || 32;
                const scale = DISPLAY / cell;
                const col = c.icon.frame % cols;
                const row = Math.floor(c.icon.frame / cols);
                icon.style.backgroundSize = `${cols * cell * scale}px auto`;
                icon.style.backgroundPosition = `-${col * cell * scale}px -${row * cell * scale}px`;
            } else {
                icon.style.backgroundSize = 'contain';
                icon.style.backgroundPosition = '0 0';
            }
            btn.appendChild(icon);
        }

        const text = document.createElement('span');
        text.className = 'be-im-text';

        const label = document.createElement('span');
        label.className = 'be-im-label';
        label.textContent = displayDashes(c.label);
        text.appendChild(label);

        if (c.detail) {
            const detail = document.createElement('span');
            detail.className = 'be-im-detail';
            detail.textContent = displayDashes(c.detail);
            text.appendChild(detail);
        }

        btn.appendChild(text);

        const choose = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeInteractionMenu();
            try {
                c.onSelect();
            } catch (err) {
                console.error('[InteractionMenu] onSelect failed:', err);
            }
        };
        // pointerup fires reliably on both touch and mouse without the 300ms delay
        btn.addEventListener('click', choose);
        menuEl.appendChild(btn);
    });

    // Dismiss when the backdrop (anything outside the menu box) is tapped.
    overlayEl.addEventListener('pointerdown', (e) => {
        if (!menuEl.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            closeInteractionMenu();
        }
    });

    overlayEl.appendChild(menuEl);
    document.body.appendChild(overlayEl);
    document.addEventListener('keydown', onKeyDown, true);

    // Position near the tap, then clamp inside the viewport. Bias the menu
    // upward/leftward of the finger so it isn't hidden under the player's thumb.
    const margin = 8;
    const rect = menuEl.getBoundingClientRect();
    let x = (clientX ?? window.innerWidth / 2) - rect.width / 2;
    let y = (clientY ?? window.innerHeight / 2) - rect.height - 16;

    if (x + rect.width + margin > window.innerWidth) x = window.innerWidth - rect.width - margin;
    if (x < margin) x = margin;
    if (y < margin) y = (clientY ?? 0) + 16; // not enough room above — drop below the tap
    if (y + rect.height + margin > window.innerHeight) y = window.innerHeight - rect.height - margin;
    if (y < margin) y = margin;

    menuEl.style.left = `${Math.round(x)}px`;
    menuEl.style.top = `${Math.round(y)}px`;
}

// Global access (mirrors the other UI helpers in this codebase)
window.showInteractionMenu = showInteractionMenu;
window.closeInteractionMenu = closeInteractionMenu;
window.isInteractionMenuOpen = isInteractionMenuOpen;

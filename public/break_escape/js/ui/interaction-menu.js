import { displayDashes } from '../utils/display-dashes.js';
import { registerModal } from './modal-stack.js';
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
let menuEl = null;          // the menu box itself (the themed frame)
let listEl = null;          // the scrolling list of entries inside it
let moreEl = null;          // the "More below" cue under a list that scrolls
let stylesInjected = false;

// The open menu: its entries, options, and what was true when it opened (for the tick)
let rows = [];              // [{ c, btn, detailEl, baseDetail, greyed }]
let menuOpts = null;
let unregisterModal = null;
let openedRoom = null;
let openedInFight = false;
let lastTick = 0;
let roomSubscribed = false;
let lastPlacement = null;   // the last phone placement: { covered, cover, avoid }
/** The last phone placement (for tests and live checks) */
export function getLastMenuPlacement() { return lastPlacement; }
const TICK_MS = 250;

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
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            min-width: 160px;
            max-width: min(80vw, 340px);
            max-height: calc(100vh - 24px);
            background: rgba(0, 0, 0, 0.82);
            border: 2px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.6);
            padding: 4px;
            font-family: 'GNF', monospace;
            color: #ffffff;
            image-rendering: pixelated;
        }
        #be-interaction-menu .be-im-head {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: none;
            padding: 2px 2px 4px 8px;
        }
        #be-interaction-menu .be-im-title {
            flex: 1;
            min-width: 0;
            font-family: 'GNF', monospace;
            font-size: 13px;
            line-height: 1.4;
            text-transform: uppercase;
            color: #4da6ff;
            padding: 4px 0;
        }
        #be-interaction-menu .be-im-close-wrap {
            flex: none;
            display: flex;
            cursor: pointer;
        }
        /* A touch menu's X gets a 44 x 44 hit area; the frame round it does not grow */
        #be-interaction-menu-overlay.be-im-touch .be-im-close-wrap {
            padding: 6px;
            margin: -6px;
        }
        #be-interaction-menu .be-im-close {
            position: static;
            flex: none;
            box-sizing: border-box;
            width: 32px;
            height: 32px;
            top: auto;
            right: auto;
            font-family: 'Press Start 2P', monospace;
            font-size: 14px;
            line-height: 1;
        }
        #be-interaction-menu .be-im-list {
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
        }
        #be-interaction-menu .be-im-more {
            flex: none;
            font-size: 13px;
            line-height: 1.4;
            text-align: center;
            color: #9fb0c4;
            padding: 4px 0 0;
        }
        #be-interaction-menu .be-im-more[hidden] { display: none; }
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
        #be-interaction-menu .be-im-item.be-im-disabled,
        #be-interaction-menu .be-im-item.be-im-disabled:hover,
        #be-interaction-menu .be-im-item.be-im-disabled:active {
            background: transparent;
            border-color: transparent;
            cursor: default;
            opacity: 0.55;
        }
        #be-interaction-menu .be-im-icon {
            flex: 0 0 auto;
            width: 64px;
            height: 64px;
            overflow: hidden;
            image-rendering: pixelated;
            background-repeat: no-repeat;
        }
        #be-interaction-menu .be-im-key {
            flex: 0 0 auto;
            font-size: 16px;
            color: #4da6ff;
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
        /* The detail wraps to as many lines as it needs, never clipped: it is often the
           fact that tells two entries apart (Copy keeps the card where it is, Take
           removes it), and with a 64px icon in the row a two-line clamp cut it off
           (UX slice 3a R1 M1). A tall menu scrolls its list (.be-im-list above). */
        #be-interaction-menu .be-im-detail {
            display: block;
            font-size: 16px;
            line-height: 1.5;
            color: #9fb0c4;
            margin-top: 6px;
            white-space: normal;
            overflow-wrap: anywhere;
        }
    `;
    document.head.appendChild(style);
}

export function isInteractionMenuOpen() {
    return overlayEl !== null;
}

export function closeInteractionMenu() {
    if (overlayEl) {
        // Focus inside the menu goes nowhere: the canvas has no tabindex and the game reads
        // its keys from the document
        try {
            const active = document.activeElement;
            if (active && overlayEl.contains(active)) active.blur?.();
        } catch (e) { /* no focus to drop */ }
        overlayEl.remove();
        overlayEl = null;
        menuEl = null;
        listEl = null;
        moreEl = null;
        rows = [];
        menuOpts = null;
        numberKeyHandlers = null;
        document.removeEventListener('keydown', onKeyDown, true);
        const un = unregisterModal;
        unregisterModal = null;
        if (un) un();
    }
}

// Number keys pick an entry in a menu opened with { numberKeys: true } (null otherwise).
let numberKeyHandlers = null;

// What can take the focus, in Tab order: the usable entries, then the X
function focusables() {
    const list = rows.filter(r => !r.c.disabled && !r.greyed).map(r => r.btn);
    const x = menuEl?.querySelector('.be-im-close');
    return x ? [...list, x] : list;
}

function moveFocus(list, step, from = document.activeElement) {
    if (!list.length) return;
    const i = list.indexOf(from);
    const next = i === -1 ? (step > 0 ? 0 : list.length - 1) : (i + step + list.length) % list.length;
    focusEl(list[next]);
}

function focusEl(el) {
    if (!el) return;
    try { el.focus({ preventScroll: false }); } catch (e) { el.focus?.(); }
}

function onKeyDown(e) {
    if (e.key === 'Escape') {
        // A menu on the modal stack (holdKeys) is closed by the stack's own Esc
        if (unregisterModal) return;
        e.preventDefault();
        e.stopPropagation();
        closeInteractionMenu();
        return;
    }
    if (numberKeyHandlers && /^[1-9]$/.test(e.key)) {
        const pick = numberKeyHandlers[Number(e.key) - 1];
        if (pick) {
            e.preventDefault();
            e.stopPropagation();
            pick(e);
        }
        return;
    }
    if (!menuOpts?.keyboard) return;
    const entries = rows.filter(r => !r.c.disabled && !r.greyed).map(r => r.btn);
    const take = () => { e.preventDefault(); e.stopPropagation(); };
    switch (e.key) {
        case 'ArrowDown': take(); moveFocus(entries, 1); return;
        case 'ArrowUp': take(); moveFocus(entries, -1); return;
        case 'Home': take(); focusEl(entries[0]); return;
        case 'End': take(); focusEl(entries[entries.length - 1]); return;
        case 'Tab': take(); moveFocus(focusables(), e.shiftKey ? -1 : 1); return;
        case 'Enter':
        case ' ':
        case 'Spacebar': {
            const active = document.activeElement;
            if (!active || !menuEl?.contains(active)) return;
            take();
            if (e.repeat) return;
            active.click();
            return;
        }
        default:
    }
}

// The scroll cue shows while entries sit below the list's visible part
function updateMoreCue() {
    if (!listEl || !moreEl) return;
    const below = listEl.scrollHeight - listEl.clientHeight - listEl.scrollTop > 2;
    moreEl.hidden = !below;
}

function setGreyed(row, reason) {
    if (row.c.disabled) return; // authored greyed entries keep their own reason
    const greyed = !!reason;
    if (greyed === row.greyed && (!greyed || row.detailEl?.textContent === reason)) return;
    row.greyed = greyed;
    row.btn.classList.toggle('be-im-disabled', greyed);
    if (greyed) row.btn.setAttribute('aria-disabled', 'true');
    else row.btn.removeAttribute('aria-disabled');
    if (!row.detailEl) {
        row.detailEl = document.createElement('span');
        row.detailEl.className = 'be-im-detail';
        row.btn.querySelector('.be-im-text')?.appendChild(row.detailEl);
    }
    row.detailEl.textContent = greyed ? reason : displayDashes(row.baseDetail || '');
    row.detailEl.hidden = !greyed && !row.baseDetail;
    if (greyed && document.activeElement === row.btn) {
        const next = focusables()[0];
        if (next) focusEl(next); else row.btn.blur?.();
    }
}

function entryReason(c) {
    if (typeof c.check !== 'function') return null;
    try { return c.check() || null; } catch (e) { return 'Gone.'; }
}

/**
 * The open menu's checks, from the scene's update(), at most every 250 ms: the whole menu
 * closes when the player changes room, is knocked out, or a fight starts in a menu opened
 * outside one; an entry whose target has gone or left reach is greyed with the reason, and
 * the menu closes when no usable entry is left. Entries without `check` (tray and action
 * menus) only meet the whole-menu checks.
 */
export function tickInteractionMenu(now = Date.now(), { force = false } = {}) {
    if (!overlayEl) return;
    if (!force && now - lastTick < TICK_MS) return;
    lastTick = now;
    const w = typeof window !== 'undefined' ? window : {};
    if (openedRoom !== null && w.currentPlayerRoom !== openedRoom) { closeInteractionMenu(); return; }
    if (w.playerIsKnockedOut?.()) { closeInteractionMenu(); return; }
    if (!openedInFight && w.roomHasActiveHostile?.()) { closeInteractionMenu(); return; }
    let usable = 0;
    for (const row of rows) {
        if (row.c.disabled) continue;
        setGreyed(row, entryReason(row.c));
        if (!row.greyed) usable++;
    }
    if (rows.length && usable === 0 && rows.some(r => r.greyed)) closeInteractionMenu();
}

// The player changing room closes the menu (subscribed once per page, on the first open
// that finds the event dispatcher)
function subscribeRoomChange() {
    if (roomSubscribed) return;
    const dispatcher = typeof window !== 'undefined' ? window.eventDispatcher : null;
    if (!dispatcher?.on) return;
    roomSubscribed = true;
    dispatcher.on('room_entered', () => { if (overlayEl) closeInteractionMenu(); });
}

/**
 * Where a touch menu goes so it does not cover the things tapped (overlap plan 6.3). `avoid` is
 * the UNION of every tapped thing's screen rect (client px: left, top, right, bottom). The menu
 * keeps `margin` px clear of it (and of the screen edge): beside it on the side with more room,
 * level with it; else above or below, whichever has more room. When no place is clear (a union
 * taller than the screen, say) the place that covers the least of the box is used and the result
 * says so: `covered` is true and `cover` is the px area still under the menu.
 *
 * @param {{width:number,height:number}} rect - the menu's size
 * @param {{width:number,height:number}} view - the viewport
 * @param {{left:number,top:number,right:number,bottom:number}} avoid
 * @param {number} [margin=8] - clearance in client px (8 times the HUD zoom, at least 8)
 * @returns {?{x:number,y:number,covered:boolean,cover:number}}
 */
export function menuPlacement(rect, view, avoid, margin = 8) {
    if (!rect || !view || !avoid) return null;
    margin = Math.max(8, Number.isFinite(margin) ? margin : 8);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
    const maxX = view.width - rect.width - margin;
    const maxY = view.height - rect.height - margin;
    const cx = (v) => (maxX >= margin ? clamp(v, margin, maxX) : Math.max(0, (view.width - rect.width) / 2));
    const cy = (v) => (maxY >= margin ? clamp(v, margin, maxY) : Math.max(0, (view.height - rect.height) / 2));
    const midY = (avoid.top + avoid.bottom) / 2;
    const midX = (avoid.left + avoid.right) / 2;
    const coverOf = (x, y) => {
        const w = Math.min(x + rect.width, avoid.right) - Math.max(x, avoid.left);
        const h = Math.min(y + rect.height, avoid.bottom) - Math.max(y, avoid.top);
        return w > 0 && h > 0 ? w * h : 0;
    };
    const done = (x, y) => { const cover = coverOf(x, y); return { x, y, covered: cover > 0, cover }; };

    // Beside, then above or below: the first kind with room, the side with more room within it
    const roomL = avoid.left - margin - margin;
    const roomR = view.width - avoid.right - margin - margin;
    const sides = [];
    if (roomL >= rect.width) sides.push({ room: roomL, x: avoid.left - margin - rect.width });
    if (roomR >= rect.width) sides.push({ room: roomR, x: avoid.right + margin });
    if (sides.length) {
        sides.sort((a, b) => b.room - a.room);
        return done(sides[0].x, cy(midY - rect.height / 2));
    }
    const roomU = avoid.top - margin - margin;
    const roomD = view.height - avoid.bottom - margin - margin;
    const rows = [];
    if (roomU >= rect.height) rows.push({ room: roomU, y: avoid.top - margin - rect.height });
    if (roomD >= rect.height) rows.push({ room: roomD, y: avoid.bottom + margin });
    if (rows.length) {
        rows.sort((a, b) => b.room - a.room);
        return done(cx(midX - rect.width / 2), rows[0].y);
    }

    // Nowhere clear: the least-cover spot among the four sides and the corners, clamped on screen
    const spots = [
        [avoid.left - margin - rect.width, midY - rect.height / 2],
        [avoid.right + margin, midY - rect.height / 2],
        [midX - rect.width / 2, avoid.top - margin - rect.height],
        [midX - rect.width / 2, avoid.bottom + margin],
        [margin, margin], [maxX, margin], [margin, maxY], [maxX, maxY]
    ];
    let best = null;
    for (const [x, y] of spots) {
        const c = done(cx(x), cy(y));
        if (!best || c.cover < best.cover) best = c;
    }
    return best;
}

/**
 * The menu, for a tap near several things (core/game.js), a choice of actions on one
 * world object (systems/action-menu.js) or the actions on one held item (the inventory
 * click menu, systems/inventory-menu.js). A disabled entry is shown greyed with its
 * `detail` as the reason, and choosing it does nothing. The X, Esc or a tap outside
 * closes it.
 *
 * An entry's `check()` (optional) returns null while its target is usable, or the reason
 * it is not ("Gone.", "Out of reach."): the tick greys it, and choosing re-checks.
 * An icon is a plain image, one sheet frame, an exact-size image (`width`, `height`, and
 * `position` when it is cropped), or `apply(box)` which draws into the box itself (an NPC
 * headshot, ui/menu-icons.js).
 *
 * @param {Array<{label:string, detail?:string, disabled?:boolean, kind?:string, entityId?:string, check?:Function, icon?:{src?:string, frame?:number, cols?:number, cell?:number, width?:number, height?:number, position?:string, apply?:Function}, onSelect:Function}>} candidates
 * @param {number} clientX - viewport X of the tap (event.clientX)
 * @param {number} clientY - viewport Y of the tap (event.clientY)
 * @param {string} [titleText] - the heading (default "Interact with…"; the item's name for a held item)
 * @param {{numberKeys?: boolean, keyboard?: boolean, touch?: boolean, holdKeys?: boolean, avoid?: {left:number,top:number,right:number,bottom:number}}} [opts]
 *   numberKeys: keys 1 to 9 pick an entry; keyboard: arrows, Home, End, Enter, Space and Tab
 *   inside the menu, focus on the first entry; touch: opened by a finger (no focus, no key
 *   hints); holdKeys: on the modal stack, so the game's keys are held and Esc closes it there
 */
export function showInteractionMenu(candidates, clientX, clientY, titleText,
    { numberKeys = false, keyboard = false, touch = false, holdKeys = false, avoid = null } = {}) {
    if (!candidates || candidates.length === 0) return;
    injectStyles();
    closeInteractionMenu(); // never stack two menus

    menuOpts = { numberKeys, keyboard, touch, holdKeys };
    const showHints = numberKeys && !touch;

    overlayEl = document.createElement('div');
    overlayEl.id = 'be-interaction-menu-overlay';
    if (touch) overlayEl.classList.add('be-im-touch');

    menuEl = document.createElement('div');
    menuEl.id = 'be-interaction-menu';

    // Title row: the heading and the X (no Cancel entry)
    const head = document.createElement('div');
    head.className = 'be-im-head';
    const title = document.createElement('div');
    title.className = 'be-im-title';
    title.textContent = displayDashes(titleText || 'Interact with…');
    head.appendChild(title);
    const closeWrap = document.createElement('span');
    closeWrap.className = 'be-im-close-wrap';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'game-modal-close be-im-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeWrap.appendChild(closeBtn);
    closeWrap.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeInteractionMenu();
    });
    head.appendChild(closeWrap);
    menuEl.appendChild(head);

    listEl = document.createElement('div');
    listEl.className = 'be-im-list pixel-scroll';
    listEl.setAttribute('role', 'menu');
    menuEl.appendChild(listEl);

    const handlers = [];
    let firstEnabled = null;

    candidates.forEach(c => {
        const btn = document.createElement('button');
        btn.className = c.disabled ? 'be-im-item be-im-disabled' : 'be-im-item';
        btn.setAttribute('role', 'menuitem');
        if (c.disabled) btn.setAttribute('aria-disabled', 'true');
        btn.type = 'button';
        // What the entry is, for the test bridge (systems/test-bridge/state.js interactionMenuState)
        btn.dataset.kind = c.kind || 'action';
        if (c.entityId) btn.dataset.entityId = String(c.entityId);

        // Icon: a plain image, or one frame cropped from a sprite sheet, scaled up
        // to the 64px display box (DISPLAY/cell). Both the sheet and the frame
        // offsets are scaled together so the crop stays aligned.
        if (c.icon && (c.icon.src || typeof c.icon.apply === 'function')) {
            const DISPLAY = 64;
            const icon = document.createElement('span');
            icon.className = 'be-im-icon';
            if (typeof c.icon.apply === 'function') {
                // The icon draws itself (an NPC headshot that loads, or its silhouette)
                try { c.icon.apply(icon); } catch (e) { /* no picture: the box stays empty */ }
            } else {
                icon.style.backgroundImage = `url("${c.icon.src}")`;
                if (Number.isInteger(c.icon.frame)) {
                    const cols = c.icon.cols || 4;
                    const cell = c.icon.cell || 32;
                    const scale = DISPLAY / cell;
                    const col = c.icon.frame % cols;
                    const row = Math.floor(c.icon.frame / cols);
                    icon.style.backgroundSize = `${cols * cell * scale}px auto`;
                    icon.style.backgroundPosition = `-${col * cell * scale}px -${row * cell * scale}px`;
                } else if (Number.isInteger(c.icon.width) && Number.isInteger(c.icon.height)) {
                    // A small image drawn at an exact size the caller picked (a whole-number
                    // multiple of its pixels), centred in the box, so it is never scaled by
                    // a fraction the way 'contain' would scale it. A world sprite at 2x
                    // brings its own position: the middle columns and the top rows (D8).
                    icon.style.backgroundSize = `${c.icon.width}px ${c.icon.height}px`;
                    icon.style.backgroundPosition = c.icon.position || 'center';
                } else {
                    icon.style.backgroundSize = 'contain';
                    icon.style.backgroundPosition = '0 0';
                }
            }
            btn.appendChild(icon);
        }

        // The key that picks it (keys 1 to 9), shown before the label as the chat choices show
        // theirs; a menu opened by a finger shows none
        const index = handlers.length;
        if (showHints && index < 9) {
            const keyHint = document.createElement('span');
            keyHint.className = 'be-im-key';
            keyHint.setAttribute('aria-hidden', 'true');
            keyHint.textContent = `${index + 1}.`;
            btn.appendChild(keyHint);
        }

        const text = document.createElement('span');
        text.className = 'be-im-text';

        const label = document.createElement('span');
        label.className = 'be-im-label';
        label.textContent = displayDashes(c.label);
        text.appendChild(label);

        let detailEl = null;
        if (c.detail) {
            detailEl = document.createElement('span');
            detailEl.className = 'be-im-detail';
            detailEl.textContent = displayDashes(c.detail);
            text.appendChild(detailEl);
        }

        btn.appendChild(text);
        const rowRec = { c, btn, detailEl, baseDetail: c.detail || null, greyed: false };

        const choose = (e) => {
            e?.preventDefault?.();
            e?.stopPropagation?.();
            if (c.disabled || rowRec.greyed) return; // greyed: its reason is on the button, the menu stays
            // The target may have gone since the last tick
            const reason = entryReason(c);
            closeInteractionMenu();
            if (reason) {
                const msg = reason === 'Out of reach.' ? "Can't reach it from here." : "That's no longer there.";
                window.gameAlert?.(msg, 'info', '', 2500);
                return;
            }
            try {
                c.onSelect();
            } catch (err) {
                console.error('[InteractionMenu] onSelect failed:', err);
            }
        };
        // pointerup fires reliably on both touch and mouse without the 300ms delay
        btn.addEventListener('click', choose);
        listEl.appendChild(btn);
        handlers.push(choose);
        rows.push(rowRec);
        if (!c.disabled && !firstEnabled) firstEnabled = btn;
    });
    numberKeyHandlers = numberKeys ? handlers : null;

    moreEl = document.createElement('div');
    moreEl.className = 'be-im-more';
    moreEl.setAttribute('aria-hidden', 'true');
    moreEl.textContent = 'More below';
    moreEl.hidden = true;
    menuEl.appendChild(moreEl);
    listEl.addEventListener('scroll', updateMoreCue);

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

    // What the tick compares against (7.1)
    const w = typeof window !== 'undefined' ? window : {};
    openedRoom = w.currentPlayerRoom ?? null;
    openedInFight = !!w.roomHasActiveHostile?.();
    lastTick = Date.now();
    subscribeRoomChange();

    // On the modal stack the game's keys are held, Esc closes through the stack, and any
    // later overlay (a confirm) closes this menu first (D11)
    if (holdKeys) unregisterModal = registerModal(closeInteractionMenu, { yieldsToNext: true });

    // A keyboard menu (numberKeys or keyboard) takes the focus on its first usable entry, so Tab,
    // Enter and Space reach it as well as the number keys; a finger-opened one focuses nothing
    if ((numberKeys || keyboard) && !touch && firstEnabled) {
        try { firstEnabled.focus({ preventScroll: true }); } catch (e) { firstEnabled.focus?.(); }
    }

    // Position near the tap, then clamp inside the viewport. Bias the menu
    // upward/leftward of the finger so it isn't hidden under the player's thumb.
    // A click with no pointer (el.click(), a key on a focused element) reports 0,0:
    // that is no position, so the menu goes to the middle rather than the corner.
    if (clientX === 0 && clientY === 0) { clientX = undefined; clientY = undefined; }
    const margin = 8;
    const rect = menuEl.getBoundingClientRect();
    let x = (clientX ?? window.innerWidth / 2) - rect.width / 2;
    let y = (clientY ?? window.innerHeight / 2) - rect.height - 16;

    // On a phone the menu goes beside the tapped things, not over them (overlap plan 6.3)
    let placed = false;
    if (touch && avoid) {
        const hudZoom = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--hud-zoom')) || 1;
        const spot = menuPlacement(rect, { width: window.innerWidth, height: window.innerHeight }, avoid, margin * Math.max(1, hudZoom));
        if (spot) {
            x = spot.x; y = spot.y;
            // Recorded for the tests: whether the menu is clear of the tapped things
            menuEl.dataset.placement = spot.covered ? 'least-cover' : 'clear';
            lastPlacement = { covered: spot.covered, cover: spot.cover, avoid: { ...avoid } };
            placed = true;
        }
    }

    if (!placed) {   // a phone placement is already clear of the tapped things and on screen
        if (x + rect.width + margin > window.innerWidth) x = window.innerWidth - rect.width - margin;
        if (x < margin) x = margin;
        if (y < margin) y = (clientY ?? 0) + 16; // not enough room above — drop below the tap
        if (y + rect.height + margin > window.innerHeight) y = window.innerHeight - rect.height - margin;
        if (y < margin) y = margin;
    }

    menuEl.style.left = `${Math.round(x)}px`;
    menuEl.style.top = `${Math.round(y)}px`;
    updateMoreCue();
}

// Global access (mirrors the other UI helpers in this codebase)
window.showInteractionMenu = showInteractionMenu;

// Menu icons shared by every menu: core/game.js imports them, and systems/action-menu.js
// (no static imports) reads them from window. The hand sheet is a 4x4 grid of 32px
// frames (frame 0 = open hand, frame 6 = fist/jab), matching the HUD toggle; the menu
// draws it x2 in its 64px box.
export function menuIconsBase() {
    const assetsPath = (typeof window !== 'undefined' && window.breakEscapeConfig?.assetsPath) || '/break_escape/assets';
    return `${assetsPath}/icons`;
}
export function openHandIcon() { return { src: `${menuIconsBase()}/hand_frames.png`, frame: 0, cols: 4, cell: 32 }; }
export function jabHandIcon()  { return { src: `${menuIconsBase()}/hand_frames.png`, frame: 6, cols: 4, cell: 32 }; }
export function talkIcon()     { return { src: `${menuIconsBase()}/talk.png` }; }
window.menuIcons = { openHand: openHandIcon, jabHand: jabHandIcon, talk: talkIcon };
window.closeInteractionMenu = closeInteractionMenu;
window.tickInteractionMenu = tickInteractionMenu;
window.isInteractionMenuOpen = isInteractionMenuOpen;
window.getLastMenuPlacement = getLastMenuPlacement;

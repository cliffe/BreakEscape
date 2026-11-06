/**
 * test-bridge/input.js — synthetic input injection.
 *
 * Every function here produces a REAL DOM event at the same place a human's
 * event lands. Nothing in this file calls game logic directly. If you find
 * yourself wanting to add `player.setPosition(...)` or
 * `dialogueManager.open(npc)` here, you are defeating the purpose of the
 * bridge — see docs/test-bridge.md, "Input simulation".
 *
 * Two injection points, mirroring the two the game actually listens on:
 *
 *   Keyboard → document.dispatchEvent(new KeyboardEvent(...))
 *              player.js setupKeyboardInput() binds keydown/keyup on `document`;
 *              person-chat binds keydown on `window` (which document events
 *              bubble to). Both therefore see synthetic keys as real ones.
 *
 *   Pointer  → canvas.dispatchEvent(new PointerEvent(...))
 *              game.js binds scene.input.on('pointerdown'), and Phaser's input
 *              plugin reads native pointer events off the canvas element.
 */

/**
 * Resolve the main game Scene.
 *
 * Careful: `window.game` starts life as the Phaser.Game instance (main.js) but
 * is reassigned to the Scene once create() runs, so at any point after startup
 * `window.game` is a Scene, not a Game. Handle both rather than assuming
 * either — `window.game.scene.scenes[0]` is undefined on a Scene and silently
 * yields a null camera.
 */
export function getScene() {
    const g = window.game;
    if (!g) return null;
    if (g.cameras?.main) return g;                 // already a Scene
    const list = g.scene?.scenes;                  // a Phaser.Game
    if (Array.isArray(list) && list.length) return list[0];
    return null;
}

/** Resolve the underlying Phaser.Game, whichever form window.game is in. */
export function getCoreGame() {
    const g = window.game;
    if (!g) return null;
    return g.sys?.game || (g.scene?.scenes ? g : null);
}

/** Resolve the Phaser canvas element. */
export function getCanvas() {
    return getCoreGame()?.canvas || document.querySelector('#game-container canvas');
}

/**
 * Convert world coordinates to viewport (client) coordinates.
 *
 * The game size flexes around 640x480 and is upscaled by an integer number of
 * device pixels chosen at runtime (main.js applyPixelPerfectScale). Rather than
 * reading that zoom directly, derive the scale from the canvas's rendered CSS
 * size versus the camera's logical size — that stays correct across zoom
 * changes, fullscreen, and browser resizes.
 */
export function worldToClient(worldX, worldY) {
    const canvas = getCanvas();
    const scene = getScene();
    if (!canvas || !scene) return null;

    const cam = scene.cameras.main;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / cam.width;
    const scaleY = rect.height / cam.height;

    return {
        clientX: rect.left + (worldX - cam.scrollX) * scaleX,
        clientY: rect.top + (worldY - cam.scrollY) * scaleY
    };
}

/** True if a world point currently falls inside the visible camera viewport. */
export function isWorldPointOnScreen(worldX, worldY) {
    const scene = getScene();
    if (!scene) return false;
    const cam = scene.cameras.main;
    const sx = worldX - cam.scrollX;
    const sy = worldY - cam.scrollY;
    return sx >= 0 && sy >= 0 && sx <= cam.width && sy <= cam.height;
}

const KEY_CODES = {
    ' ': 'Space', 'e': 'KeyE', 'w': 'KeyW', 'a': 'KeyA', 's': 'KeyS', 'd': 'KeyD',
    'shift': 'ShiftLeft', 'escape': 'Escape', 'enter': 'Enter', '`': 'Backquote',
    'arrowup': 'ArrowUp', 'arrowdown': 'ArrowDown',
    'arrowleft': 'ArrowLeft', 'arrowright': 'ArrowRight'
};

function codeFor(key) {
    const lower = String(key).toLowerCase();
    if (KEY_CODES[lower]) return KEY_CODES[lower];
    if (/^[0-9]$/.test(key)) return `Digit${key}`;
    if (/^[a-z]$/.test(lower)) return `Key${lower.toUpperCase()}`;
    return key;
}

function keyEventInit(key) {
    const lower = String(key).toLowerCase();
    return {
        key: key,
        code: codeFor(key),
        keyCode: key === ' ' ? 32 : key.toUpperCase().charCodeAt(0),
        which: key === ' ' ? 32 : key.toUpperCase().charCodeAt(0),
        shiftKey: lower === 'shift',
        bubbles: true,
        cancelable: true,
        composed: true
    };
}

/** Dispatch a real keydown on document. */
export function keyDown(key) {
    document.dispatchEvent(new KeyboardEvent('keydown', keyEventInit(key)));
}

/** Dispatch a real keyup on document. */
export function keyUp(key) {
    document.dispatchEvent(new KeyboardEvent('keyup', keyEventInit(key)));
}

/**
 * Press and release a key, holding it for `holdMs`.
 * Held for at least one frame so the game's update() loop observes the
 * key-down state rather than seeing it appear and vanish between ticks.
 */
export async function pressKey(key, holdMs = 60) {
    keyDown(key);
    await sleepFrames(Math.max(1, Math.round(holdMs / 16)));
    keyUp(key);
}

function pointerEventInit(clientX, clientY, extra = {}) {
    return {
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons: 1,
        clientX, clientY,
        screenX: clientX, screenY: clientY,
        // Phaser 3.60's Pointer reads pageX/pageY, not clientX/clientY.
        // Omitting these leaves the pointer at a bogus position and the
        // scene-level pointerdown never resolves to the intended world point.
        pageX: clientX + window.scrollX,
        pageY: clientY + window.scrollY,
        bubbles: true,
        cancelable: true,
        composed: true,
        ...extra
    };
}

/**
 * Dispatch a real pointerdown/pointerup pair on the game canvas at the given
 * WORLD coordinates. This is the single entry point for all main-world
 * pointer actions: it lands in game.js's scene.input.on('pointerdown')
 * handler, which is the game's own master interaction router (punch mode,
 * disambiguation menu, NPC/object/door in-range interact vs walk-toward,
 * fallthrough to click-to-move).
 */
export async function clickWorld(worldX, worldY, { holdMs = 50 } = {}) {
    const canvas = getCanvas();
    const pt = worldToClient(worldX, worldY);
    if (!canvas || !pt) return false;

    // Phaser 3.60's MouseManager binds mousemove/mousedown/mouseup — NOT
    // pointerdown. Dispatching only PointerEvents here looks correct and is
    // silently ignored by the engine: the DOM event fires, the scene's
    // pointerdown handler never runs, and the player simply does not move.
    // Send the mouse events Phaser actually listens for, and the matching
    // pointer events too so any non-Phaser listener sees a normal click.
    const move = pointerEventInit(pt.clientX, pt.clientY, { buttons: 0 });
    const down = pointerEventInit(pt.clientX, pt.clientY);
    const up = pointerEventInit(pt.clientX, pt.clientY, { buttons: 0 });

    canvas.dispatchEvent(new PointerEvent('pointermove', move));
    canvas.dispatchEvent(new MouseEvent('mousemove', move));
    await sleepFrames(1);

    canvas.dispatchEvent(new PointerEvent('pointerdown', down));
    canvas.dispatchEvent(new MouseEvent('mousedown', down));
    await sleepFrames(Math.max(1, Math.round(holdMs / 16)));

    canvas.dispatchEvent(new PointerEvent('pointerup', up));
    canvas.dispatchEvent(new MouseEvent('mouseup', up));
    return true;
}

/**
 * Dispatch a real click on a DOM element (minigame overlays are plain HTML).
 * Uses a full pointerdown/mousedown/mouseup/click sequence so handlers bound
 * to any of those all fire, as they would for a human click.
 */
export function clickElement(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    el.dispatchEvent(new PointerEvent('pointerdown', pointerEventInit(cx, cy)));
    el.dispatchEvent(new MouseEvent('mousedown', pointerEventInit(cx, cy)));
    el.dispatchEvent(new PointerEvent('pointerup', pointerEventInit(cx, cy, { buttons: 0 })));
    el.dispatchEvent(new MouseEvent('mouseup', pointerEventInit(cx, cy, { buttons: 0 })));
    el.dispatchEvent(new MouseEvent('click', pointerEventInit(cx, cy, { buttons: 0 })));
    return true;
}

/**
 * Type into a text input/textarea the way a human would: focus, then per
 * character fire keydown, set the value, fire input, fire keyup. Minigames
 * that validate on 'input' or on 'keydown' both see what they expect.
 */
export async function typeInto(el, text, { perCharMs = 20 } = {}) {
    if (!el) return false;
    el.focus();
    for (const ch of String(text)) {
        el.dispatchEvent(new KeyboardEvent('keydown', { ...keyEventInit(ch), bubbles: true }));
        el.value = (el.value || '') + ch;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new KeyboardEvent('keyup', { ...keyEventInit(ch), bubbles: true }));
        if (perCharMs) await sleep(perCharMs);
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
}

/** Resolve after `n` rendered frames (requestAnimationFrame). */
export function sleepFrames(n = 1) {
    return new Promise(resolve => {
        let remaining = Math.max(1, n);
        const step = () => {
            remaining -= 1;
            if (remaining <= 0) resolve();
            else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    });
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

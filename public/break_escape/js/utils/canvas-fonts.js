// Web fonts that Phaser draws on the canvas (code review R1 m5). A browser downloads a web
// font only when a DOM element uses it, and canvas text does not count, so until a
// conversation or a text file opened, the NPC action icons' text stand-ins and the needs
// debug label drew in the fallback monospace. main.js asks for them before the game
// starts, and window.canvasFontsReady lets a text drawn before they arrive redraw once
// they have (npc-action-icons.js, npc-needs-debug.js), with no import.
// The @font-face rules come from the stylesheets show.html.erb links (text-file-minigame.css
// imports VT323).
export const CANVAS_FONTS = Object.freeze(["16px 'VT323'"]);

let ready = null;

/** Ask for every canvas font once; resolves when they have loaded (or failed: never rejects). */
export function loadCanvasFonts(doc = typeof document !== 'undefined' ? document : null) {
    if (ready) return ready;
    const fonts = doc?.fonts;
    ready = fonts?.load
        ? Promise.all(CANVAS_FONTS.map((f) => fonts.load(f))).then(() => true, () => false)
        : Promise.resolve(false);
    if (typeof window !== 'undefined') window.canvasFontsReady = ready;
    return ready;
}

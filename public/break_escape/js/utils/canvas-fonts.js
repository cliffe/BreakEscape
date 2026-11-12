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

// The @font-face rules arrive with the stylesheets' @imports, which can still be loading
// when the game boots; a load asked for before them matches no face and resolves at once
// with nothing fetched (seen live, game 1833). So wait for the page's load event first.
function stylesheetsLoaded(doc, w) {
    if (!doc || doc.readyState === 'complete' || typeof w?.addEventListener !== 'function') return Promise.resolve();
    return new Promise((resolve) => w.addEventListener('load', () => resolve(), { once: true }));
}

/**
 * Ask for every canvas font once; resolves true when each matched a face and loaded,
 * false otherwise (no face, a failed fetch, no font API). Never rejects.
 */
export function loadCanvasFonts(doc = typeof document !== 'undefined' ? document : null,
    w = typeof window !== 'undefined' ? window : null) {
    if (ready) return ready;
    const fonts = doc?.fonts;
    ready = fonts?.load
        ? stylesheetsLoaded(doc, w)
            .then(() => Promise.all(CANVAS_FONTS.map((f) => fonts.load(f))))
            .then((faces) => faces.every((list) => list && list.length > 0), () => false)
        : Promise.resolve(false);
    if (w) w.canvasFontsReady = ready;
    return ready;
}

/**
 * Theme colours for things drawn in the game world (Phaser) rather than in
 * HTML, such as NPC health bars. Each theme in css/ui-themes.css sets
 * --ui-bar-* colours; this reads them as Phaser colour numbers.
 */

const FALLBACK = {
    outline: 0x000000,
    frame: 0x666666,
    track: 0x333333,
    fill: 0xff0000,
    fillHi: 0xff7777,
};

function parse(value) {
    const v = (value || '').trim();
    const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
        const h = hex[1].length === 3 ? hex[1].replace(/./g, c => c + c) : hex[1];
        return parseInt(h, 16);
    }
    const rgb = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
    if (rgb) return (Number(rgb[1]) << 16) | (Number(rgb[2]) << 8) | Number(rgb[3]);
    return null;
}

/** The current theme's health bar colours, e.g. { outline, frame, track, fill, fillHi }. */
export function healthBarColours() {
    if (typeof document === 'undefined') return { ...FALLBACK };
    const cs = getComputedStyle(document.documentElement);
    const read = (name, key) => parse(cs.getPropertyValue(name)) ?? FALLBACK[key];
    return {
        outline: read('--ui-bar-outline', 'outline'),
        frame: read('--ui-bar-frame', 'frame'),
        track: read('--ui-bar-track', 'track'),
        fill: read('--ui-bar-fill', 'fill'),
        fillHi: read('--ui-bar-fill-hi', 'fillHi'),
    };
}

/**
 * Phone app look: the `app` block on a phone device (inventory item or room object).
 *
 *   "app": { "title": "Friendface", "theme": "social", "accent": "#3b5bdb",
 *            "chrome": "app", "logo": "friendface.png" }
 *
 * The look belongs to the device, because the contact list does. The NPC `phoneTheme`
 * stays as the fallback, so a phone with no `app` (the m02 and m07 terminals, every
 * handler phone) resolves exactly as it did before this module existed.
 *
 * Pure helpers, no DOM, so the tests can call them directly.
 */

export const APP_THEMES = ['social', 'terminal'];
export const APP_CHROMES = ['app'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A hex colour as 6 digits, or null. */
export function normaliseAccent(accent) {
    if (!isStr(accent) || !HEX.test(accent.trim())) return null;
    let h = accent.trim().slice(1).toLowerCase();
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return `#${h}`;
}

/** Black or white text for a background, by relative luminance. */
export function onAccentColour(hex) {
    const n = normaliseAccent(hex);
    if (!n) return '#ffffff';
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 0.45 ? '#111111' : '#ffffff';
}

/** A clean copy of an app block, or null when it is not one. Unknown values are dropped. */
export function normaliseApp(app) {
    if (!isObj(app)) return null;
    const out = {};
    if (isStr(app.title)) out.title = app.title.trim();
    if (APP_THEMES.includes(app.theme)) out.theme = app.theme;
    const accent = normaliseAccent(app.accent);
    if (accent) out.accent = accent;
    if (APP_CHROMES.includes(app.chrome)) out.chrome = app.chrome;
    if (isStr(app.logo) && /^[\w.-]+$/.test(app.logo.trim())) out.logo = app.logo.trim();
    return Object.keys(out).length ? out : null;
}

/** Every phone device in a scenario: inventory items and room objects. */
function* phoneDevices(scenario) {
    for (const item of Array.isArray(scenario?.startItemsInInventory) ? scenario.startItemsInInventory : []) {
        if (isObj(item) && item.type === 'phone') yield item;
    }
    const rooms = isObj(scenario?.rooms) ? Object.values(scenario.rooms) : [];
    for (const room of rooms) {
        for (const obj of Array.isArray(room?.objects) ? room.objects : []) {
            if (isObj(obj) && obj.type === 'phone') yield obj;
        }
    }
}

/** The app block of the first device carrying this phoneId, or null. */
export function findPhoneApp(scenario, phoneId) {
    if (!isStr(phoneId)) return null;
    for (const dev of phoneDevices(scenario)) {
        if (dev.phoneId === phoneId) {
            const app = normaliseApp(dev.app);
            if (app) return app;
        }
    }
    return null;
}

/**
 * Resolve the look for one chat. `params.app` (passed by the device that was opened) wins,
 * then the scenario's device with the same phoneId (a notification or a timed text opens a
 * chat with no device in hand), then the NPC `phoneTheme`.
 * @returns {{ app: object|null, theme: string|undefined }}
 */
export function resolvePhoneApp({ params = {}, npc = null, scenario = null } = {}) {
    const sc = scenario || (typeof window !== 'undefined' ? window.gameScenario : null);
    const phoneId = params.phoneId || npc?.phoneId || null;
    const app = normaliseApp(params.app) || findPhoneApp(sc, phoneId);
    const theme = app?.theme || params.theme || npc?.phoneTheme || undefined;
    return { app, theme };
}

/** Handle and profile link for a phone NPC. Both optional. */
export function npcDmFields(npc) {
    const handle = isStr(npc?.handle) ? npc.handle.trim() : null;
    const p = npc?.profile;
    const profile = isObj(p) && isStr(p.siteId) && isStr(p.person)
        ? { siteId: p.siteId.trim(), person: p.person.trim() } : null;
    return { handle, profile };
}

/** The minigameData that opens the OSINT browser at a person's profile. */
export function profileLaunch(profile) {
    return { start: `${profile.siteId}.${profile.person}` };
}

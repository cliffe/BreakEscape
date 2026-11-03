/**
 * cctv-feeds.js — the camera feeds for the visualiser's CCTV mode (bond-visualiser.js).
 *
 * Each feed is one of the scenario's room conversation backgrounds (a room's
 * "chatBackground": a path, or a list of views, every view its own camera),
 * labelled with the room. A scenario with no backgrounds gets the theme's
 * fallback images; with none of those either, the wall shows NO SIGNAL.
 * Pure (no DOM, no imports) so it can be unit tested.
 */

/** "conference_room_01" → "CONFERENCE ROOM 01" */
export function cctvRoomLabel(roomId) {
    return String(roomId || '').replace(/[_-]+/g, ' ').trim().toUpperCase();
}

/**
 * @param {Object} scenario - window.gameScenario
 * @param {Array<{label: string, image: string}>} [fallback] - the theme's feeds for a scenario without backgrounds
 * @returns {Array<{label: string, image: string}>} one entry per distinct image, in room order
 */
export function cctvFeeds(scenario, fallback = []) {
    const feeds = [];
    const seen = new Set();
    const add = (label, image) => {
        if (typeof image !== 'string' || !image.trim() || seen.has(image.trim())) return;
        seen.add(image.trim());
        feeds.push({ label, image: image.trim() });
    };
    for (const [roomId, room] of Object.entries(scenario?.rooms || {})) {
        const bg = room?.chatBackground;
        const label = cctvRoomLabel(roomId);
        if (typeof bg === 'string') add(label, bg);
        else if (Array.isArray(bg)) bg.forEach(v => add(label, v?.image));
    }
    if (!feeds.length) (fallback || []).forEach(f => add(f.label, f.image));
    return feeds;
}

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
 * @returns {Array<{label: string, image: string}>} one entry per distinct image: each room's
 *   first view in room order, then the rooms' other views, so the wall starts on different rooms
 */
export function cctvFeeds(scenario, fallback = []) {
    const feeds = [], extra = [];
    const seen = new Set();
    const add = (list, label, image) => {
        if (typeof image !== 'string' || !image.trim() || seen.has(image.trim())) return false;
        seen.add(image.trim());
        list.push({ label, image: image.trim() });
        return true;
    };
    for (const [roomId, room] of Object.entries(scenario?.rooms || {})) {
        const bg = room?.chatBackground;
        const label = cctvRoomLabel(roomId);
        const views = typeof bg === 'string' ? [bg] : Array.isArray(bg) ? bg.map(v => v?.image) : [];
        let first = true;
        views.forEach(image => { if (add(first ? feeds : extra, label, image)) first = false; });
    }
    feeds.push(...extra);
    if (!feeds.length) (fallback || []).forEach(f => add(feeds, f.label, f.image));
    return feeds;
}

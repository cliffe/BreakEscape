/**
 * Player-facing name for a room id: the door sign or room name from the scenario,
 * else the id with underscores turned into spaces and capitalised.
 * @param {string} roomId
 * @param {object} [scenario] - object with a `rooms` map (defaults to window.gameScenario)
 * @returns {string}
 */
export function getRoomDisplayName(roomId, scenario) {
    if (!roomId) return '';
    const sc = scenario || (typeof window !== 'undefined' ? window.gameScenario : null);
    const room = sc?.rooms?.[roomId];
    const named = room?.door_sign || room?.name;
    if (named) return named;
    return String(roomId)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

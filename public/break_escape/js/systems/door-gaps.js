/**
 * Registers the doorway provider interaction-walls.js uses for combat across an open door:
 * (roomId) => [{ to, direction, x, y }], from the engine's own door placement.
 */
import { calculateDoorPositionsForRoom } from './doors.js';
import { setDoorwayProvider } from './interaction-walls.js';

setDoorwayProvider((roomId) => {
    const scenario = window.gameScenario;
    const room = scenario?.rooms?.[roomId];
    const pos = window.roomPositions?.[roomId];
    const dims = window.roomDimensions?.[roomId];
    if (!room || !pos || !dims) return [];
    return calculateDoorPositionsForRoom(roomId, pos, dims, room.connections || {},
        window.roomPositions || {}, window.roomDimensions || {}, scenario)
        .map(d => ({ to: d.connectedRoom, direction: d.direction, x: d.x, y: d.y }));
});

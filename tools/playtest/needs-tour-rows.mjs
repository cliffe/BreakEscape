// Row 3 helpers for needs-tour-regression.mjs, kept apart so a node test can load them.
// The tour's emit hook records the event name as emitted, which carries the NPC id after a colon
// (`npc_turned_back:tom`, `npc_need_parked:marek`), so these match on the name before the colon.

const base = (ev) => String(ev || '').split(':')[0];

/** Who turned back at the switch-off (reason off), once each. A park is not a turn-back. */
export function turnedBackOff(afterOff) {
    return [...new Set(afterOff.filter(e => base(e.ev) === 'npc_turned_back' && e.reason === 'off').map(e => e.npcId))];
}

/** The parks (npc_need_parked) in the same window, listed apart. */
export function parksAfterOff(afterOff) {
    return afterOff.filter(e => base(e.ev) === 'npc_need_parked').map(e => ({ npc: e.npcId, reason: e.reason, at: Math.round(e.c / 1000) }));
}

/**
 * window.__test.access: read-only access model state for playtests
 * (docs/achitechture/ACCESS_MODEL_PLAN.md, step 6). Nothing here acts on the game: it only
 * reads what the client holds, so a scripted run can compare the browser's view with
 * what the server recorded (tools/playtest/verify-run.rb --access).
 *
 *   sessions()          the sign-in sessions systems/pc-sessions.js holds (empty until it exists)
 *   workstation(pcId)   owner, present, the away record, screenLocked and lockAt
 *   savedCards()        the card copier's saved_cards ids (client-written; never decides identity)
 *
 * All JSON in and out.
 */

import { isWorkstation, ownerOf } from '../workstation-state.js';

const json = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));

export const accessBridge = {
    /**
     * The client's session list, `[{ pcId, npcId, username, displayName, via }]`. Read from
     * `window.pcSessions` (systems/pc-sessions.js, access model step 8): its `list()` when it
     * has one, else its `sessions` map. Empty while the module does not exist.
     */
    sessions() {
        const mod = window.pcSessions;
        if (!mod) return [];
        if (typeof mod.list === 'function') return json(mod.list()) || [];
        const map = mod.sessions;
        const entries = map instanceof Map ? [...map.entries()]
            : (map && typeof map === 'object' ? Object.entries(map) : []);
        return entries.map(([pcId, s]) => ({ pcId, ...json(s) }));
    },

    /**
     * One workstation as workstation-state.js sees it: `{ ok, id, workstation, owner, present,
     * away, screenLocked, lockAt }`. `present` uses the env's `ownerPresent` when the module
     * has one (step 9), else today's rule (not away). `away` is the owner's away record
     * (`{ away, leaves, ... }`) or null. `workstation` is false for an object the module does
     * not treat as a workstation; the other fields are still read.
     */
    workstation(pcId) {
        const ws = window.workstationState;
        if (!ws || !ws.env) return { ok: false, reason: 'no-workstation-state' };
        const data = (ws.env.objects() || []).find(d => d?.id === pcId);
        if (!data) return { ok: false, reason: 'unknown-object', id: pcId };
        const owner = ownerOf(data, ws.env.npcs()) || null;
        const rec = owner && ws.away instanceof Map ? ws.away.get(owner) : undefined;
        let present = null;
        if (owner) {
            present = typeof ws.env.ownerPresent === 'function' ? !!ws.env.ownerPresent(owner) : !rec?.away;
        }
        return {
            ok: true,
            id: pcId,
            workstation: isWorkstation(data),
            owner,
            present,
            away: rec ? json(rec) : null,
            screenLocked: data.screenLocked === undefined ? null : !!data.screenLocked,
            lockAt: data.lockAt ?? rec?.lockAt ?? null
        };
    },

    /** The card copier's saved cards, as card ids (the copier's client-written list). */
    savedCards() {
        const items = window.inventory?.items || [];
        const cloner = items.find(item => item?.scenarioData?.type === 'rfid_cloner');
        const saved = cloner?.scenarioData?.saved_cards || [];
        return saved.map(card => card?.card_id
            || (typeof window.lockRef === 'function' ? window.lockRef(card) : null)
            || null);
    }
};

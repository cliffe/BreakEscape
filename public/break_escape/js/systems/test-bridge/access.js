/**
 * window.__test.access: read-only access model state for playtests
 * (docs/achitechture/ACCESS_MODEL_PLAN.md, step 6). Nothing here acts on the game: it only
 * reads what the client holds, so a scripted run can compare the browser's view with
 * what the server recorded (tools/playtest/verify-run.rb --access).
 *
 *   sessions()          the sign-in sessions systems/pc-sessions.js holds
 *   workstation(pcId)   owner, present, the away record, screenLocked and lockAt, and the
 *                       sprite's texture key and whether it shows the locked look
 *   screenTransitions() the screen look changes systems/screen-states.js recorded (last 50),
 *                       `[{ objectId, locked, sound, at }]`; every sound it plays is in there
 *   compromiseMarks()   the world's compromise marks (systems/compromise-marks.js), `[{ objectId, sources, tint }]`
 *   savedCards()        the card copier's saved_cards ids (client-written; never decides identity)
 *   footholds()         the footholds systems/network-links.js holds (slice 9.3a)
 *   hiddenDevices()     itemId -> { item, on, room, hostId? }: devices hidden in plants (plant-hiding.js);
 *                       hostId (the plant drawn on, set once drawn) is client-only, never sent
 *   networkView(id)     the last network view network-links.js fetched for that foothold
 *   work(npcId)         slice 9.2: the NPC's work plan (read only), frustration level and tell;
 *                       sub-slice L adds lockedOut (stations a check found it locked out at) and
 *                       lockCheck (checks in flight)
 *   reports()           slice 9.2: how many POST /npc_frustration requests and reports were sent;
 *                       sub-slice L adds checks (how many were queued) and lockoutSeen (the PCs
 *                       where a sign-in answered locked_out in this page); review R3 n2 adds
 *                       borrowLockoutSeen (the same PCs for the borrow path, which a station
 *                       "no" leaves alone) and borrowCleared (`pcId|npcId` keys of borrowers
 *                       whose "no" cleared the mark for them)
 *   feed()              slice 9.2 C: revealed feed post ids by NPC, done NPCs, request count;
 *                       C3: threads, { postId: [replyId, ...] } oldest first; reactions,
 *                       { postId: { key: [npcId, ...] } }
 *   guest(pcId)         slice 9.2 H: the guest a borrower left at a hot desk ({ npcId, lockAt }),
 *                       who is using the PC now, and the NPC's pending borrow, if any
 *
 * All JSON in and out.
 */

import { isWorkstation, ownerOf } from '../workstation-state.js';
import { findSprite } from '../screen-states.js';

const json = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));

export const accessBridge = {
    /**
     * Slice 9.2 (ACCESS_MODEL_SLICE_9_2_PLAN.md 11): `{ plan, frustration, tell, settled, failed,
     * parked }` for a needs NPC, `plan` being the server's `work` on its record (null without one).
     */
    work(npcId) {
        const rec = window.npcManager?.getNPC?.(npcId) || window.npcManager?.npcs?.get?.(npcId) || null;
        const st = window.npcNeedsSystem?.getState?.(npcId) || null;
        if (!rec && !st) return null;
        return json({ plan: rec?.work || null, frustration: st?.frustration ?? null, tell: st?.tell ?? null,
            settled: st?.settled ?? null, failed: st?.failed ?? null, parked: st?.parked ?? [],
            lockedOut: st?.lockedOut ?? [], lockCheck: st?.lockCheck ?? [] });
    },

    /**
     * Slice 9.2 H (ACCESS_MODEL_SLICE_9_2_PLAN.md 6.4): `{ ok, pcId, guest, userId, session }`.
     * `guest` is workstation-state.js's guest record at that PC (`{ npcId, lockAt }`, lockAt in
     * needs-clock ms or null) or null; `userId` the NPC using the PC now; `session` the session
     * the player holds there (pc-sessions.js), with `guest: true` for a guest claim.
     */
    guest(pcId) {
        const ws = window.workstationState;
        if (!ws) return { ok: false, reason: 'no-workstation-state' };
        // guestOf first applies a guest auto lock whose time has passed (review R1 n4)
        if (typeof ws.guestOf === 'function') ws.guestOf(pcId);
        const g = ws.guests instanceof Map ? ws.guests.get(pcId) : null;
        const s = window.pcSessions?.sessions?.get?.(pcId) || null;
        return json({
            ok: true, pcId,
            guest: g ? { npcId: g.npcId, lockAt: g.lockAt ?? null } : null,
            userId: window.npcNeedsSystem?.userOf?.(pcId) || null,
            session: s ? { npcId: s.npcId ?? null, via: s.via ?? null, guest: !!s.guest } : null
        });
    },

    /**
     * Slice 9.2 C (ACCESS_MODEL_SLICE_9_2_PLAN.md 8.3): `{ revealed, done, requests }` from
     * systems/social-feed.js: revealed post ids by NPC (oldest first), the NPCs whose feed is done,
     * and how many POST /feed_post requests were sent. Ids only, never a post's text.
     */
    feed() {
        const f = window.socialFeed;
        if (!f) return { revealed: {}, done: [], requests: 0, threads: {}, reactions: {} };
        // C3: { postId: [replyId, ...] } in thread order, for every revealed post with replies.
        // A null-prototype object, so no post id can reach a prototype key before json() copies it.
        const threads = Object.create(null);
        if (typeof f.repliesFor === 'function') {
            for (const ids of Object.values(f.revealed())) {
                for (const id of ids) {
                    const replies = f.repliesFor(id);
                    if (replies.length) threads[id] = replies.map((r) => r.post.id);
                }
            }
        }
        // Reactions: { postId: { key: [npcId, ...] } }, null-prototype objects throughout
        const reactions = Object.create(null);
        if (typeof f.reactionsFor === 'function' && f.reactions instanceof Map) {
            for (const postId of f.reactions.keys()) {
                const groups = f.reactionsFor(postId);
                if (!groups.length) continue;
                const byKey = Object.create(null);
                for (const g of groups) byKey[g.key] = g.people.map((p) => p.npcId);
                reactions[postId] = byKey;
            }
        }
        return json({ revealed: f.revealed(), done: [...f.done].sort(), requests: f.requests, threads, reactions });
    },

    /**
     * Slice 9.2: `{ requests, reports, pending, settled, checks, lockoutSeen, borrowLockoutSeen,
     * borrowCleared }` from systems/npc-reports.js.
     */
    reports() {
        const r = window.npcReports;
        if (!r) return { requests: 0, reports: 0, pending: 0, settled: [], checks: 0, lockoutSeen: [], borrowLockoutSeen: [], borrowCleared: [] };
        return { requests: r.requests, reports: r.sent, pending: r.pending.length, settled: [...r.settled].sort(),
            checks: r.checks || 0, lockoutSeen: [...(r.lockoutSeen || [])].sort(),
            borrowLockoutSeen: [...(r.borrowLockoutSeen || [])].sort(),
            borrowCleared: [...(r.borrowCleared?.keys?.() || [])].sort() };
    },

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
     * away, screenLocked, lockAt, texture, displayWidth, displayHeight, lockedLook }`.
     * `texture` is the live sprite's texture key. `displayWidth` and `displayHeight` are its
     * display size, which a swap must not change. All three are null while its room is not
     * loaded. `lockedLook` is whether screen-states.js has it showing the locked screen.
     * `present` uses the env's `ownerPresent` when the module has one (step 9), else
     * today's rule (not away). `away` is the owner's away record
     * (`{ away, leaves, ... }`) or null. `workstation` is false for an object the module does
     * not treat as a workstation; the other fields are still read.
     */
    workstation(pcId) {
        const ws = window.workstationState;
        if (!ws || !ws.env) return { ok: false, reason: 'no-workstation-state' };
        const data = (ws.env.objects() || []).find(d => d?.id === pcId);
        if (!data) return { ok: false, reason: 'unknown-object', id: pcId };
        const owner = ownerOf(data) || null;
        const rec = owner && ws.away instanceof Map ? ws.away.get(owner) : undefined;
        let present = null;
        if (owner) {
            present = typeof ws.env.ownerPresent === 'function' ? !!ws.env.ownerPresent(owner) : !rec?.away;
        }
        const sprite = findSprite(pcId)?.sprite || null;
        return {
            ok: true,
            id: pcId,
            workstation: isWorkstation(data),
            owner,
            present,
            away: rec ? json(rec) : null,
            screenLocked: data.screenLocked === undefined ? null : !!data.screenLocked,
            lockAt: data.lockAt ?? rec?.lockAt ?? null,
            texture: sprite?.texture?.key ?? null,
            displayWidth: sprite?.displayWidth ?? null,
            displayHeight: sprite?.displayHeight ?? null,
            lockedLook: !!sprite?._screenLocked
        };
    },

    /** The screen look changes recorded so far (empty before the module is installed). */
    screenTransitions() {
        return json(window.screenStates?.transitions) || [];
    },

    /**
     * The compromise marks applied in the world (systems/compromise-marks.js): `[{ objectId,
     * sources, tint }]`, where `tint` is the sprite's live tintTopLeft read now (null for a
     * sprite that keeps an authored look). Read it with the player out of range: in range the
     * live tint is the highlight's blue.
     */
    compromiseMarks() {
        return json(window.compromiseMarks?.list?.()) || [];
    },

    /** The card copier's saved cards, as card ids (the copier's client-written list). */
    savedCards() {
        const items = window.inventory?.items || [];
        const cloner = items.find(item => item?.scenarioData?.type === 'rfid_cloner');
        const saved = cloner?.scenarioData?.saved_cards || [];
        return saved.map(card => card?.card_id
            || (typeof window.lockRef === 'function' ? window.lockRef(card) : null)
            || null);
    },

    /**
     * The footholds the client holds, `[{ id, via, name, itemId, sourceId, network }]` (the
     * shape GET /scenario and POST /network/plant answer, ACCESS_MODEL_SLICE_9_3_PLAN.md
     * section 6). Read from `window.networkLinks` (systems/network-links.js, step 7): its
     * `list()` when it has one, else its `footholds` (a Map or an object keyed by foothold
     * id, or an array). Empty while the module does not exist.
     */
    hiddenDevices() {
        const mod = window.plantHiding;
        return mod ? json(mod.hiddenMap()) : {};
    },

    footholds() {
        const mod = window.networkLinks;
        if (!mod) return [];
        if (typeof mod.list === 'function') return json(mod.list()) || [];
        const held = mod.footholds;
        if (Array.isArray(held)) return json(held);
        const entries = held instanceof Map ? [...held.entries()]
            : (held && typeof held === 'object' ? Object.entries(held) : []);
        return entries.map(([id, f]) => ({ id, ...json(f) }));
    },

    /**
     * The last GET /network answer network-links.js fetched for a foothold: its entry
     * `{ id, via, name, network, hosts, networks, techniques }`, or null when none was fetched.
     * `networks` is the blocks (each with its rows, and `swept` and `ops` on an ops network);
     * `techniques` is the held cards' map, sent from S3 on (absent before). The whole entry is
     * returned as it stands, so a playtest can read `swept` and the rows with the view closed. Read from
     * `window.networkLinks`: its `lastView(footholdId)` when it has one, else its `views`
     * (a Map or an object keyed by foothold id).
     */
    networkView(footholdId) {
        const mod = window.networkLinks;
        if (!mod) return null;
        if (typeof mod.lastView === 'function') return json(mod.lastView(footholdId)) ?? null;
        const views = mod.views;
        if (views instanceof Map) return json(views.get(footholdId)) ?? null;
        return views && typeof views === 'object' ? (json(views[footholdId]) ?? null) : null;
    }
};

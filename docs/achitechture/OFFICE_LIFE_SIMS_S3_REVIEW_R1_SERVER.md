# SIMS-3 review, round 1: server, sync and cheat resistance

Slice: the IT room and Neil (the still NPC who prints by command). Diff `32c87a72f..b9793dc7a`
on `build/ol-sims`. Scope: server-side room filtering, globals/sync deltas, cheat resistance,
room access, nothing-grows. No engine or server code changed in this slice (confirmed: the diff
touches only the scenario, ink, README, build log, node tests and the proof tool), so every check
below is against the existing server against the new scenario data.

Read-only evidence: saved state of games 4289, 4299, 4300, 4301, 4302, 4304 via `rails runner`
(script in scratch `officelife-sims/s3-review-r1-server/dump_states.rb`); server code in
`app/models/break_escape/game.rb` and `app/controllers/break_escape/games_controller.rb`;
engine reveal path in `public/break_escape/js/systems/npc-needs.js`.

## Verdict

- Blockers: 0
- Majors: 0
- Minors: 3

The slice is server-safe: the new rooms are filtered by the generic room filter, room access
works through the normal unlocked-door path, `neil_print_asked` syncs once as a delta, the
`triggeredEvents` set is bounded, nothing grows with play time, and the pages carry no secret so
the cheat policy is met. The three minors are a documentation/expectation mismatch about the slot
reveal globals and two best-effort-vs-enforced notes that are within policy for this slice but
worth recording before a mission copies the pattern.

## What was checked and confirmed

**Room filter (`filtered_room_data`, game.rb:2073).** Generic over `scenario_data['rooms']`, so
`it_room` and `manager_office` and their objects are filtered with no per-room wiring. The six
`it_out_*` slots ship to the client on the lazy room load (texts carry no account/address/
password/code; they are change log, toner order, patch note, desk moves, training reminder, cable
audit) and are hidden client-side by `revealOnGlobal` (`rooms.js:3126`), the same pattern as the
kitchen copier. A taken page is suppressed on reload by `item_in_inventory?` (game.rb:1610,
matches by id, slots have distinct ids), not by the note filter (that filter keys on
`type == 'notes'`, these are `notes1` with `addToNotes: false`, so they go to inventory, which is
the right bucket). `objects_added/removed`/`room_states` are untouched by the IT print (the print
is a client reveal, not an `add_object`): confirmed `room_states` empty in every IT game.

**Room access / new door (validate_unlock game.rb:3648; room endpoint controller:523).**
`it_room` and `manager_office` carry no `locked`, so `validate_unlock('door', ...)` grants the
unlocked branch and `serve_opened_room` promotes them to `unlockedRooms`. Confirmed in game 4289:
`unlockedRooms = [office, it_room, manager_office]`. The `enter_room`/room endpoint gates on
`startRoom || unlockedRooms || world || route`; the north/west doors reach the new rooms through
the established connection path. No server change needed, none made.

**Globals as deltas, nothing grows.** `it_out_a..f_shown`, `neil_print_asked`, `neil_ko` are all
declared `false` in the globals block. `neil_print_asked` syncs once as a delta and persists
(true in games 4299/4300/4301, set by `neil.ink` `#set_global`). `neil_ko` stays false (no KO path
in the neutral showcase). `triggeredEvents` holds only the bounded mapping keys
(`neil:conversation_closed:neil` for the print mapping, `amara:npc_used:neil_mug` for
`see_neil_sip`, `amara:object_revealed:*` for `see_neils_page`), each `onceOnly`, recorded once.
player_state sizes stayed 5.3–7.4 KB across runs; nothing accumulates per tick or per reload.

**Cheat resistance.** No secret, key, password or forged item is guarded here. `neil_print_asked`
is ink-gated and only drives a cosmetic print that ticks the optional `see_neils_page`; forging it
or the two custom tasks ticks optional tasks only, which the policy allows as best-effort. The
pages are declared takeable objects validated by `validate_item_collectible`.

## Findings

### m1 (minor) — slot reveal globals never reach the server; sync table overstates them
Files: `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` 6.5 (slot-globals row) and 5.3 (Sync
line); `scenarios/test_needs_sims/README.md` SIMS-3 live-proof rows; root cause
`public/break_escape/js/systems/npc-needs.js:5312`.

The reveal fires through `revealOutput` → `this.setGlobal(globalOf(free.sp), true)` at
npc-needs.js:5312, and that `setGlobal` (npc-needs.js:5090) mutates
`gameState.globalVariables[name]` directly without calling `_worldChanged()`. The eventMapping
`setGlobal` path (npc-needs.js:3450) does call `_worldChanged()` and does sync; the print-reveal
path does not. So the slot reveal global is set in the client runtime but never synced.

Evidence: all six games show `it_out_a_shown..f_shown = false` in persisted state, including
game 4300 where the page was revealed and `see_neils_page` ticked (`triggeredEvents` holds
`amara:object_revealed:*` and `neil:conversation_closed:neil`). The README asserts
"`it_out_a_shown` still true" for game 4299, but the saved server state for 4299 is `false` — the
proof read the client global, not the server.

Impact: harmless for this slice and actually conservative for "nothing grows" (the global never
reaches the server), and it matches the proof's documented "tray empty on reload". But the plan's
sync table 6.5 ("IT slot globals | 6 | once each", synced delta) and 5.3 ("6 slot globals ... as a
delta") describe a sync that never happens, and the README frames a client-only value as a durable
fact. Suggested fix: reconcile the docs — state that a print-revealed slot's `revealOnGlobal` is
client-transient (lost on reload by design) and is not a synced delta, and that the proof's
`it_out_*_shown` assertions are client-runtime reads. If a future mission needs a printed page to
survive a reload, it must set the reveal global through an eventMapping `setGlobal` (which syncs),
not rely on the print reveal.

### m2 (minor) — server does not reveal-gate the takeable slot pickup
File: `app/controllers/break_escape/games_controller.rb:3245` (`find_accessible_item`), 2981
(`validate_item_collectible`).

Neither method consults `revealOnGlobal`. A crafted `POST /inventory` for `it_out_c` (a takeable
object in the unlocked IT room) is accepted before any reveal: the item is found in an unlocked
room and is `takeable`, so validation passes. Within the project cheat policy (the pages carry no
secret and only tick the optional `see_neils_page`), so this is not a blocker. Recording it because
the brief's expectation "a slot page enters the inventory only after its reveal" is not enforced:
the gate is client-side only. Suggested note for the plan: a reveal slot is a best-effort client
object; never place a gated or secret-bearing item on a `revealOnGlobal` slot expecting the server
to withhold it until the reveal.

### m3 (minor, nitpick) — `see_neils_page` condition would also match a cosmetic reveal
File: `scenarios/test_needs_sims/scenario.json.erb` (Amara's `object_revealed:*` mapping).

The condition is `data.producerId === 'it_copier' && data.npcId === 'neil'`. When a producer's
slots are full the engine emits a cosmetic reveal `object_revealed:<producerId>` with
`{producerId, npcId, cosmetic: true}` (npc-needs.js:5322), which also satisfies the condition, so
the task could tick on a cosmetic copy with no real slot. Harmless in this slice (the tray starts
empty, so the first ask reveals a real slot), but adding `&& !data.cosmetic` to the condition makes
the task name match what it sees. Optional.

## Notes

- No engine/server change in this slice, so no regression surface on the server side; the standard
  office beats still ticked in the proof (games 4302, 4304) with the new north door open and no
  office NPC entered IT (`it_intruders: []`), consistent with the leash and `needsPrivateTo`.
- Read-only throughout; no game state written by this review.

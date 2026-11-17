# Office life missions plan: review round 14 (server-facing)

Read-only adversarial server and engine-safety review of `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` draft 15 (tip f2e53dc98), weighted to sections 6.9, 7, 8, 9.1 and 10. Claims were checked against the main-branch code in a sibling worktree: `app/models/break_escape/sync_ring.rb`, `app/controllers/break_escape/games_controller.rb`, `app/models/break_escape/game.rb`, `public/break_escape/js/state-sync.js`, `public/break_escape/js/systems/npc-needs.js`. The round 13 server review was read to avoid repeats; its M1, M2 and N1 are not re-raised.

## Verdict

Accept with minor documentation gaps. Everything the pilot and E7 to E9 write to the server is bounded, sent as per-key deltas, and safe under the save-ordering ring. All of the pilot's new globals are monotonic booleans or grow-only `triggeredEvents` keys, so last-write-wins and the stale-skip set cannot regress them. None needs server validation, and none that matters can be forged to skip required content. The gaps below are that section 7 and 6.9 were written before `sync_ring.rb` reached main and never name it, so a plan reviewer cannot confirm the ring interaction from the plan alone; and one cross-session dependency (8/6a-1) needs the client-visible list to actually include the fields the needs system reads.

0 blockers, 0 majors, 3 minors, 1 nit.

## Blockers

None.

## Majors

None.

## Minors

### m1. Section 7 and 6.9 do not account for the save-ordering ring now on main

Section 7 (`:615-638`) and 6.9 (`:537-548`) model sync as "each change sends one key" deltas but never mention `app/models/break_escape/sync_ring.rb` (the stale-but-recent write ring, `SYNC_RING_MAX=8`, `SYNC_RING_WINDOW_MS=60000`, `SYNC_RING_KEYS_PER_ENTRY=32`, `MAX_KEY_BYTES=128`) or the last-write-wins / stale-skip path in `GamesController#merge_last_write_wins_sections` and `ring_filter_section`. The task asks whether the pilot's globals behave under it; they do, but the plan does not show the reasoning, so a stage 2 reviewer cannot check it.

The substance holds. `globalVariables` is a ring-keyed section (`games_controller.rb:2182`), so the pilot's `heard_night_watch_burned`, `heard_night_watch_cleared`, `heard_night_watch_paper`, `night_porter_ko`, `night_domestic_ko` and `it_copier_page_shown` are each recorded and stale-filtered per key. All six are monotonic booleans (set `false` to `true` once, and the client never sends `false` for them), so last-write-wins cannot regress them whichever way two requests race, and a key a newer request already wrote is simply dropped from the stale request. Every key name is far under the 128-byte `MAX_KEY_BYTES`, so none forces the conservative whole-section collapse in `SyncRing#collapse_entry`.

Fix: add a line to section 7 stating that office-life globals ride the ring as per-key `globalVariables` deltas, that the pilot's are monotonic booleans and therefore safe under last-write-wins and the stale-skip set, and that office-life global key names stay well under 128 bytes so they are never collapsed to a whole-section claim.

### m2. The rollout's non-monotonic globals need a last-write-wins note; the pilot has none

Section 7 lists `<magnet>_servings` (`:626`) as "one integer that changes a few times" and the capture, cloned-card, foothold and disguise records (`:636`) as whole-sent, but gives no ordering story for them. Unlike the pilot's booleans, `<magnet>_servings` decreases, so it is non-monotonic: under last-write-wins the newest arrival wins, and the ring only guarantees that within its 60 s window (`SYNC_RING_WINDOW_MS`); a stale flush older than the window that carried a higher servings count would overwrite a lower one. The pilot is unaffected (it has no magnet, no servings, no openings that write whole-sent records, per 6.7 and section 7's "not used by the pilot" note), but m06's magnet pass (section 5, 9.1 E2/SIMS-5) is the first to hit this.

Fix: in section 7, require any per-mission plan that writes a non-monotonic global (servings) or a whole-sent record to state its last-write-wins behaviour and note that the ring guards ordering only within its window. State plainly that the pilot writes no such value.

### m3. Section 7's "onceOnly" row should name `triggeredEvents` as grow-only, not stale-filtered

Section 7 (`:633`) and 6.9 (`:544`) route the four new `onceOnly` mappings through "the keyed `triggeredEvents` section", citing it beside the last-write-wins globals. In fact `triggeredEvents` is not a ring-keyed section (`RING_KEYED_SECTIONS`, `games_controller.rb:2182`, omits it); it merges in `merge_grow_only_sections` via `merge_triggered_events!` (`game.rb:4849`), which keeps `max(stored, incoming)` per key, is exempt from the stale-skip set, and is capped at `MAX_TRIGGERED_EVENTS=2000` keys and `MAX_TRIGGERED_EVENT_KEY_LENGTH=300` bytes per key. This is the safer behaviour (a stale or repeated fire cannot lose a count), and the pilot's 4 keys sit far under both caps, but the plan's wording implies the same stale-skip treatment as the globals. Worth correcting so a reviewer does not look for a stale-skip hazard that is not there, and so a later mission near the shared 2000-key ceiling knows office-life `onceOnly` keys add to it.

Fix: note that `onceOnly` keys persist in the grow-only `triggeredEvents` section (max-merged, stale-safe, capped at 2000 keys / 300 bytes), distinct from the last-write-wins globals.

## Nits

### n1. Section 8's 6a-1 dependency is a correctness precondition, not just a confirmation

Section 8 (`:658`) and the handover (`:881`, `:887`) ask the hardening session to "confirm" its 6a-1 client-visible list includes NPC `needs`, `chatter` and `exchanges`. These fields are read only client-side (the needs system in `npc-needs.js` and the sync layer never treat them as server-authoritative), so if 6a-1 marked any of them server-only the needs system would lose its input and the pilot's whole staff-room behaviour would break. Suggest wording it as a precondition that blocks stage 4 if not met, rather than a confirmation, so the dependency cannot be waved through.

## What was checked and confirmed

- **Server validation / cheat resistance.** None of the pilot's globals is in `SERVER_OWNED_GLOBAL_NAMES` (`game.rb:2275`, only `se_captures`) or in the read-only sets (`imported`, `wearable`, `server_credit`), so all are plain client writes, forgeable, and that is correct because nothing required reads them (plan rule 1; confirmed for the print mapping's `cover_burned` read, the exchange `requireGlobal` gates, and the KO globals, none of which gates a required task, objective, `concludeRequires` or lock). E9's chained gate `heard_night_watch_burned` is forgeable but unlocks only optional flavour, within the ink-gated best-effort policy. `cover_burned` / `cover_restored` are pre-existing story globals the pilot only reads; it adds no new required gate on them. Forging `cover_burned` early only prints the secret-free copier page early (6.6).
- **E7 to E9 server surface (section 9.1).** The spec edits `npc-needs.js` only, adds no import, saves nothing new, and still writes `heard_<knot>` once per knot. E9 narrows *when* `heard_<knot>` is set (only with `heardLines > 0`), which can only reduce global writes, never add one. Confirmed the server path is indifferent: nothing in the ring, `merge_global_variables!` or `merge_triggered_events!` changes. E7 to E9 change nothing the server sees.
- **Deltas and bounds.** `globalVariables` and `triggeredEvents` are keyed delta sections (`state-sync.js` `KEYED_SECTIONS`); `heard_` / KO / reveal keys send only on change, a gone key sends `null` and is deleted (`merge_global_variables!`). 6.9's "10 small keys + 1 item" and section 7's 64-key worst case hold, and nothing grows with play time. `triggeredEvents` only grows per authored mapping and is capped.
- **Format 3 names (section 8).** `FormatUpgrade.current` is 3; the retired-to-3 table (`:644-652`) and the explicit-`owner` rule match the schema's closed state and the retired-key error check. `gary_mug`'s object-level `private` plus `owner` list is the format 3 shape.
- **Flush / conclude race.** Section 7's `flushPendingGlobals` note still matches `objectives-manager.js`; office-life tasks never gate a conclusion, so the extra delta-only syncs do not fire for them (as R13 found; unchanged in draft 15).

## Assumptions

- Assumption: I treat the pilot's `heard_`, KO and reveal globals as strictly monotonic because the needs/exchange code only ever sets them true and the client sends changed keys; I did not instrument a live race, since the server merge rules make the ordering outcome deterministic for monotonic booleans.
- Assumption: m1 to m3 are documentation gaps, not pilot bugs, because the verified server behaviour is already safe; I did not downgrade the task's emphasis on the ring, I concluded the pilot clears it.

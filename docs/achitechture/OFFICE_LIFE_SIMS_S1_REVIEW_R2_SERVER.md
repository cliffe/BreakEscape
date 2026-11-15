# SIMS-1 review, round 2: server, sync and cheat resistance

Scope: re-check round 1's M1 (Eli print key saved, no reprint) and m2 (Dee catch key) in the saved
state of the fix games; the two new owner items E-reload-mugs and E-reload-ko-pos (diagnosis, cited
lines, fix, cheat/sync risk); and whether the merged main (`9e23e384b`, hidden-tab save and
state-sync delta work) changed the KO drop gate, the dedupe or the delta sync for these records.
Branch `build/ol-sims` at `b3cf58f9b` (main `9e23e384b` merged). Read-only; verified against the
saved `player_state` of the proof games with `rails runner` (no writes). Plan 5.1, 6.2, 6.5.

Counts: **0 blocker, 0 major, 1 minor.**

## Round-1 findings now cleared (verified in saved state)

- **M1 cleared — Eli print key saved, no reprint (game 4217).** `triggeredEvents =
  {"eli:conversation_closed:eli:0"=>1, "eli:object_revealed:eli_page:1"=>1}`: both `onceOnly` keys
  persisted once. `globalVariables.eli_asked=true`, `eli_page_shown=false`, and
  `objectivesState.tasks.check_eli_page.status="completed"`. The saved `conversation_closed:eli` key
  is what blocks a reprint after reload (the mapping re-reads it), and `eli_page_shown` staying
  `false` is what keeps the re-filed slot hidden so the tray is empty on reload. The round-1 proof
  gap is closed. (Note: round 1 suggested asserting "eli_page_shown is persisted" as the reveal
  record; it persists as `false` and is **not** the reveal record. The reveal is carried only by the
  `onceOnly` triggeredEvents keys. The headline no-reprint guarantee rests on those keys, as proved.)
- **m2 cleared — Dee catch key saved (game 4212).** `triggeredEvents =
  {"dee:lockpick_used_in_view:0"=>1}`, `office.objects_removed = ["office_lockpick"]` (the real
  pick-up), and `check_caught_walking.status="completed"`. A post-close reload cannot reopen the
  catch: the `onceOnly` key is present.

## New owner items: diagnosis and risk

Both line citations in `scenarios/test_needs_attack/README.md` were re-checked against the merged
`game.rb` (line numbers shifted +~660 since round 1's `a734d5f57`, but the README was written after
the merge and its citations land on the right code at the current tip):

- **E-reload-mugs — correct.** Cited `game.rb:2108-2111` is the `objects_removed` apply inside
  `apply_room_state_changes!`. Diagnosis holds: a carried world object's removal is recorded only on
  delivery, so a KO mid-carry writes no `objects_removed`; on reload the authored mugs are rebuilt.
  Verified: game 4184 (beat b, Ava KO mid-carry) `office.objects_removed = []` (mugs come back);
  game 4208 (beat c, Ava delivers) `office.objects_removed = ["office_mugs"]`. The README states the
  fix (persist the pickup, or the drop refusal, as `objects_removed`). **Not a cheat** (the mugs
  carry no secret/key/code and are a valueless world object) and **not a sync risk** (it is the
  *absence* of a record, so nothing grows). As designed until the owner wants "gone".
- **E-reload-ko-pos — correct.** Cited `update_npc_state!` KO merge `:1176-1177`, the in-room KO
  self-record `:974`, the `npc_states` apply `:2145-2151`, and `objects_added` `:2108-2121` all land
  on the right code. Diagnosis holds: a KO is saved as `isKO`/`currentHP` keyed to the NPC's authored
  room with no position, so on reload the body renders at its authored spawn while the drop stays
  where it fell. Verified: game 4184 `office.npc_states.ava = {isKO, currentHP:0}` with
  `kitchen.objects_added = ["ava_folder"]`; game 4208 the same for Ben's notebook. The README states
  the fix (persist the KO position and the room it fell in) and the mission-side mitigation (keep
  KO-able needs NPCs in their own post room). **Not a cheat** (a client claim already gated by
  `npc_ko_claimable?` + `npc_in_room?`; no secret) and **not a sync risk** (one bounded record). It
  is the cross-room KO case E1 exists to flag.

## Merged main did not touch the gate, dedupe or delta sync

`a734d5f57..b3cf58f9b` (includes the main merge) was diffed function by function. Every record-path
method is **byte-for-byte unchanged**: `add_item_to_room!`, `npc_defeated?`, `npc_ko_claimable?`,
`npc_ko_drop_pending_ids`, `npc_held_item_delivered?`, `update_npc_state!`, `merge_npc_hostility!`,
`find_npc_held_item`, `apply_room_state_changes!`, `merge_triggered_events!`. The merge's sync_state
changes are all capture / `currentRoom` (gated-door, phish) work, orthogonal to these records; the
`update_npc_state` / `merge_triggered_events` / `room_states` controller branches are unchanged. The
only touch to the completion path is an explicit `trusted: false` on the two `complete_task!` calls,
which is the default; all five custom tasks (`check_ko_drop`, `check_held_drop`, `check_solo_break`,
`check_caught_walking`, `check_eli_page`) are `status="completed"` in saved state (games 4184, 4208,
4214, 4212, 4217). The KO dedupe still holds: each KO game carries its drop once
(`objects_added` one id) and one `npcHostility` entry.

## Findings

### Minor

**m1 — README beat (i) prose on `eli_page_shown` is misleading (`scenarios/test_needs_attack/README.md:86`).**
"a reload after the page has landed re-files the revealed slot, `eli_page_shown` persists" reads as
if the reveal is remembered by that global. In saved state `eli_page_shown=false` (game 4217): the
page is revealed by the print producer's `object_revealed:eli_page`, and `eli_page_shown` staying
`false` is precisely what re-hides the slot on reload. The live-proof table row (i) already says
"`eli_page_shown` false, tray empty", so the prose contradicts the table on its face. Suggested fix:
reword to "`eli_page_shown` stays `false`, so the re-filed slot is hidden on reload, and the saved
`onceOnly` `conversation_closed:eli` key is what stops a second print." No code change.

## Cheat policy (unchanged, not a finding)

As round 1: KO is a client claim gated only by `npc_ko_claimable?` + `npc_in_room?`; the KO globals
and the reveal/asked globals complete optional tasks only; no secret, key, password or forged item is
exposed by this probe. Consistent with 6.2.

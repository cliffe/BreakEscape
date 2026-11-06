# Handover: office life slice 3 (2026-11-06)

**Status: built and proved live on `test_needs_sims` and `test_needs_leash`; the
`lab_physical_pentest` live regression is open.** Plan: `OFFICE_LIFE_PLAN.md` 2.12 (its Built
line has the evidence) and the 7.2 "Changed" note for the `leashed` fold-in.

## Done
- Fold-in (845dadb4c): `leashed` only when a room rule removed a target; another owner's private
  object is `private_skipped` (log only, no event), overlay ` private`; `getState().job` gains
  `tag` and `privateSkipped`. Node tests in `npc-needs`, `npc-needs-tick-cost`, `npc-needs-debug`.
  (This commit also carries slice 3's `pickUp`/`dropHeld` change in `npc-needs.js`.)
- Slice 3 (804e8dfde): `systems/npc-office-visuals.js` (held item on `postupdate`, `playAt`,
  `useVolume`, `SoundLimiter`, `iconShown`, `roomIsDark`), `systems/room-hearing.js` (lighting's
  `hearing` now delegates to it; the five lighting harness copy lists include it),
  `npc-action-icons.js` (texture icons, defaults, tag/need lookup, room/dark rule), `seating.js`
  (`poseSprite` exported with `dy`, `typingBob`), `core/game.js` install line, schema
  (`actionIcons` object values, `officeVisuals`, `affordance.useSound`), validator lints
  (held item over 24 px, unloaded `useSound`, missing icon texture), `validate_scenario.rb`
  known field. Tests: `npc-office-visuals.test.mjs`, `seating.test.mjs`.
- `test_needs_sims`: sprite default icons (one `{sprite}` example), `useSound` on drinks and
  snacks, task `hear_drink`, `see_parcel` retitled.
- Node suite after the commits: 384 files, all passing.
- Live: games 593, 596 (sims), 597 (leash). Docs: plan Built lines, `NPC_NEEDS_SYSTEM.md`
  (leash paragraph, overlay, slice 3 paragraph), sims README slice 3 table.

## Open
1. **`lab_physical_pentest` live regression** (score 100 with Len's route unlock). Not run: the
   run needs the lab's full critical path (the last good run is game 590, session log
   `tools/playtest/lab_physical_pentest-session.jsonl`, recipe in the lab's
   `IMPROVEMENT_LOOP_LOG.md` "Expansion build — run 2"). Another agent is dressing the accounts
   floor (`room_lw_accounts.json` was modified, uncommitted, during this run). What slice 3
   changes there: the lab keeps its explicit emoji `actionIcons` (they win over the defaults);
   icons now show only for NPCs in the player's room while it is lit; desk staff bob while
   working; no `useSound` in the lab, so no sounds; a carried item (none in the lab) would show.
   Also check the plan's "lab open plan: icons and bob" screenshot then.
2. No south-facing carry was captured live (the showcase's carries head north or west).
3. The play log's `volumes` read back from Phaser instances show 1 (the gain is set on play and
   Chrome reports the old value synchronously); the play log's computed volumes are the evidence.

## Gotchas
- The harness `moveTo` can click an object and open its examine minigame; close it with
  `MinigameFramework.endMinigame()` before the next `enter`.
- A player standing in a doorway blocks a carrier (Grace's carry failed once at the kitchen door).
- `#objectives-panel` and `#notification-container` cover the top-left of the canvas; hide them
  (style.visibility) for icon screenshots. The canvas is 700x500 shown at 2x.
- Helper scripts: session scratchpad `s3/` (`watch.py`, `held.py`, `bob.py`, `sound*.py`, `c.sh`).

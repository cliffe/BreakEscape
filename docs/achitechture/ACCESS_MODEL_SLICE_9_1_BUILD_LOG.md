# Access model slice 9.1: build log

Plan: `ACCESS_MODEL_SLICE_9_1_PLAN.md`, with the minors of `ACCESS_MODEL_SLICE_9_1_PLAN_REVIEW_R4.md`
that touch the steps built here. Steps 0 to 4, 6 and 7 are built on branch
`claude/break-escape-access-design-090sjx` (from `0b1a457b8`). Step 5 (`holdsDoors`) waits for the
engine plan's door work (E1 item 3) and step 8 for the lab's feedback pass and 9.3's lab step.

## Step 0. The locked look (2026-11-10)

Keyless server on :3001, at `0b1a457b8`.

- `test_access_sessions` (game 86): the player walked into `ian_room` and waited for Ian to leave
  (48 s). `window.__test.access.workstation('ian_pc')`: `screenLocked: true`,
  `lockedLook: true`, `texture: "pc8"`. The PC has no `"sprite": "pc_desktop"`, so there is no
  `pc8_locked` art and the picture does not change: a set-up fact of the fixture, not a fault.
  `screenTransitions()` last entry `{ objectId: "ian_pc", locked: true, sound: null }`.
  `npcOfficeVisuals.cueLog` last entry `{ how: "leave", locked: true, flash: null, glyph: true,
  chime: { key: "screen_lock", volume: 0.058 } }` (the room is unlit, so a glyph, and the player
  stood in the room, so a chime above 0).
- Repeated in `lab_physical_pentest` on Chris's `staff_pc` (game 87, started in `open_plan` with
  `new-game.rb --start-room open_plan`): `texture: "pc_desktop_locked"`, `lockedLook: true`;
  transition `{ objectId: "staff_pc", locked: true, sound: null }`; cue
  `{ how: "leave", locked: true, flash: "lock", glyph: false, chime: { key: "screen_lock",
  volume: 0.01 } }` (a lit room, so a flash). The padlock look shows. Screenshots were looked at
  and kept out of the repo.

Nothing to send to the owners of `screen-states.js` or `npc-office-visuals.js`.

## Step 1. Foundation (2026-11-10)

Built as planned: the claim check fix first (`AccessIdentities.screen_always_locks?`, and
`Game#pc_always_locks?(pc, owner = login_pc_owner(pc))` with `claim_login_session!` passing the
owner it has found), then `lib/break_escape/npc_habits.rb`, the third step in
`prepare_scenario_data!`, `Game#npc_habit` and `Game#written_down?`, the `roles` deletion in the
bootstrap, the schema's step 1 block and the known-field lists. The loader's order is unchanged:
it gains a third step after stamping (review R4-m4).

Deviations and notes:

- The shared fixture `test/support/access_model_scenario.rb` gave Jake `"awareness": "low"`
  (a probe written by the first slice for the withholding test). With the habit now acting,
  `low` fills his `screenHabit` with lockChance 0 and the claim refusal case "no lockChance,
  screen locks on leave" in `access_model_login_test.rb` became a grant. The fixture now says
  `high`, which fills lockChance 1 and leaves every existing claim test unchanged. The new
  withholding test sets `low` on its own copy.
- `expanded_copy` stamps room objects and their contents only, not profile or resource
  contents (the server stamps all four). The equality test is scoped to room objects and their
  contents (review R4-m3).
- `bin/rails zeitwerk:check` does not exist in this engine's Rails task list. The loader test
  reaches `BreakEscape::NpcHabits` by name with no `require`, which is the autoload proof.
- `expand!` writes the NPC's `habits` object only when the NPC has a level, or when an
  authored `habits` object loses invalid entries; a non-object `habits` skips the NPC.

One-off check: every scenario under `scenarios/` (170) rendered through
`Mission#generate_scenario_data` and run through `NpcHabits.expand!`: the output equals the input
and the report is empty for all of them.

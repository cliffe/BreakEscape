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

## Step 2. The sticky note (2026-11-10)

Built as planned: `Game#login_postit_for` (public), `hasPostit` in `attach_login_accounts!`
inside the existing headless guard, `postitNote` and `Cache-Control: no-store` on every
`GET /login_accounts` answer (404 and 403 included), the desk branch of `openLoginSignIn`
(9.3a's remote branch is not on this branch yet; the test checks it if it appears),
`hasPostit` on `pc_signin_shown`, and `systems/postit-marks.js` with its install in
`core/game.js` and the `syncRoom` call in `core/rooms.js`.

Notes:

- `pcSessions.screenShown` adds `hasPostit` only when its fourth argument is given. The sign-in
  screen always passes it (true or false); a three-argument call sends the same data as before,
  so `pc-sessions.test.mjs` passes unchanged.
- An authored `postitNote` that is empty or only spaces counts as no note on the server.
- Postit marks install unconditionally (not only with the needs system), since a sign-in PC
  with an authored note can be in any scenario.

Browser check on :3001 (`test_access_signin`, game 90): the hot desk shows the note picture at
its monitor's top-left (screenshot looked at); its sign-in screen shows the authored note (the
fallback), `pc_signin_shown` carried `hasPostit: true`, and the `/login_accounts` answer was
`no-store` with keys `pc_id` and `loginAccounts` only. The hot desk has no owner, so there is no
indicator dot beside it; the dot and the note together are seen in step 7's scenario. The full
`test_access_signin` scripted runs were not repeated by this builder (scripted runs are a
separate tester's job, section 15).

Node suite: 455 of 456 files passed; `fingerprint-generator.test.mjs` failed once under
`-j 6` load and passes alone (unrelated to this step).

## Step 3. Validator (2026-11-10)

Built: `scripts/validate_npc_habits.rb` (`ValidateNpcHabits.check` and `report_lines`),
`lib/break_escape/npc_habits/clues.rb` (`pieces`, `readable_texts`, `secret_homes`, `backing`,
plus `reuse_homes` and `parts_all_sourced?`), the wiring in `validate_scenario.rb` (the three
`require_relative` lines, the `expanded_copy` line before `ValidateNpcNeeds.check`, its new
keyword, the `ValidateNpcHabits.check` line after `check_access_model`, and the report printed
after the issue list) and the `screen_habits:` keyword in `validate_npc_needs.rb`.
`check_access_model` is not edited.

Notes and choices:

- The office life keyword's fixture is a plain workstation (`workstation: true`), as review
  R4-m5 says: `ValidateNpcNeeds.workstation?` does not count a sign-in PC, and an
  `autoLockSeconds` on a sign-in PC without `workstation: true` draws office life's "not a
  workstation: it never locks" warning before the line this slice changes. That warning is
  false (the client idles such a PC out) and is for office life's owner, not this slice.
- `main` passes `npc_screen_habits(copy)`: every room NPC's `screenHabit` in the expanded copy,
  authored and filled alike, so the one changed line reads the same value as before for an
  authored habit.
- A profile is the account's own when its `for.people` names the account or it admits no other
  account; a sign-in PC's contents are the account's own when the PC admits only that account.
- Readable text: object `name`, `text`, `observations`, `postitNote` and the same fields in any
  `*Variants` array; NPC `itemsHeld`; `startItemsInInventory`; profile contents;
  `social.intelFacts`, `social.osint.sites` and `social.mailClient.seededMessages` (strings
  under text, body, subject, label, value, title, note, fact, caption); the compiled ink under
  the scenario's `ink/`.
- The sprite suggestion is raised for a workstation where the habit's fill applies, not where
  the PC's own field wins.
- The Wi-Fi key is in `secret_homes` (`networks.<id>.wifi.psk`) whenever a scenario has one.

One-off run: the validator (`--skip-ink --no-graph`) over all 170 scenarios. The only new
`habits:` line on an existing scenario is in `test_needs_sims`: "the mapping on
'workstation_accessed:tom_pc' fires on some leaves only" (Tom's PC authors `lockChance` 0.5 and
the mapping is a print trigger on an open screen). It is a real finding for that fixture's
owner and is accurate; nothing in this slice changes it. No scenario has a habits report.

## Step 4. Dungeon graph (2026-11-10)

Built: the habits block in `scripts/generate_dungeon_graph.rb`, after the identity edges, read
from `NpcHabits.expanded_copy`. Review R4-m7 is settled the first way: the "unlocked screen"
edge is drawn only where the owner has a `locksScreen` habit whose fill applies at that PC (no
lock field of its own), so a PC whose authored `lockChance` 0 or authored `screenHabit` makes
it claimable gets no edge, and `dungeon-graph-identities.test.mjs` is unchanged. Edges for
authored lock fields are a later idea. A "clue" node is the clue object, hung from the lock of
the innermost locked container it sits in, else from its room, so a clue behind the account it
opens shows as a loop. A "same password" edge from a capture or Wi-Fi key starts at a small key
node of its own.

## Step 6. Playtest tooling (2026-11-10)

Built: the scanner takes `game:` (`AccessLeakScanner.new(scenario_data, game: game)`) and adds
the note exception (`$.postitNote` of a `GET /login_accounts` answer whose own `pc_id` names a
PC whose owner the game says `written_down?`), the saved-copy exception (`savedNotes` after an
earlier `/login_accounts` line carried the value, across files in order) and the
`withheld_key` finding (an NPC record with creds, role, awareness, habits or workarounds, by key
and NPC id; the top-level `social` subtree is skipped). `access-leak-check.rb` hands it the game.
`verify-run.rb` prints a `habits` block of values after the access section; its stub gains
`STUB_SCENARIO` and `STUB_POSTIT`.

Notes:

- The scanner's existing fixture test now also expects one `withheld_key` finding: the planted
  `creds` on Jake in `responses.jsonl` line 4 is exactly what the new rule reports.
- Without a game the note exception never applies (a `/login_accounts` note is then reported).
- The sentence for `.claude/skills/playtest-scenario/SKILL.md` ("Access model checks") was not
  written in: skills are edited with the orchestrator's say-so. Proposed text: "From slice 9.1
  the leak check allows a password in two places only: at `postitNote` of a `/login_accounts`
  answer for a writesDown owner's own PC, and in `savedNotes` once such an answer has carried
  it; it also reports any NPC record carrying creds, role, awareness, habits or workarounds.
  The `habits` block of `verify-run.rb --access` and the validator's habits report name who
  never locks and whose password is on a note, so neither is shown to a tester playing blind."

# Round R9 (final): deduction board plan

Target: `DEDUCTION_IMPLEMENTATION_PLAN.md`, 5,191 lines before this round (5,285 after), with R8's 14
findings folded (§14 "Round R8 (confirmation)"). Read against the working tree on 2026-10-23; code paths
under `public/break_escape/js/` unless stated. Code was read only. Plan line numbers below are from the
file **before** the R9 edits.

Code read for this round: `systems/inventory.js` (restore loop `:95-215`, `addToInventory` `:440-700`,
`addKeyToInventory`), `core/game.js` (`create()` from `:1523`, `processInitialInventoryItems()` `:2221`,
`game_loaded` `:2262`, no await between them), `app/controllers/break_escape/games_controller.rb:365-372`,
`app/models/break_escape/game.rb` `initialize_player_state` (`:2897-2925`), `systems/npc-manager.js`
(`_delayedMappings` `:182`, `_scheduleDelayedMapping` `:600-630`, the person-chat, video-call and
phone-chat branches of `_handleEventMapping` `:1040-1191`), `ui/success-screen.js:30-82`,
`music/scenario-music-events.js:150-205`, `scripts/validate_social.rb:250-320`,
`scripts/validate_social/pretext.rb:568-700`, `scripts/validate_social/mail.rb:930-1060`,
`scripts/validate_scenario.rb` (`check_pin_locks` `:1740-1765`, `check_ink_dialogue_hazards` `:608-690`,
`check_ink_files` `:787-800`), `deduction/sim/fixtures.js`, `sim/run.js`, `scenarios/m01_first_contact`
PIN locks, `scenarios/test_social_board_indicators/mission.json`.

## Part A: closure of R8's 14 findings

| R8 | Holds | Evidence |
|---|---|---|
| R8E-1 | yes | §5.5 step 3 scopes the pre-check, post-check and "unsettled" result to success-screen endings (l.1396-1428); step 4's condition says so (l.1429); DL22's ⚠️ explains why a credits ending reaches step 4 (l.2529); §12 prose (l.4471-4473); §11.3 case: a credits ending with an `onClose`-set gate global reaches step 4 and fires the stub credits (l.4097-4101). `concludeMission()` syncs twice before `/conclude` and a refusal shows its own "Not Yet" alert (`scenario-music-events.js:159-180`, `:189-201`) |
| R8E-2 | yes | Pre-check placed after every task outside the conclusion aim, immediately before the first conclusion-aim task (l.1397-1403); §11.3 case for a `tasksCompleted` gate on an `onClose` task in another aim (l.4092-4096); the solved task, when it sits in the conclusion aim, is moved last with the rest, so the pre-check still precedes it |
| R8E-3, with the `fromClose` option | yes | §4.5 l.680-683; §5.5 "Kind `none` at close" l.1294-1299 and close step 1 l.1342-1344; §11.3 l.4088-4092. Close step 1 runs before step 2 sets `closed`, so skipping the "case is closed" check is safe either way; the final call gives every suspect a `final` verdict (§6.6), so a retry never meets a stored kind-`none` verdict |
| R8E-4, restore case moved to `id_badge` plus a skip-rules case | yes, one wording gap (R9-1) | The skip rules match the code: `notepad` skipped (`inventory.js:122-126`, `:170-174`), notes types emit nothing (`addToInventory` returns before the emit; `restoreNoteFromSave` is called but the loop still calls `addToInventory`, which returns early), duplicates judged against `window.inventory.items` (keys live on the key ring in both the code and the plan), and the pre-restore claim holds because the push precedes the emit synchronously after the POST and `create()` has no await between `:2221` and `:2262`. With no game id the POST block is skipped, so every emit runs inside `create()`. The `id_badge` and skip-rule cases (l.3961-3973) agree. Gap: "a first load" for `startItemsInInventory` does not match the client's `Array.isArray` rule or the server's seeding |
| R8E-5, with the `_delayedMappings` pending definition | yes, one scope gap (R9-2) | `_delayedMappings` is `npcId -> Map(eventKey -> timer)`, entries deleted when they fire (`npc-manager.js:182`, `:619-628`), so "no inner map holds an entry" is the right test; 1 s of continuous idle polled at 250 ms matches `IDLE_MS`/`POLL_MS`; the 500 ms launch delay is covered. Gap: the person-chat and video-call branches also call `endMinigame` before their 500 ms launch, but DL12's new ⚠️ covers only `phone-chat` |
| R8F-1, display names | yes | §9.3 heading "Fixture C — Safe house" and board `title` "Safe house" (l.3075); §9 names all four `display_name`s (l.2541-2544); DL10 row, §7.9 and §8 "Where the scenario is" scan `display_name`; real `mission.json` files use that key. §4.9's DL10 hand check still lists only `description` (R9-5) |
| R8F-2 | yes | A's `closingLine` (l.2991-2995) as the reviewer wrote it; consistent with §6.3's "Any one profile is enough" row |
| R8I-1 | yes, one wording gap (R9-4) | *Topic flow* defined (l.2486-2491); DL6's wary clause reads it and exempts a test after the global write; §11.5's mutation puts the wary branch first. §7.2's pattern diverts every topic to a knot (`-> ask_unhappy`), so clue topics need the same flow, but DL6's budget still says "progress topics whose body charges influence" and *clue topic* is not defined |
| R8I-2, favour counting in DL8's single-room warning | yes | *Opening facts* (l.2480-2485): a favour route counts only when its `unlockFact` is an opening fact worked out without favour routes, and in the single-room warning with that room's other facts; `favour/` uses `b_haddad_access` (l.4297-4304); `sim/r8_favour.js` exists and §14 records its results |
| R8I-3, staged co-fires | yes | §8 "Staged co-fires" (l.2393-2400) lists the four C2b co-fires; I rechecked every other C2a bad case (DL2, DL3, DL4, DL10, DL13, DL15, DL17, DL20-DL23 and §11.5's C2a cases) and none lists a C2b co-fire; the DL22 race case lives on `strict/`, a C2b fixture, so DL9 exists when it runs. C2a and C2b rows and §10.3 agree |
| R8I-4 | yes | §11.5 DL7(c) declares `deduction_faded_b_okoro_access` (l.4333-4334) |
| R8I-5 | yes, one omission (R9-3) | `noWary`, `v`, `place` named; `inClosedContainer` (C's bag atom, `fixtures.js:220`, read by `run.js:128`) is not in the enumerated list, though "every field the sim's atoms carry" covers it |
| R8I-6 | yes | `def self.err` / `def self.warn_` named |
| R8I-7 | yes | `valid_item_types: nil` with the reason, §8 and the C2a row |

## Part B: findings

| Id | Severity | Plan line | Finding | Evidence | Fix | Applied? |
|---|---|---|---|---|---|---|
| R9-1 | minor | 1083-1084 (§5.2); 3964-3965 (§11.3) | The ignore map's source is "`playerInventory` (a reload), or `startItemsInInventory` when there is no saved inventory (a first load)", and §11.3 tests the start-item path with "empty `playerInventory`". The client picks `playerInventory` whenever it is an array, so `[]` wins and no start item is added; the server sends `playerInventory` only when non-empty and seeds it with the start items at game creation, so a real first load arrives as a `playerInventory`. A builder following "no saved inventory" with `[]` would build the map from start items the restore never adds, and the §11.3 case as written would expect start-item pickups to be ignored when the real client never emits them | `inventory.js:119`, `:165`; `games_controller.rb:365-372`; `game.rb:2905-2921` | State the client's choice (`Array.isArray`), the server's non-empty rule and seeding; §11.3's first-load case uses no `playerInventory` key and adds a `[]` case (empty map) | yes |
| R9-2 | minor | 2519 (DL12 last ⚠️); 1480-1483 (§5.5 idle wait) | DL12's new ⚠️ fires only for `conversationMode: "phone-chat"`. The `person-chat` branch ("Close any currently running minigame first") and the `video-call` branch also call `endMinigame(false)` and launch 500 ms later, so a person or video call keyed on `deduction_closed` or an outcome global ends the debrief just the same, unflagged. No fixture has one | `npc-manager.js:1055-1058`, `:1141-1143`, `:1166-1173` | DL12's ⚠️ covers any `conversationMode` (`person-chat`, `video-call`, `phone-chat`), message "conversation on …"; §5.5's sentence names all three branches | yes |
| R9-3 | minor | 3686 (P10-A row) | The atom field list names `noWary`, `v` and `place` but not `inClosedContainer`, which C's bag atom carries and `run.js` reads for the DL8 container check | `sim/fixtures.js:220`; `sim/run.js:128` | Add `inClosedContainer` to the list | yes |
| R9-4 | minor | 2513 (DL6 budget); 2486-2491 | DL6's budget counts "clue topics plus progress topics whose body charges influence". After R8I-1 the progress topic is defined over its *topic flow*, and *clue topic* is never defined; in §7.2's pattern every clue topic's grant sits in a knot reached by divert (`-> ask_unhappy`), so a builder reading "body" literally would find no clue topics and the budget ⚠️ could never fire | §7.2 sample ink; DL6 row | DL6's budget reads both kinds over the *topic flow*; define *clue topic* as a choice whose topic flow holds a `#grant_fact` of a cell | yes |
| R9-5 | minor | 905-908 (§4.9 DL10 hand check) | After R8F-1, DL10 scans `mission.json`'s `display_name`, but §4.9's hand check of clean B lists only the `description` | §9 l.2541-2544 | Name B's `display_name` ("Test: social deduction B, night shift") in the hand check | yes |

No blocker or major was found, so the minors were applied with exact-match edits.

## Part C: the two builder choices open since R6 (item 2, now in §8)

**(a) Ink text (DL10, DL15).** New §8 derived set *Ink text*. It is built on the readers the validator
already has: `ValidateSocial.ink_source_path` and `ink_files` (root plus `INCLUDE`s), `ink_lines` (drops
`//` comment lines), `Pretext.strip_comment` (inline `//`), and the meta-line set of
`check_ink_dialogue_hazards`. Removed: comments (including `/* */` and `TODO:`), knot, stitch and
function headers, `~` logic lines, `VAR`/`CONST`/`LIST`/`EXTERNAL`/`INCLUDE` lines, tag-only lines and every
tag to the end of its line, divert and thread lines and inline diverts with their targets, glue, variable
prints, bare conditional and branch heads, choice markers, labels and leading conditions, and a leading
speaker prefix whose name is Narrator, the player or an NPC's `id`/`displayName` (the `valid_speakers`
rule of `check_ink_files`). Kept: dialogue, choice text (bracketed and unbracketed parts), gather text,
and every branch of inline conditionals and sequences. DL15 and DL10's number patterns test each line;
DL10's "appears verbatim" brief check tests the lines joined. A story the rule must read with no `.ink`
source gives one ⚠️, as the pretext lint does. C2a builds it (§8 "Who builds what", the C2a row), and §11.5
gains a DL15 case (a banned word only in a tag id, knot name, `VAR` name or comment stays quiet).

**(b) When a PIN code is given (DL8).** New §8 derived set *A code given freely*. The code is the lock's
`requires` as a string (`check_pin_locks` accepts a string or an integer). It counts when it appears as a
whole token (no letter or digit next to it; case-sensitive for a password) in a loose opening-room object's
`text` or `observations`, or in an opening-room NPC's *ink text* (phone NPCs listed in the room's `npcs`
included) on a free line. "Free" is the plan's existing "Freely" rule applied per source line, with nested
choices included. A gate on the NPC's own influence, questions or wary variables still counts as a gate
here.

I did not take the brief's example exemption (own influence variables, or the fact's own global) for
codes, for two reasons. The existing "Freely" rule, which the hand checks rely on, already treats any
choice condition as a gate for codes, `#give_item` and `#unlock_door` alike. A's archive code is said to
stay closed because Venn's choice is gated on `se_intel_a_venn_ward_charm` (§9.2), and an exemption for
`se_intel_*` gates would reopen it and move A's DL8 result. A code is not a fact either, so "the fact's
own global" has nothing to attach to. Keeping one rule for codes and tags changes no fixture's DL8
result. A code in a `VAR`, a `~` line, a tag, a comment or a variable print does not count, and a missed
spelling can only make DL8 quieter. §11.5 gains the matching `opening/` cases.

## Verdict

**Ready to build: yes.** All 14 R8 fixes hold against the plan and the code, the fixer's extensions
included. The five findings were minors and are applied, and both open builder choices are now written
into §8. No fixture data, sim result, packet order or §13.1 decision changed. Nothing needs the user.

Counts: 0 blockers, 0 majors, 5 minors (all applied); 2 open choices settled. The plan's §14 has a
"Round R9 (final)" block and the status line says the plan is ready to build.

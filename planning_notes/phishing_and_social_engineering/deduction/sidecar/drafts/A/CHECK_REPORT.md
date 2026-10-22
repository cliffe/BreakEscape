# Fixture A draft: check report

Checked 2026-10-22. The plan was 3,357 lines when this check started and 3,451 by the end, because the other workflow is still editing it. Section names are given below as well as line numbers, since the line numbers move. Nothing in the plan, `scenarios/` or any code was edited.

## 1. Ink compile

Compiler: `bin/inklecate`, which is what `scripts/compile-ink.sh` calls. That script only reads from `scenarios/`, so I ran the compiler on each file directly and wrote the output to `drafts/A/compiled/`.

| File | Result |
|---|---|
| ded_a_barstaff, ded_a_delacroix, ded_a_foes, ded_a_handler, ded_a_intern, ded_a_ishikawa, ded_a_marsh, ded_a_okafor, ded_a_venn | all compiled with no errors or warnings |

No file contains an `END` line, so compile-ink.sh's hub-convention warning would not fire. I fixed nothing because there was nothing to fix.

## 2. Lints

- `dialoguelint.mjs drafts/A`: no findings. Totals by rule: none. HaX's file is read as `[phone]` and the rest as `[person]`. The longest line is 24 words (Delacroix).
- `inklint.mjs drafts/A --all --phone`: no findings.

## 3. Cross-references (ERB rendered, then parsed as JSON and checked with a script)

- The ERB has a comment block only and renders to valid JSON.
- Each of the 18 intel facts has a matching `se_intel_*` global, and no `se_intel_*` global is left over.
- Each fact's `deduction.suspect` equals its `subject`, and each clue exists. The number of facts per clue matches every `count`.
- Every route resolves: trigger ids are in `triggers`, npc ids are NPCs, and the object id is an object.
- Each suspect has `deduction_verdict_*` and `deduction_outcome_*` globals, Marsh has `deduction_favour_ded_a_marsh`, and `deduction_state`, `deduction_closed` and `scenario_triggers_fired` are declared.
- Triggers: every `grant_fact`, `set_global`, `where.itemId` and `where.objectId` and every condition global resolves.
- Stakes: every action type is in DL16's known list. Each `reveal_hostiles` names an NPC that is pre-placed in the named room (doorman in a_hall, lookout in a_cloakroom, acolyte in a_sanctum). The `lose_ally` NPC and global exist, and `solvedTask` is a real task.
- The favour's `unlockFact`, `item` and `room` all resolve.
- Music and credits conditions, eventMapping conditions and `global_variable_changed:*` patterns all name declared globals. Every `storyPath` has an ink file.
- In the ink, every `#grant_fact`, `#verdict:*:<s>` and `#unlock_door` target resolves. Every ink VAR is either a declared global or an intended ink-local (`met`, `quiet`, `asked_*`, `code_given`, `marsh_asked`, `*_questions`), and every `~ x =` assigns a declared VAR.

Result: no broken references.

## 4. validate_scenario.rb

The script takes any path (`ARGV[0]`) and only requires a `mission.json` beside the ERB. I copied the draft to `validate_copy/test_social_deduction_a/` and ran it with `--no-graph --skip-ink`. The output is in `validate_copy/validate_output.txt`. That run stopped at the schema step, so I ran it a second time with a scratch schema that has `hint` added to the `triggerOnInteract` enum, to reach the later checks. That output is in `validate_copy/validate_output_hint_schema.txt`.

Expected (the schema work is not built yet): `triggers` is an unknown top-level key, `social.deduction` and `intelFacts.*.deduction` are additional properties, and `case-file` `minigameData.allowSubmit` is undeclared. The `_note` keys warn as unknown fields; that is intended.

Other issues:

| # | Level | Issue | Points at |
|---|---|---|---|
| V1 | ❌ schema | `triggerOnInteract[].type` "hint" is not in the schema enum (`scripts/scenario-schema.json:3390`), even though `apply-actions.js:124` handles it. Hits `a_camera` and `a_reading_desk` | **plan** (see P2) |
| V2 | ❌ INVALID ×3 | Phone NPC eventMappings with `targetKnot` and no `conversationMode` (HaX: `game_loaded`, the key sighting, `a_thrown_out`) | **plan** for two of the three (see P1). The `game_loaded` one was invented by the draft |
| V3 | ⚠️ | `lockedHint` on a `pin` door (archive) and an `rfid` door (sanctum) is shown only for key locks | draft |
| V4 | ⚠️ | No item opens `a_cloakroom_door` or `a_sanctum_seal` | intended: the cloakroom is lockpick-only, and the sanctum opens only through HaX (G2) |
| V5 | ⚠️ | No `spriteTalk` for any placeholder sprite; shared sheets (barstaff and intern, doorman and lookout, player and acolyte) | draft placeholders |
| V6 | 💡 | `has_marsh_phone` is "set but never read" | false positive: Marsh's ink reads it, but `--skip-ink` and a `storyPath` under `scenarios/` that does not exist mean the validator never sees it |
| V7 | ⚠️ | The lockpick has no `puzzle_graph_unlocks`; no `concludeRequires` | draft, minor |

## 5. Plan issues

Confirmed against the engine and validator in this check (the draft's own list in INVENTED.md is G1 to G14):

- **P1 (major): phone forced calls.** §9.2 "Unique item" and the escalation at 3 wrong both have HaX's `eventMappings` "open" a knot (`key_seen`, the get-out call), and so does §9.3 for C's pull-out call. The plan never says `conversationMode: "phone-chat"`. Without it, a phone mapping with `targetKnot` is ❌ INVALID in the validator (`validate_scenario.rb:2605`) and is ignored once a story state is saved (README_scenario_design.md:1216, :1306). With `phone-chat`, a call the player closes before choosing is lost under `onceOnly` unless the mapping has `resume: true` (README:1319-1329) or there is a hub fallback choice, e.g. `+ {se_intel_a_okafor_brass_key and deduction_verdict_ded_a_okafor == "" and a_key_choice == ""} [About Okafor's key]`. §7.8 should give the mapping shape and the fallback. The draft has the same gap.
- **P2 (major): schema enum for object actions.** §5.10 and P10-C1 add `triggers` to the schema but do not widen the per-object `triggerOnInteract` type enum. `hint` is missing there today, and so are the seven §5.4 types (`verdict`, `verdict_close`, `deduction_tamper`, `remove_item`, `fail_mission`, `reveal_hostiles`, `lose_ally`). Fixtures A (camera) and B (§9.1, the DHCP printout "shows the printout as a `hint`") both use `hint` in `triggerOnInteract`, so every validator run on them fails the schema step. Either P10-C1 adds these to the enum, or the fixtures put the `hint` in a trigger.
- **P3 = G1 (confirmed):** `t_a_thrown_out_end` with the condition `globalVars.a_thrown_out` alone ends the evening on any later close. That contradicts bridge A-wrong A4 ("Not yet") followed by A7 (close through HaX, then the acolyte in the sanctum). It needs a separate "chose Get out" global.
- **P4 = G2 (confirmed):** a sanctum "locked door (no key)" left as a key lock can be lockpicked, which skips the warned close. The plan should name a lock type no player tool opens.
- **P5 = G3 (confirmed):** `#unlock_door:a_sanctum` from HaX needs `unlockable: ["a_sanctum"]` on his NPC record (`game.rb:1305-1310`). The other half of the server check, "encountered", is met because the server records every NPC listed in a room's `npcs` when that room loads (`games_controller.rb` `track_npc_encounters`), and HaX is listed in `a_hall`. The plan should state the `unlockable` requirement.
- **P6 = G4:** the start inventory has no phone, so the player cannot call HaX. It needs `phone` with `phoneId: "player_phone"`.
- **P7: the §7.8 sample breaks the plan's own rules.** "Confront her now" is a verdict but does not say it cannot be undone (§7.4), and it does not set `a_key_choice`, although the credits branch on it (G9). It prefixes a phone contact's lines with `HaX:` (ink README common bug 4; G8). It ends knots in `-> END`, as do the §7.4 and §7.5 samples, which goes against the hub-return convention (README_ink_best_practices.md:486, :858-881; compile-ink.sh warns on every `END`). In a hub phone ink, `-> END` after a forced call also leaves no hub on reopen.
- **P8: speaker prefixes.** The §7.3 sample uses `Marsh:`. A prefix must equal the NPC's `id` or `displayName` exactly (ink README:30-50), and the plan gives no displayNames. Either give displayNames or show full-name prefixes in the samples.
- **P9 = G14, which also touches fixture B:** the person-chat strip fallback (`person-chat-minigame.js:1605`, `[A-Z][a-z]+`) and dialoguelint do not handle accented letters. B's "Tomás Rivera" resolves through the exact displayName match, but dialoguelint may skip his lines just as it skipped "Céline" in this draft. Worth a line in §9 or a check by P10-K-B.
- **P10 = G6:** a notes item shows its `text` whatever its trigger's condition says. After a wrong call the coats would describe a ward charm and grant nothing. The plan should require a `textVariants` entry on `a_lodge_suspicious`.
- **P11 = G5, G7, G10, G11, G12, G13 (unspecified):**
  - The camera is called both a trigger and a `triggerOnInteract`, and an `emit_event` trigger's room cannot be inferred.
  - `routes: []` for the favour-only burner SIM: does DL18 count the implicit favour route?
  - Nothing says what the brass key opens; it must not open the sanctum.
  - The log filter's required `minigameData` is not given.
  - The harness has no command for lockpick, dusting or log filter, and the punch key is not named.
  - Dusting: `fingerprint_identified` fires only when the player identifies the lift in the minigame. "Log as unidentified" fires nothing (`dusting-game.js:557`, `biometrics.js:96`). The plan should say what happens to a player who logs Marsh's lift as unidentified.

Draft fixes made in this check: none needed.

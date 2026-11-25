# demo_ops_second_step: implementation review R2

Reviewer: Opus, read-only, round 2. Branch `ops-follow1`, worktree `/data/be-ops-follow`, at `30ff0d506` (round 1 fix).
Read: `IMPL_REVIEW_R1.md`, `DIALOGUE_REVIEW_R1.md`, `planning/BUILD_REPORT.md` (round 1 section), and the diff of `30ff0d506` (scenario, Ama and Thandiwe ink, PLAYTEST, VOICED_LINES, test). I traced the needs runner and the mapping and room-load code in `public/break_escape/js`.

**Verdict: clean.** Every round 1 blocker and major from both reviews is closed. Three new minors are listed below, and none of them blocks a beat.

## Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb scenarios/demo_ops_second_step/scenario.json.erb` | 0 errors, 20 warnings (the same kinds as R1). The regenerated `dungeon_graph.*` match the committed files (no diff). |
| `bin/inklecate` on all 7 `.ink` files into the scratchpad, compared with the committed `.json` (key-sorted) | all 7 compile with no errors and match the committed files |
| `dialoguelint.mjs` (node 22) | "Totals by rule: none". It still measures 0 lines (dialogue m1, deferred: see below). |
| `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test test/controllers/break_escape/demo_ops_second_step_scenario_test.rb` | 17 runs, 284 assertions, 0 failures (R1: 14 runs, 209 assertions) |
| Scope of `30ff0d506` | It touches only `scenarios/demo_ops_second_step/` and its own test. `AccessLeakScanner.new(scenario, game:)` is an existing keyword (`tools/playtest/lib/access_leak_scanner.rb:353`), so no shared file changed. |
| VOICED_LINES | Every new or rewritten line is listed (the kitchen bark, both gate refusals, the "What's next?" kitchen line, the pestered bark, Yusuf's two lines, Darren's bark, Thandiwe's choice and Ama's new log recap). |

## Implementation review R1

| Finding | Status | Evidence |
|---|---|---|
| **B1**: kitchen targets are unloaded, so coffee (Anjali) and lunch do nothing | **Closed** | There is a `kitchen_seen` global (`scenario.json.erb:126`). It is set by a onceOnly `room_entered:kitchen` mapping on Ama (`:273`). Ama is in the start room, so she is always loaded. `lever_coffee` and `lever_lunch` return to the hub with a refusal until it is set (`ama_owusu.ink:145-150`, `:166-170`). The VAR is synced (`:9`). The Kitchen opens only from the Office, and a room load happens on door open (`systems/doors.js:888`), so during the session both rooms are loaded when a lever first works. Lorna's coffee target (office station) and the office staff's live `global_variable_changed` mappings are therefore present. The fixer's live run (game 197) saw the refusal with `coffee_call` 0, then one press moved all four staff, with Anjali at the Kitchen cooler. "What's next?" puts the kitchen straight after the card (`ama_owusu.ink:71-75`). PLAYTEST Runs A, B and C open the rooms first. BUILD_REPORT item 9 is updated. One reload edge remains: see new minor N1. |
| **M1**: the note, temper and share routes were untested and unscanned | **Closed** | There are three new cases (`..._scenario_test.rb` "M1", "M2", "M3"). They cover: Anjali's `postitNote` with `no-store` and no note on the other three PCs; Darren with no note until two fails and the writes_down "done", then a third fail gives no second run; an unheard Yusuf share returning `{}`, the share repeating, and a heard share in the office giving the capture, the line and `sharedLogins`. `run_game` now calls `login_accounts`, `npc_frustration` and `npc_workaround` before the sign-ins, and asserts `scan(@log) == []` with no filter. |
| **M2**: Run C cannot earn Darren's note before lunch | **Closed** | Run C now opens with the rule that lunch fires once only. Step 1 is: rooms, printer off, wait for "That's it. I'm writing it down." and the tick, then lunch. Run B no longer presses lunch (step 5). |
| m1: temper note read at the desk | Closed | PLAYTEST Run A step 7: the task ticks when he writes; the note is read at lunch. |
| m2: expired push row | Closed | Free play: twenty sends write the expired row. A wait past five minutes writes none. |
| m3: `promptsSent` and the merged row | Closed | The M4 test asserts `promptsSent` 1 then 2, `rows('mfa_prompt_sent').size == 1` and `n == 2`. |
| m4: no line when Darren gives in | Closed | The `mfa_approved:darren_price` mapping is onceOnly with the bark "He approved just to make it stop." (`scenario.json.erb:282`). |
| m5: the cake can spoil M5 | Closed (doc) | PLAYTEST: keep the cake until M5 is done. The scenario is unchanged, and that is reasoned in BUILD_REPORT. Acceptable. |
| m6: untrue barks | Closed | `:286` "Darren's popped out. If it's a quick coffee, his screen stays open."; the short version now says "by the coffee machine". |
| m7: office relays fire on later entries | Closed (doc) | BUILD_REPORT item 4. |

## Dialogue review R1

| Finding | Status | Evidence |
|---|---|---|
| M1: the midday order wastes the one lunch | Closed | "What's next?" is now in this order: fob, phone, then `not act_midday`, then pestered (`ama_owusu.ink:95-111`). The fob line names the coffee lever. |
| M2: Yusuf's said-aloud line | Closed | "Use my login, Anjali. Here it is." (`scenario.json.erb:622`). The fixer did not use the longer suggestion, for good reasons: the 40-character bubble limit and V11. |
| M3: Thandiwe's choice wording | Closed | `thandiwe_moyo.ink:18` "Can I see what I looked like from your side?" |
| M4: the burst's meaning | Closed | Thandiwe now says "flag the odd one out, a burst of requests to Darren in the small hours". Ama's recap: someone else had Darren's password first, "They were trying to wear him down." |
| m1: `# speaker:npc` with no prefix, so the lint measures 0 lines | Not closed (deferred, accepted) | The reviewer asked for all three showcases or the lint to be fixed together. Line lengths were checked by hand. The longest line is the joined short_version line, about 127 characters, which the reviewer asked for. |
| m2, m3, m7, m10, recap P5, short_version join | Closed | As suggested (diff of `ama_owusu.ink`). The recap is now one line per beat. |
| m4, m5, m6 | Closed | As in the R1 implementation table above. |
| m8: Anjali's dead `login_aloud` | Closed | Removed. |
| m9: one printer, "send it from hers" | Closed | "Printer's dead. I'll ask Anjali." and the share asks Anjali to log in as him. |

## Does every lever and routine work wherever the player is?

All five levers are pressed at Ama in Reception, so the question is which rooms are loaded at that moment. Rooms load only when a door opens (`doors.js:888`); at boot only the start room is built (`core/game.js:2266`). Nothing unloads a room during a session.

- **Coffee.** It is gated on `kitchen_seen`, which needs the player to stand in the Kitchen, so the Office and Kitchen are both loaded. Lorna's live mapping (`:316`) and the office staff's live mappings (`:559`, `:589`, `:628`) all fire. The targets are the office station, the kitchen cooler and (for Darren's social need) the cooler. The `room_entered:office` relays (`:556`, `:587`, `:626`) re-set needs on the next Office entry. They are documented and harmless.
- **Lunch.** It is gated the same way. Lorna's live mapping (`:317`) and Darren's (`:560`) fire, and the kitchen fridge and microwave are loaded.
- **Printer.** It is not gated, and needs no kitchen. It is a server-side resource outage (`printer_off`). The validator's work report confirms both workarounds admit `print_service` down while `printer_off`. If pressed before the Office loads, Darren and Yusuf fail on their first work tick after it loads. Yusuf's `share_login` walks to Anjali wherever she is, in a loaded room.
- **Call it a day.** Lorna and Niamh have live mappings. The office staff have `fireOnlyWhenLoaded` mappings plus `room_entered:office` relays with `cooldown: 0`. Thandiwe reads `act_evening` at the start of her conversation.
- **Approvals log.** It is reached in the IT room, which opens from the Office.

## New findings

**N1 (minor). After a page reload, the coffee and lunch gates are open but the Kitchen is not loaded.**
- `kitchen_seen` is a scenario global, so it survives a reload. The rooms do not: `initializeRooms` clears them, and only the start room is rebuilt (`core/game.js:2266`).
- So after a reload, "Send them for coffee." says "Right, coffee for everyone". Lorna's need parks with no loaded office station, and Anjali's parks with no loaded cooler. The office staff's live mappings do not exist yet (the relays catch them on Office entry).
- It heals itself. `door_opened` calls `onDoorOpened`, which clears back-offs and wakes the parked needs (`systems/npc-needs.js:818-821`). So walking into the Office, and for Anjali into the Kitchen, starts the trips.
- None of the PLAYTEST runs press a lever for Anjali after the Run B reload: step 4 needs only Yusuf and the office coffee. No beat is lost.
- `office_life_showcase` has the same gate and the same edge.
- Fix: one clause in PLAYTEST's reload bullet ("after a reload, open the Office and Kitchen doors again before a lever: staff only walk to rooms opened since the reload"). An engine fix would be to rebuild discovered rooms on resume, which is out of this folder's scope.

**N2 (minor). The BUILD_REPORT onceOnly budget disagrees with the validator.**
The round 1 table says "onceOnly budget 8/10". The validator's V8 line reports "office-life onceOnly mappings 6/10". Ama's new kitchen and pestered onceOnly mappings are presumably not counted as office-life ones. Make the report quote the validator's figure.

**N3 (minor, carried). dialoguelint still measures nothing in this scenario** (dialogue m1, deferred by agreement). Flag it to whoever owns the cross-showcase prefix or lint change, so that the voicing pass does not rely on "Totals by rule: none".

## What holds

- The kitchen gate is checked in ink, not by a hidden condition. The refusal says why ("That's where the water is, and Anjali won't move without it."), and the kitchen bark tells the player to come back.
- The test now covers every server route that hands out a password, and the leak scan sees them all with no filter.
- There are no passwords in the ink, chatter, PLAYTEST, VOICED_LINES or graph (rule 7 unchanged). Yusuf's said-aloud chatter names no value. The password reaches the player only in the server's heard-share `line`.
- Each spoken line is UK English and plain. The recap is one line per beat.

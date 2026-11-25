# demo_ops_recon: implementation review R2

Reviewer: implementation review, round 2. No code was changed. Worktree `/data/be-ops-follow`, reviewed at fd39b3132 ("Ops showcase recon fix: round 1"). Inputs: `IMPL_REVIEW_R1.md`, `DIALOGUE_REVIEW_R1.md`, and `BUILD_REPORT.md` "Round 1 fixes".

**Verdict: clean.** 0 blockers, 0 majors, 6 minors (new, listed below). Every round 1 finding from both reviews is closed. No finding was closed wrongly. One minor (n1) needs a browser check on resume.

## What was run

- `ruby scripts/validate_scenario.rb scenarios/demo_ops_recon/scenario.json.erb --no-graph`: 0 errors, 24 warnings. These are the 23 from wave 2 plus the realism-wording false positive on `ama_owusu.ink:184` that BUILD_REPORT lists. Dialogue lint: no findings.
- `./scripts/compile-ink.sh demo_ops_recon`: 6 compiled, 0 failed, with the usual six `-> END` notes. The compiled `.json` files did not change.
- `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test test/controllers/break_escape/demo_ops_recon_scenario_test.rb`: 19 runs, 282 assertions, 0 failures, 0 errors.
- Commit scope of fd39b3132: only `scenarios/demo_ops_recon/**` and the recon test. (The uncommitted `demo_ops_passwords` edits in this worktree are someone else's work and were left alone.)
- No server or browser run (not allowed in this review). Every client-side claim below comes from reading the code.

## Round 1 findings

### Implementation review R1

| Finding | Outcome | Evidence |
|---|---|---|
| M1: Zainab never reaches the kitchen | Closed | `lever_day_end` (`ama_owusu.ink:136-140`) refuses until `kitchen_seen` and `server_room_seen`. Both flags are set by Ama, who is in the start room and so always registered (`scenario.json.erb:471`, `:485`). Rooms never unload (`npc-behavior.js:19`), so once both flags are set, Zainab's `fireOnlyWhenLoaded` mappings (`:767-768`) are registered and `kitchen_coffee` is a target she can reach. The kitchen coffee is on in the evening (`offWhen {office_coffee_off:false}`, `:642`, with Ama's `:484`). All the text was updated: the day-end line, "What's next?" (`:99`, "server room or at the kitchen coffee") and the notice board. BUILD_REPORT records a live check. The resume case is minor n1. |
| M2: realism text promised but not built | Closed (option a) | `mission.json` no longer says "with realism text". No ink line claims catalog text (see dialogue M1). The note in the plan's section 1 table is left to the orchestrator, as BUILD_REPORT says. |
| M3: placement of the hot desk port and Jun's catch | Closed | The port moved to (3.0, 5.9). The second catch is `npc_returned_post:jun_watanabe` with `playerDistance <= 80` (`:555`). Its payload comes from `_playerProximity` (`npc-needs.js:1526`, `:3618`, `:3931`), which is the player's distance to Jun. `_checkCaught` runs on the walk back, before the arrival tick (`npc-needs.js:1505` before `:1512`). So when the 48 px catch fires first, it sets `jun_caught` (`:552`) and the returned-post mapping does nothing: one bark per return. `npc_left_post` clears the flag (`:554`). The distance is raw Euclidean with no same-room test (`npc-needs.js:5641-5653`). From the kitchen side of the west wall, the player is more than 80 px from the desk, so this is not a fault. The cupboard was checked in a render. The tool roll was not rendered (BUILD_REPORT says so). |
| m1: the kitchen port leaves "What's next?" stuck | Closed | `:487` ticks `plug_in` and sets `plug_in_done` on `network_foothold_gained:kitchen_jack`. The extra task tick is argued in BUILD_REPORT, and I agree with it. |
| m2: the Terminal tick is offered at once | Closed | `ama_owusu.ink:52` is gated on `file_server_seen` (set by `network_host_scanned:file_server`, a host id). There is a way back out (`:167`). See n4. |
| m3: weak assertions | Closed | `where.kind` is checked unconditionally. The invented finding asserts `:not_found`. The printer that is switched off asserts 403 `not_responding`. The test name now matches its body. See n6. |
| m4: the leak run skips refusals | Closed | The recorded run now adds the kitchen plug-in and unplug, the sweep and scan with the printer off, `not_confirmed`, `wrong_class`, `need_unmet` and the three refused shared-drive answers. The scan still reports 0 findings. |
| m5: two refusals not tested | Closed | Card 3 is refused on `release_line` and on the camera decoy. Zainab as the source of `card_open_settings` is refused. |
| m6: Agnieszka's printer trips | Closed (dropped) | PLAYTEST no longer asks for them. |
| m7: Graham's screen-lock line; missing observations | Closed | The line is cut. Both power sockets now have observations and distinct names. |

### Dialogue review R1

| Finding | Outcome | Evidence |
|---|---|---|
| M1: the Terminal teaching is untrue | Closed | `ama_owusu.ink:163-165`, `:213`. |
| M2: Graham's hint points at the wrong row | Closed | `graham_whitfield.ink:51` names the sweep from the kitchen port. The anomaly is `s2`, the 07:12 `network_swept` row from `kitchen_jack`. The log PC observation was fixed. |
| M3: Graham's offer is written as the player's line | Closed | The choice is now "Ama said you'd show me the network log." and Graham asks "Want to see what you looked like from here?". It is gated on `not read_log_done`, and that variable is declared in both the ink and the globals. |
| M4: "socket" points at the power sockets | Closed | No ink line says "socket". The port is named "Hot desk network port". The power levers are now "Printer wall socket" and "Coffee wall socket". |
| M5: stale coffee line | Closed | `ama_owusu.ink:70` holds in every state. |
| M6: honour-system Terminal tick | Closed | See impl m2. |
| M7: nobody points at the saved link | Closed | The `use_card_done` bark (`:491`) and the recap line (`ama_owusu.ink:209`). |
| M8: too few beat barks | Closed | `:488-493`. Each bark is on `global_variable_changed:<x>_done`, with `oldValue !== true` (npc-manager emits `oldValue`, `npc-manager.js:1818`) and a test that the next step is still open. |
| m1 to m12 | Closed | Ama's day-end line and "What's next?" now cover the evening (user session, admin session, tool roll). Chidi's topic is now about the network. Jun's tell, Agnieszka's lines, Zainab's question, Ama's introduction, "user session first", the cycling greeting, the recap split into three choices and the lunch line are all fixed. Graham's offer is gated. |

## The levers and routines, traced

- **Coffee (morning).** Chidi and Jun set caffeine to 20, which is urgent (`:520`, `:550`). `office_coffee` is in the office, which is always loaded. The kitchen coffee is off while the office coffee is on. This works wherever the player is.
- **Lunch.** It waits for `kitchen_seen`. Chidi and Jun (hunger 20) and Agnieszka (62) are office NPCs, and their food is in the kitchen, which is now loaded. Graham's `fireOnlyWhenLoaded` mapping works when the IT room is loaded. If it is not, the `room_entered:it_room` relay catches up. Agnieszka and Graham at 62 (urgent at 40) leave about 5.5 minutes later. That was already true in round 1 and is not a fault.
- **Day end.** This is traced in impl M1 above. The card hand-over is gated only on `act_evening`, so it works in any room.
- **Jun's catch.** This is traced in impl M3 above.
- **Ambient routines** (Agnieszka's thirst and Graham's social need at the cooler, and their exchange) do nothing until the kitchen, and for Graham the IT room, have been loaded. This is the same as `office_life_showcase`, and the validator lists it. No lever depends on these routines.

## New findings (minor)

**n1. After a resume, the room-seen flags stay true but the rooms are not loaded again.** On load, `game.js:2198-2240` loads only the start room. `kitchen_seen` and `server_room_seen` are saved globals. So after a resume, Ama allows lunch and "Call it a day", but:
- the kitchen is not loaded until the player walks in again;
- Zainab is not registered until the player walks in again, so `:767-768` never run;
- "Zainab will head for the kitchen coffee" does not happen until the player has entered both rooms again (the `:769` relay then sets her caffeine).

Nothing gets stuck: the card works anywhere, and "What's next?" names the server room. PLAYTEST allows runs B and C in one game, and run B ends with a reload. C0's "at least once" will not catch this.

Fix (pick one, then check in the browser):
- (a) Give Ama a mapping on the load event that resets both flags. First check that the event reaches NPC mappings.
- (b) Have C0 in PLAYTEST say "since the last reload", and accept the gap.

**n2. In the evening, Zainab leaves every time the player walks into the server room.** The relay `:769` (caffeine 10, `cooldown` 60 s, no `onceOnly`) fires on every entry once `act_evening` is set. With round 1's gate, `:768` already covers a single sitting, so in practice the relay only matters after a resume (n1). Each time the player comes for the tool roll or to talk to her, she sets off for the kitchen, even straight after a coffee. Fix: add `"onceOnly": true`, or a condition such as `globalVars.zainab_card_given !== true`.

**n3. Graham has the same problem with lunch.** `:842` resets his hunger to 62 on every IT room entry after lunch, including the evening log visit. So after each visit he goes back for another lunch about 5.5 minutes later. Fix: add `"onceOnly": true`.

**n4. The coffee and lunch levers are still offered after "Call it a day".** Their lines ("Chidi and Jun will head for the machine", "Staff drift off their desks, Jun included") describe people who have gone home (`setVisible:false`, `:522`, `:553`). Fix: gate both on `not act_evening` (`ama_owusu.ink:46`, `:48`).

**n5. The file server bark ignores the Terminal.** `:492` fires on any scan of the file server, Panels included, and possibly before the card step. "That's the file server. Come and tell me what it said." does not mention the Terminal, while the hub choice it leads to is "I looked at the file server in the Terminal." Suggested wording: "That's the file server. Try it in the Terminal too, then tell me what it said."

**n6. The new Zainab-source refusal test checks only that the status is not 200.** It uses `refute_equal 200`, the loose form that impl m3 removed elsewhere. Assert the exact status.

## Not checked

- The tool roll's placement (7, 4.2, elevation 24) was not rendered.
- n1 needs the browser.
- The realism wording warning on `ama_owusu.ink:184` is a false positive caused by variable names. It is listed in BUILD_REPORT.

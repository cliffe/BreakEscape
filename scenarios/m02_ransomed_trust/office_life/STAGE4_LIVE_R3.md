# m02 office life: stage 4 live checks, round 3 (2026-11-15)

Branch `build/ol-m02` at e4bb34454, keyless server on port 3092 (stopped at the end), headless Chromium, `setFPS(20)` with fixed steps on. Real punches (key f), real dialogue choices. Scripts, logs, screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/m02-live-c` (`out/`). No scenario, ink or engine edits. A reload puts the player back in the start room (reception for games begun there, the corridor for the others), by design. Games: 5233 (reception start, walked to the staff room), 5235, 5236, 5237 and 5238 (corridor start); 5234 was created by mistake and unused.

## 1. New ink

| Check | Result | Evidence |
|---|---|---|
| Ernesto greeting plays once, with the "You with IT?" choice | pass | 5233. "Evening. Or morning..." then the question; answered "Security..." |
| Hodan greeting plays once | pass | 5233. "You lost? Everyone's lost tonight." with her opening choices |
| Re-entry line after a reload, no greeting replay | pass | 5233. Ernesto "Back again?", Hodan "You again." |
| Ernesto's security choice does not return after a reload; radio topic reads it back | pass | 5233. After reload no question; "Busy night on the radio?" answered "Your lot sorted it, I expect. Paying you nights after all." (the told-security branch) |
| Cleared radio lines after the cleared exchange (his ink sees `heard_night_watch_cleared`) | pass | 5233. After the cleared exchange his topic gave "Security had a call out for some visitor. Stood down now."; Hodan's "Did security find their visitor?" topic appeared |
| Radio topic, burned but not cleared, and not-told branches | not run | only the cleared plus told branch was reached |

Note: `cover_restored` and `bernie_vouched` were both true in 5233 without my visiting Bernie or Val after the burn (checked by reading globals after a reload). I did not find which in-game step set them. The cleared exchange's gates held (it played only then), so the exchange is not at fault, but the route is unexplained.

## 2. Cleared exchange not replayed after a reload

| Check | Result | Evidence |
|---|---|---|
| No exchange replay after reload | pass | 5233. The cleared exchange was heard once; after a further reload, 150 s in the staff room: zero exchange events, only pool chatter. `heard_night_watch_cleared` stayed true |

Trigger used: the game's own flow (Gary's burn conversation, then whatever set `cover_restored`, see the note above), no harness global.

## 3. Reloads, printout, KO

| Check | Result | Evidence |
|---|---|---|
| Reload mid-exchange | pass | 5235. Reloaded after paper line 2 of 5, `heard_night_watch_paper` still false; after reload the exchange replayed from line 0, all 5 lines, one `exchange_heard` complete true, global true |
| Take the printout, then reload | partial | 5236 and 5237. Gary's print worked (flag set, 5 s after the conversation; 5237 take via menu worked, ok true). In 5236 the take was blocked by an HaX bark and after the reload `it_copier_page_shown` was false (server player_state agrees) and the page hidden. In 5237 after the reload the flag was true and the page object absent from the room, but my inventory filter showed only `gary_whitlock_held_0`, so I could not tell whether the page went to inventory. Open |
| KO across a reload (real punches) | pass | 5237. Hodan KO at punch 10, hp 0, credits show only her line (struck line and porter hidden), two HaX texts both delivered, porter wary greeting. After reload: `hodan_warsame_ko` true, hp 0, credits unchanged, no HaX text re-sent in 15 s, porter idle, no break, wary line kept |

## 4. Walkthrough 10.1

| Step | Result | Evidence |
|---|---|---|
| 12, IT door | pass | 5233. `open_it_department` completed 04:03:23Z |
| `verify-run.rb` shows progress | pass | 5233: "progress recorded, 9 rooms beyond the first", 7 tasks completed, score 17 |
| 4 (Val's catch), 5 | not run | out of budget |

## 5. Copier page at x 6.92

| Check | Result | Evidence |
|---|---|---|
| Page on the copier during/after a print | pass | 5238. `out/copier-page-5238.png`: the page sits on the copier's output tray at (541, -46) beside the copier (522, -50), visible, not overlapping Gary (who is at his desk) or the wet-floor sign |

## 6. Not run

40 s mid-break variants; a break left to run with the player outside; radio topic on the burned-not-cleared and not-told branches; Val's catch (step 4); step 5.

## 7. Printout and cover flags (follow-up, 2026-11-15)

Keyless server on 3092, headless, `setFPS(20)` with fixed steps. Games 5239 (print, reload before taking) and 5240 (print, take, reload), both begun in the corridor. Scripts and logs are in the scratchpad folder `m02-printout`. No scenario, ink or engine edits.

### The printout

Code path. After a reload the room loads and `revealRoom` hides any `revealOnGlobal` object whose global is not true (`core/rooms.js:3126`). The needs system then runs `stowRevealedSlots` on the rooms-loaded event (`npc-needs.js:1124` to `:1129`, `:5337`): any print slot that is revealed with its global still true and that nobody holds is filed away by `stowSprite`, which hides it and sets its global back to `false` (`:4791`). The needs state is fresh after a reload, so nobody ever holds it. The print mapping is `onceOnly` and saved, so nothing prints again. A taken page is different: the server leaves a taken item out of the room data, so there is no sprite to stow, the global stays `true`, and the page lives in the server's inventory.

| Case | What the player sees | Evidence |
|---|---|---|
| Printed, not taken, reload | The tray is empty. `it_copier_page_shown` is false (client and server), the slot object exists but is hidden and not interactive. Nothing reprints, including after a second talk with Gary and 8 s in the room. The page is gone for the run | 5239: after reload `vis false, inter false`, flag false, notepad holds no "Downtime Fault Log", server inventory has no `it_copier_page` |
| Printed, taken, reload | No page on the tray (the flag stays true and there is no slot object). The page is in the notepad as "Downtime Fault Log", once, and once in the server's `player_state` inventory | 5240: the take returned ok; after reload the notepad list has one "Downtime Fault Log", `rooms.it_department` has no `it_copier_page` object, server inventory lists `it_copier_page` once |

Why my R3 check missed it: a `notes` item goes to the notepad, not the tray, so `inventory` filters never list it. Check `window.gameState.notes` or the server's `player_state["inventory"]`.

Duplicates: none in either case. Lost clue: none. The page is flavour, not a clue. It is a blank downtime fault log, no objective, lock, ink gate or flag reads it (the only references are its own object and its reveal global, `scenario.json.erb:2353`, `:3791`), and PLAN 3.1 and 10.3 already record that reloading before taking it loses it, accepted. So the live result matches the plan; the R3 "open" item is closed.

Fix: none made. A data-only re-reveal mapping is not clearly right. The scenario condition has the globals but cannot tell whether the page was taken, so a mapping that re-raises `it_copier_page_shown` would also fire after a take and could put a second slot on the tray, and the stow-on-sight pass would race it on every room load. If the user wants the not-taken page to survive a reload, the engine change is in `stowRevealedSlots` (`npc-needs.js:5337`): skip a print slot that is revealed, still in its room and not held, when the load is a reload, and leave its global true (the `setGlobalVar(g, false)` at `:4791` is what loses it). That is a design choice for the user, not needed for the mission.

### cover_restored and bernie_vouched

Both are set only by ink tags: `bernie_vouches` in `m02_npc_receptionist.ink:293` to `:296` (after the burn, from Bernie's hub), and Val's `show_lanyard`, `bernie_backs_you`, `earn_it` knots in `m02_npc_security_guard.ink` (`:215`, `:245` to `:249`, `:281`). `bernie_backs_you` sets both. No scenario mapping or engine code sets either.

Val's challenge starts by itself. After the burn, the first `room_entered:office_corridor` runs her `cover_challenge` knot in person-chat (`scenario.json.erb:3396` to `:3401`, `onceOnly`). When the player has Bernie's trust (`bernie_trusts_player`), the challenge offers "Ring Bernie on reception" (`m02_npc_security_guard.ink:192` to `:196`), which is `bernie_backs_you`. Game 5233's saved state shows exactly this: `val_challenged`, `warned_player` and `cleared_after_burn` true in Val's ink variables, `bernie_trusts_player` and `bernie_gave_key` true, and `security_guard_patrol:room_entered:office_corridor` in `triggeredEvents`. So the tester did meet Val after the burn (the corridor walk fired her challenge and the scripted conversation chose Bernie's backing), without seeing it as a separate visit. In fresh games 5239 and 5240 the burn alone left both flags false.

Office life did not change this. `git diff 340c93122 HEAD` shows no change to `m02_npc_security_guard.ink`, `m02_npc_receptionist.ink` or the corridor mapping, and the only scenario lines mentioning `cover_restored` that are new are the Ernesto exchange's `requireGlobal` gate. This is the mission's normal behaviour.

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

# m05 pass-4 pre-commit browser check

**Question answered:** plumbing only, on the six playtest-round fixes in `scenarios/m05_insider_trading/DIALOGUE_REVIEW.md` section 8. Not a solvability pass.
**Setup:** keyless server :3001 (nothing on :3000 touched), headless (load average about 12), fast speed. Three games, each stopped with `{"cmd":"sync"}` then `session-stop.sh`.

| Game | Used for | Session log |
|---|---|---|
| 1444 | items 1, 2, 3 (print not lifted), 6 | `tools/playtest/m05-pass4-precommit-session.jsonl` (615 commands) |
| 1446 | items 5, 4, 3 (print already lifted), 1 (displaced) | `tools/playtest/m05-pass4-precommit-session2.jsonl` |
| 1447 | item 1 (clean, Halloran undisturbed) | `tools/playtest/m05-pass4-precommit-session3.jsonl` |

Scratch (screenshots, transcripts, verify output): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/129f788c-d240-4d67-b97d-c380ab27daf1/scratchpad/m05-precommit/`

## Results

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Halloran at (6,6): on open floor, reachable from the front and from the arrival | **PASS** (one harness caveat) | Game 1447 screenshot `g3-front.png`: she stands on open floor just below the chair row, in front of the middle desk, nothing overlapping her. Position at home (-128,-223). Player at (-123,-193) approaching from the south: plain distance 30.3 px, `inRange:true`, `interactDistance` 30.3 against the 32 px range; `interact` opened her person-chat. Game 1444, from the arrival side via `moveTo`: stopped at (-140,-246), 28.7 px, in range, conversation opened. Caveat: `moveToNear` from the east door aims into the desk row and stops at (-98,-290) / (-164,-290), 73-76 px away, `arrived-but-outside-plain-range` (the harness walks the straight line into the desk). A plain `moveTo` to a point south of her gets in range both times, so I treat it as a harness approach issue, not a reach problem. |
| 2 | Owen: "I'll need your help with access" sticky until used; "I need into David Torres' office" gone after the card | **PASS** | Game 1444, hub transcript: choice present at first menu, still present after "What can you tell me about the data leaving the building?" and after "Where are the security gaps?" (hub choice 3 both times); after picking it ("Sure. I hold the spares for most of the doors here. Give me a reason I can write in the log and they're yours.") it is gone from the next hub. Then with `torres_suspected` and `patricia_authorised_office` set by console (**exercised**), "I need into David Torres' office." appeared, gave "IT Spare Office Card" (inventory confirmed), and was absent from the hub straight after and after closing and reopening the conversation. |
| 3 | Vault reader text arrives before any "That's Torres' print"; says "You've already lifted his print. Use it." when the print is already lifted | **PASS** | Game 1444 (print not lifted): interacting with the key-vault door fired `vault_reader_seen`; the HaX thread's last bubble is "Fingerprint reader on the key vault. It takes the cryptography lead's print, and you've got the kit." No "That's Torres' print" bubble present, `torres_print_collected` false (real route: Owen clone, password note, server room door). Game 1446 (print already lifted): `torres_print_collected` set by console (**exercised**; I did not dust the mug), then the vault door: last bubble "That's the vault reader. You've already lifted his print. Use it." and the "Fingerprint reader on the key vault" text did not arrive. I did not lift a real print afterwards, so the ordering "pointer, then print text" is shown by absence of the print text, not by both arriving. |
| 4 | Patricia acknowledges suspending Halloran after a wrong accusation, in person and by phone | **PASS** | Game 1446, `found_door_log` set by console (**exercised**; real source is Owen's give_door_log). In person: "Dr Ruth Halloran." accepted ("I'll suspend her access..."), then David Torres with "Check who comes in the front door just before the spare is used." gave "And Ruth's sitting in her lab, suspended on your word. That's on both of us now." (`patricia-inperson.txt`). By phone, same game, Patricia contact, "I know who it is." then David Torres then the same reason: identical line shown in the thread (`patricia-phone.txt`). I did not exercise the `significant_findings` variants ("suspended Ruth on your say-so"). |
| 5 | Briefing states the death toll on the fast route | **PASS** | Game 1446, briefing driven by hand (no `bootstrap`). Route: What's the damage so far? -> Walk me through the objectives -> And the third? -> What's my cover? -> Who else will I meet? -> I'm ready. -> Fast and direct. This path skips every earlier toll branch; `knows_full_stakes` was `false` before the menu. After "Fast and direct": "Speed's good." then "Thirty to forty-five lives ride on that upload. Keep the number with you." then "Move fast, but the police will still need a file they can use." `knows_full_stakes` then `true`. Transcript `briefing-fast.txt`. |
| 6 | Credits include "CIVILIAN LIVES SAVED" | **PASS** | Game 1444, MutationObserver on `document.body` reading `#bv-cr-label` and installed before the debrief. Credits read: MISSION COMPLETE / INSIDER TRADING / OPERATION SCHRÖDINGER: STOPPED / **CIVILIAN LIVES SAVED: 30-45 (estimated, first rollout wave)** / ── THE CASE ── / RECRUITMENT PIPELINE — TalentStack link not documented / WRONG ACCUSATION — Dr Ruth Halloran suspended, then cleared (observer cut off after that; it was sampled over about 30 s). It shows with `halloran_accused` set, so the line is not tied to the old condition. Screenshot `credits.png` (visualiser overlay with the WRONG ACCUSATION line scrolling). |

## How game 1444 reached the credits (console help, all "exercised, not earned")

The first attempt set `final_choice`, flag1-4 globals and `halloran_accused` / `door_log_reasoned` by console, then emitted `global_variable_changed:flag4_submitted`. That started the real debrief (ran to "That's everything.", HaX lines include "That was thirty to forty-five people, in the first wave alone.") but no credits, because the server refuses to conclude until `submit_flag1..4` are persisted. I then submitted the four stand-in flags (`<flag:1>`..`<flag:4>`) at the drop-site terminal in the server room, and emitted `conversation_closed:closing_debrief_trigger` through `window.eventDispatcher` to re-run the credits entry. Everything downstream of the flags is exercised, not earned.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Owen's staff badge (rfid) | cloned EM4100 | Owen's "(Lean over his log screen...)" choice and the cloner (games 1444, 1446) | before the server hallway door | yes |
| Server room password | `quantum2024` | "Server Password Sticky Note", given by Owen after "Security's signed it off" | before the server room door | yes for the note; the sign-off flag `patricia_authorised_server` was set by console, so the Patricia step was **not earned** |
| IT Spare Office Card | item | Owen's "I need into David Torres' office." | after `torres_suspected` and `patricia_authorised_office` set by console | **no** (console prerequisites) |
| `found_door_log` (game 1446) | flag | real source is Owen's log hand-over, which needs `found_incident_log` | n/a | **no**, set by console |
| `torres_print_collected` (game 1446) | flag | real source is lifting the mug print in Torres' office | n/a | **no**, set by console |
| Flags 1-4 (game 1444) | `<flag:1>`..`<flag:4>` | none: no VM in standalone | n/a | **no** |

Steps downstream of the "no" rows are exercised, not tested. Item 1, item 5 and the vault-reader text in game 1444 rest on nothing set by console (item 5 and item 1 in game 1447 have no console help at all).

## verify-run.rb

- **1444:** `VERDICT: progress recorded — 5 rooms beyond the first, 0 objects unlocked, 4 flags submitted.` Rooms: reception_lobby, main_corridor, open_office_area, research_lab, server_hallway, server_room; inventory includes IT Spare Office Card and Server Password Sticky Note; 27 globals incl. `debrief_played`, `vault_reader_seen`, `halloran_accused`, `flag1..4_submitted`.
- **1446:** `VERDICT: progress recorded — 6 rooms beyond the first, 0 objects unlocked, 0 flags submitted.` Rooms include patricia_office and server_room; 21 globals incl. `halloran_accused`, `torres_print_collected`, `vault_reader_seen`, `knows_full_stakes`.
- **1447:** `VERDICT: progress recorded — 3 rooms beyond the first, 0 objects unlocked, 0 flags submitted.` (Item 1 only.)

## Other observations (not asked for)

1. **Halloran does not return home after a bump.** In game 1444 she was walked into at (-128,-220.6); she ended at y=-185.5 and was still there 15 s later, with the player 62 px away. In game 1446 she was pushed from -223 to -163.7. The review note says her "return-home" after a bump; I did not see it within 15 s. Players can also walk straight through her sprite (the player's path from the chair row to the south passed through her), which is how she gets pushed. If she is meant to snap back, it is not visible on this timescale; I can't say which is intended.
2. `bootstrap` through the briefing timed out in games 1444 and 1447 (cutscene choice loop) but left the game playable after `mg close` and dismissing the tutorial prompt; consistent with the pass-4 gotcha. In 1444 it picked briefing choice 1 at each menu, which is why item 5 was run in a separate game.
3. The first lane to the lab door (`enter research_lab`) needs two to three calls plus a `moveTo` and a `walk left` before the player crosses; the door opens on the first attempt and the room change follows the walk. Harness behaviour, same as the pass-4 notes.
4. No spoken-line text was changed or generated; keyless server, so no TTS cost.

Assumptions to challenge: (1) "front of her desk" read as the open-floor side south of the chair row, where she stands. (2) Console help for the credits run (stand-in flags plus an emitted `conversation_closed` event) counts as the "one short completion via console flags" you allowed. (3) I treated the `moveToNear` stop at the desk as a harness path issue, not a layout finding, because `moveTo` reaches her at 25 to 30 px from both sides.

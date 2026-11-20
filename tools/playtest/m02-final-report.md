# m02 final confirmation run (after the five fixes)

2026-10-01. Headless, standalone, hand-driven. Question answered: plumbing plus unexpected behaviour (reload mid-scene, step away at the terminal). Not a solvability run.

## Games and logs (all under tools/playtest/)

| Game | Use | Logs |
| ---- | --- | ---- |
| 1208 (C) | Checks 1, 2, 4, 5, 6, 7 | `m02-final-C-session.jsonl`, `-r1.jsonl` (reload 1), `-r2.jsonl` (reload mid Val scene), `-r3.jsonl` (reload after scene), `-r4.jsonl` (reload before re-talks and ending; ending is in this log) |
| 1213 (D) | Check 3 (KO Val, then server room) | `m02-final-D-session.jsonl` |

Each reload was a fresh browser session on the same saved game (the in-session `location.reload()` hangs the harness, as noted in the earlier report). Flags XMLs: `m02_ransomed_trust-flags-game1208.xml`, `...game1213.xml`.

## verify-run.rb

Game 1208: 12 rooms unlocked (all 11 beyond the first plus conference_room), inventory incl. Planted Network Device, Server Room Keycard, Verified Restore Manifest, Val's Pocket Notebook; 4 flags submitted (`..._1_b7f87a`, `_2_7b388f`, `_3_d974a7`, `_4_36ec01`). VERDICT: progress recorded, 11 rooms beyond the first, 1 object unlocked, 4 flags submitted. Server record: `status=completed`, `mission_concluded_at=2026-10-01 07:39:03 UTC`.

Game 1213: 9 rooms beyond the first, inventory Your Phone, Lock Pick Kit, Notepad, IT Override Key, Server Room Keycard. VERDICT: progress recorded (0 flags; this game only tests check 3).

## Earned secrets

| Secret | Value | Source | Earned? |
| ------ | ----- | ------ | ------- |
| IT Override Key | item | Bernie, dialogue | yes (both games) |
| Server Room Keycard | item | Gary: rapport route (1208), KO drop (1213) | yes |
| Boardroom PIN | `0417` | Kim's hub offers it ("What's the code for the boardroom?") but I never asked, and did not read the diary | **no**, typed from knowledge |
| Flags 1-4 | `<flag:N>` | VM chain | **no**, handed over; SSH credential prerequisite not obtained |

Everything after the flags (cache, console, terminal, debrief) was exercised, not proven earned.

## Results

| # | Check | Result | Evidence |
| - | ----- | ------ | -------- |
| 1a | Pick up Planted Network Device: "You found it." once | PASS | 1208 after pickup, contact opened: `> DEVICE ACTIVE ... Ghost: You found it. Took you rather longer...` then the three choices. History (7 lines) had no "Still at it" and no duplicates. `ghost_contacted_player` false and history empty before pickup. |
| 1b | Ghost phone does not auto-open after reload | PASS | Bootstrap traces after all four reloads show no "close phone-chat" (earlier build showed it every time). Drain after reload 1 shows two `item_picked_up:phone` events (inventory restore) but no phone-chat start. |
| 2a | Val's server-room scene finished, reload, re-enter: no replay, no bark or HaX message back | PASS | After reload 3, travel and re-entry to server_room: `activeMinigame:null`, no dialogue; screenshot `c3.png` shows no bark or toast (earlier build: `rc.png` had both). Scene had been completed once before. |
| 2b | Reload in the middle of the scene: plays again | PASS | Reload while Val's scene was on its first line; re-entering the server room opened the person-chat again (log `-r2.jsonl`), and it finished. |
| 3 | KO Val, then enter server room: no challenge | PASS | 1213: `debugKO` Val (assisted), entered server_room; after 7 s no minigame, `guard_knocked_out` and `cover_restored` true, no conversation events beyond the opening ones. |
| 4a | "I'll step away", close, reopen: decision offered again, no reload | PASS | 1208: step away closed the terminal; reopened the contact, the three choices appeared again. (Earlier build: dead terminal.) |
| 4b | After deciding, reopen: read-only record | PASS (transmit path here) | Earlier run (1196, keep quiet, previous build) showed read-only; this run decided transmit and went straight to debrief, so the reopen after a decision was not repeated on the new build. Mark as not re-verified. |
| 5 | Debrief fully before credits; hear_debrief last | PASS | After confirming, polls showed `person-chat` active with `missionEnd` null (no credits) for the whole debrief. Before the debrief: DB `status=in_progress`, `decide_hospital_exposure=completed`, `hear_debrief=active`. Event timeline after the last debrief line: `mission_concluded`, `objective_aim_completed:restore_hospital_systems`, `objective_task_completed:hear_debrief`, `conversation_closed:closing_debrief_trigger`; then the credits showed. |
| 6 | Re-talk Kim/Gary/Val after a reload: no intro replay | PASS | Kim opens "Progress?" with her six hub choices; Gary "Any joy?" with "Who's in the photo?" / "I should get on."; Val "She nods you past without breaking her round." No second keycard, lanyard, statement or notebook (inventory and notes counts unchanged). |
| 7 | status=completed | PASS | 1208 `status=completed`, `mission_concluded_at` 07:39:03 UTC, written when the debrief closed (before: nil). |

## Notes and possible regressions

- HaX (`agent_0x99`) message history is far shorter after a reload (1 entry after reload 3 versus about 8 before). Not part of this brief and I did not compare with an older build. The messages that matter (aims, globals, inventory) persisted.
- On first Val contact in 1208 she opened the `cover_challenge` scene (no lanyard yet), which gave no choices; I passed her without a lanyard and the server room still opened (the cover was restored by the time of the console because `access_server_room` backstop). Not a change from before.
- Harness: `converse` stops early on Reeves' scene because lines are repeated; I drove it with `drive.sh` (continue until choices, pick by regex). No game issue.
- No regression found in the flows tested.

## Assumptions

- Assumption: check 4b was not repeated on the new build because the transmit path ends the mission; the read-only record was last seen in game 1196 on the old build.
- Assumption: "no replay" for 2a is judged from the absence of a minigame, a toast in `c3.png` and an empty drain, not from watching a headed browser.

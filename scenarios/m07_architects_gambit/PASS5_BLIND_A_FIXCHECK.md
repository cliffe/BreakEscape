# m07 pass 5: browser check of the blind-run-A fixes

Date 2026-10-14. Keyless server :3001 (:3000 untouched). Headless (load average about 24 at the start), speed fast. This is a regression check of exactly the fixes listed under "Phase 8 playtests: blind run A fixes" in `IMPROVEMENT_LOOP_LOG.md`. It answers the plumbing question for those fixes; it is not a solvability pass. No mission files edited, nothing committed. No SecGen XML or restricted guide opened.

Counts: items 1, 2, 3 and 6 pass. Item 4 passes for the red state and fails for the return to normal within the same session. Item 5 fails as asked (the text is not readable over the keypad). New findings: **0 blockers, 0 majors, 4 minors** (one borderline major, see N1).

## Game and logs

| Game | Session log | Wall clock |
|---|---|---|
| 2490 | `tools/playtest/m07-pass5-blindA-fixcheck-game2490.jsonl` (1156 lines, 1155 commands) | 1038 s, one mid-mission page reload |

Flags XML `tools/playtest/m07_architects_gambit-flags-game2490.xml`. Screenshots (cited by number) are in the session scratchpad `.../scratchpad/m07-fixcheck/` (files 01 to 26). The session is stopped (`session-stop.sh 2490`); no other session was started.

## verify-run.rb (game 2490, pasted)

```
game            2490  (mission 51)
created         2026-10-14 06:01:34 UTC
last write      2026-10-14 06:18:51 UTC
played for      1038s of wall clock
current room    "security_checkpoint"
unlocked rooms  6: security_checkpoint, operations_floor, server_room, scada_control, generator_room, cable_vault
unlocked objs   1: crisis_control_system
inventory       11: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Threat Desk Summary -- Tasking 02:41 PT, Notepad, Facility Access Badge -- Server Zone, Plant Maintenance Key, Coordination Schedule -- Relay Decode, Listener Capture -- Operator Credentials, Sequence Abort Confirmation
NPCs met        8: opening_briefing_cutscene, agent_0x99, ray_hollis, the_architect, closing_debrief, elena_rodriguez, james_mercer, thomas_park
flags submitted 4: flag{m07_architects_gambit_scada_attack_host_1_c50b9a}, ..._2_0c1e28, ..._3_1b104a, ..._4_a66d97
globals set     48: ... cascade_armed, countdown_expired, grid_saved, hands_down_said, hollis_ko, mercer_ko, park_ko, mission_complete ...

VERDICT: progress recorded — 5 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

("Current room security_checkpoint" is the known reload respawn.) The debrief was not played; it is outside this check.

## Exercised, not earned

| Step | What |
|---|---|
| Flags 1 to 4 | Supplied by the harness (`<flag:N>`). The decode, Listener Capture, 15-minute clock and console unlock all came from the supplied values. Anything about what the VM contains needs checking against SecGen by the user |
| `debugKO` on Hollis, Park, Mercer | Combat not played to a KO. The three fights were started honestly through the marked dialogue choices, the early part of Hollis's fight was fought with Q and E (HP 100 to 44 while hitting him), then `debugKO` ended each. Hollis's badge was therefore picked up off the floor, not earned through the sheet |
| Control-room password `CascadeWindow19` | Read in Elena's conversation (earned that way); the Listener Capture was not opened before typing |
| Vault PIN `4703` | Earned: read on the ATS-1 plate in the generator hall (item 3) before typing |
| Clock expiry | `scenarioTimerDispatcher._timerStartTimes.set("cascade_zero", Date.now()-901000)` about 10 min after flag 3 (the real timer had run roughly 10 of 15 minutes). Shifted, as the brief allowed |
| Mid-mission reload | `sync`, `location.reload()`, Enter on the title screen (DOM key event); the Resume overlay did not appear |

## Results per item

### 1. HaX's controls text after the briefing closes: PASS

On the last briefing line the tutorial prompt ("Welcome to Hacktivity Games!", YES, SHOW ME / NO, I'LL FIGURE IT OUT) came up and the HaX toast was already on screen beside it, bottom left (screenshot 01):

> Agent HaX: The checkpoint guard is bought. If anyone swings at you: Q for fists, E or click to punch, face them squarely. Q until the open hand shows to walk.

- No collision. The prompt is centred, the toast sits in the left gutter (x 22 to 318) under the objectives panel; neither covers the other. The phone icon carried an unread badge. At 8 s the toast had gone (02) and the badge stayed.
- Readable before Hollis can see the player: the `player_spotted:ray_hollis` event and Hollis's first line ("Building's evacuating. So you're lost, or you're the other thing.") arrived only after I declined the tutorial, after the toast.
- The Mission Brief popup did not open after the briefing in a fresh game. It opens on a reload (`on_resume`, screenshot 19) and a bark never shares the screen with it: barks are held while any non-phone minigame is open (`minigame-manager.js` `holdsBarks`). The reloaded brief reads "...and where it goes is your call." (m1 fix confirmed).
- Hollis's in-fight toasts (05, 06): "He's slower than you. If it's going badly, open hand and walk away from him." and (behind it, fading) "He's coming for you. Fists up, face him, hit him. Q a second time throws the harder punch." (the new wording).

### 2. Marked fight choices, Park's wording, "Hands down": PASS

Text on screen (dialogue state):

| NPC | Choice | Next line |
|---|---|---|
| Hollis | "Put it down. (Fight him.)" | "He comes off the frame at you with his fists up. This is going to be a fight." |
| Park | "Then finish it and see what happens. (Fight him.)" | "He comes up off his knees with the crimping tool swinging. This is going to be a fight." |
| Mercer | "Away from the console, or I put you on the floor. (Fight him.)" | "He stands. He is fifty-eight and not quick, and he comes towards you anyway. This is going to be a fight." |

- Hollis, earlier steps: bluff reply "Nice try. Keep your hands where I can see them." (replaces the old line); the "walk at him" branch shows "He backs into the turnstile frame. Nowhere left to go. One more push and this turns into a fight." before the marked choice.
- Park, first visit: "Nothing. I was never here. (Back off.)", no "Next time he swings". After backing off, leaving the room and coming back: "Second time. There isn't a third." and "Nothing. I was never here. (Back off. Next time he swings.)". (A third visit and the "(Step back. He'll come at you.)" last-chance choice were not played; r32 covers them.)
- "Hands down": 7 s after Hollis's KO, toast (screenshot 06): "Agent HaX: Hands down: press Q until the open hand shows. While your fists are up, nothing you click will open." It sat above HaX's "Hollis is down..." text. It did not repeat after Park's KO (13: only "Park's out of it..."); it did not repeat for Mercer either (no second toast seen).
- The fist state was real: with fists up, `interact` on the dropped badge returned `no-effect-confirmed`; after Q to the open hand it worked.

### 3. ATS-1 transfer switch: PASS

`interact backup_transfer_switch` opens a dialog titled "Backup Power Transfer Switch" (screenshot 12). The first line reads "Rating plate riveted to the door: ATS-1, S/N 0098-4703.", and the text block repeats "Rating plate: ATS-1 S/N 0098-4703". Both are fully readable, nothing cut by an ellipsis. `4703` typed on the vault keypad then opened the door. (The harness reported `no-effect-confirmed` for the interact because a dialog is not a minigame; the dialog was open on screen. Harness limitation, not a game issue.)

### 4. Clock expiry: PARTIAL

With `countdown_expired = true`, `grid_saved = false`:

- Video wall: the `situation_board` texture key is `pnw_video_wall_running1`; the Seattle panel (top left of the wall) is red, the rest amber (screenshot 16). Its text: "One panel, top left, has gone red. The rest are still amber." The dialog (15) shows `SCHEDULED SEQUENCE - RUNNING`, `01 SEATTLE METRO open critical breakers EXECUTED`, `02/03/04 ... PENDING`, `SUBSTATIONS UNDER CONTROL ...... 124 / 147 (23 TRIPPED)`.
- "RUNNING / 01 EXECUTED" is also on the cascade display in the control room: "SEQUENCE RUNNING / STEP 01 / 01 EXECUTED" in red (14, 16, top right).
- Wall-end lights: red glow at the wall end of the ops floor in 14 and 16, against the amber glow in the baseline (08). HaX's text at expiry: "Seattle's dark. Step one ran. Steps two to four haven't. Root's in, so the console takes the abort now. Go."
- After the abort (same session, screenshot 17): **the board does not return to the amber wall.** The sprite shows a small landscape picture (texture key `smartscreen`), not the amber wall, and I see no amber glow at the wall end. The control-room display says "SEQUENCE ABORTED / STOPPED". After a page reload (21) the board is back to `pnw_video_wall1`, amber, with the amber glow. So the light return is correct after a reload; in the live session the board is wrong and I cannot separate the lights from the sprite (finding N2).

### 5. Control-room keypad, HaX's case text: FAIL as asked

The text is sent (`door_unlock_attempt`, 800 ms) but is **not readable over the keypad**. With the keypad open, no toast appeared at 3 s (09), nor after a wrong lowercase attempt ("Incorrect password. 2 attempts remaining.", `cascadewindow19`, 10). `body.minigame-holds-barks` was set: barks are held while a password minigame is open (the D5 rule). After I pressed Cancel the toast appeared at once (11): "Agent HaX: That keypad is case-sensitive. Capital C, capital W." The text is correct and is delivered, but only once the keypad closes. A player typing at the keypad sees nothing. See N1.

### 6. E6, "I'll call you back": PASS with two caveats

A pointer click on "I'll call you back." closes the phone at once (checked at 0.5, 1.5 and 3 s, no minigame). HaX's "I'm here. Go." goes into the thread first. "I'm stuck on something." now answers "Tell me where." before the sub-menu (m4 confirmed, with "Send me a field guide." and "Never mind."). Caveats: the keyboard path does nothing (N3) and the pick is the sixth of six buttons, partly out of view (N3).

### Also seen (not on the list, all fine)

- Elena's choice "The desk summary says ninety days dormant. No deaths projected." is present and plays (m3).
- Reload keeps unlocked rooms, inventory, Hollis, Park and Mercer down; HP returns to 100 after the reload (it was 20; relevant to E3).

## New findings

| # | Severity | Finding | Evidence |
|---|---|---|---|
| N1 | minor (borderline major) | HaX's case-sensitivity text is held while the keypad is open, so the player never sees it while typing. The stopgap for blind-run finding m7 only works after Cancel or lockout. Suggestion (text only): put the case in the Listener Capture and Elena's line ("capital C, capital W") or in the door's own observation, so it is visible before the keypad. Engine option: let barks over a password/pin keypad (E4 territory) | 09, 10, 11; `minigame-manager.js` `holdsBarks`, `npc-barks.js` `_shouldDefer` |
| N2 | minor | After the abort, in the same session, the ops floor video wall turns into the generic `smartscreen` sprite (landscape picture) instead of going back to the amber wall; no amber glow seen. A reload fixes it. Suspect engine: `registerSpriteVariantListeners` in `rooms.js` takes `baseKey = scenarioObj.sprite \|\| scenarioObj.type` ("smartscreen"), but the object's real base is the Tiled image `pnw_video_wall1`. Mission-side workaround, not applied: give `situation_board` an explicit `"sprite": "pnw_video_wall1"` | 17 against 21; texture key read from `window.rooms.operations_floor.objects.situation_board` ("smartscreen" live, "pnw_video_wall1" after reload) |
| N3 | minor | HaX's phone hub shows only four of six choices; "Where do I stand?" and "I'll call you back." sit below the fold of a scrolling pane (scrollHeight 342, clientHeight 224) with no scroll cue. The phone's number-key shortcut covers 1 to 5 only, so the sixth choice (the exit) has no key. The harness `mg choose "call you back"` reported `ok: true` for key 6 and nothing happened, which reproduces the blind run's "it didn't close" if it used a key. Suspect engine (UI), not mission | 24, 26; `phone-chat-minigame.js` `handleKeyPress` |
| N4 | minor | Talking to Park again in place after "(Back off.)" (without leaving the room) reopens the first-visit hub ("Four minutes and I'd have been out. Four." and "(Back off.)" without the warning). Only leaving and re-entering gives "Second time. There isn't a third." The room-entry route is the one a player takes, so low impact; noting it because the second-visit warning is the M2 fix | log, Park conversation before and after the room hop |

Also not game findings: the harness reports `no-effect-confirmed` for dialogs that are not minigames (ATS-1, badge pickup after fists), and `mg choose` accepts digit 6 on the phone silently.

## Reproduction notes

- Fresh game 2490, briefing driven by hand (Meltdown committed). Expiry shift as listed above. Phone opened with `tools/playtest/m07p4-openphone.sh`.
- The mission's checks in `IMPROVEMENT_LOOP_LOG.md` are otherwise unaffected by this run: r32 still covers the third Park visit.

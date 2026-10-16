# m07 The Architect's Gambit: engine regression, 2026-10-16

Regression run (answers known), keyless server :3001, headless, Sonnet-class tester. Game id **2590** (mission id 51), created fresh. Played start to credits in about 31 minutes of wall clock (verify-run: 1881 s). Nothing in the mission or the engine was edited and nothing was committed.

- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m07-engreg/session-2590.jsonl` (1993 commands)
- Screenshots (same folder): `01_checkpoint.png` to `19_credits.png`
- Flags XML: `tools/playtest/m07_architects_gambit-flags-game2590.xml`
- **Credits reached: yes.** The credits label was read through a MutationObserver on `#bv-cr-label`; 20 lines, listed at the end.

## Severity table

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | blocker | none | |
| 2 | major | none | |
| 3 | minor | A Restart after a knockout resets Park (and Hollis) calm, but m07 has no mapping for the reset event, so `park_resolved` stays `"ko"`. Consequence seen: back in the vault Park no longer speaks first on entry (the room-entered mapping excludes `ko`), the player has to walk up to him. A player who restarts and never talks to him would get the credits line "Fought off, not stopped" for a fight that was reset. Park could still be talked round and credits then read "Talked". m03, m05 and m06 got this fix in the follow-ups commit; m07 did not. | new, mission side |
| 4 | minor | HaX's KO text "Mercer's on the floor. The sequence never needed him awake. Finish the host." is conditioned only on `!grid_saved`, so it fires after all four flags are in and the host is already finished (the abort not yet done). | pre-existing wording, seen again |
| 5 | minor | Password door dialog is titled just "Password:" ("scada_control" door). The PIN keypad names its lock ("Enter PIN: Underground Cable Vault"), the password dialog does not. May be outside the "keypad titles" change; reported so it is a decision, not a surprise. | observation |
| 6 | minor | HaX's wrong-case hint says "as the relay note wrote it". At that point the player got the password from Elena and has no relay note yet (Listener Capture comes with flag 2). | wording |
| 7 | minor (cosmetic) | The flag-lock toast ("It doesn't take a flag here...") runs under the round clock icon at the top right on its first line. Text stays readable on the second line. | cosmetic |
| 8 | minor, known | Every page reload and every Restart puts the player back in the start room; the "Mission Brief" notes minigame reopens each time. Same as PASS5_REGRESSION m-14. State, inventory, threads and unread count all survived (82 globals, 15 HaX messages, 9 unread before and after). | known, not a regression |
| 9 | note (tester error) | I called `npcHostileSystem.getState("ray_hollis")` after the Restart while Hollis was calm. That creates a default 10-damage state (the skill's gotcha). I did not fight Hollis again, so no result depends on it. Every other `getState` call was made after the NPC had turned hostile. | disclosed |

## What passed (engine change to evidence)

| Change | Result | Evidence |
|---|---|---|
| Leash at the NPC's own room door | PASS for all three. Hollis went hostile, I fled to the ops floor: he stayed in `security_checkpoint` (npcManager room, 4 s later) and HP stopped dropping. Back inside his room, 100+ px away, he walked back to his post. Park went back to his post (775,633) when I stood off. Mercer stayed in `scada_control` six seconds after I left (HP stayed 100). | log, eval reads |
| Attacks pause while the phone is open | PASS. Hollis hostile and adjacent, phone open 9 s: HP 72 before, during and after. Conversation and cutscene pauses not exercised (no hit landed during one). | brief reads |
| "He's past talking." toast | PASS, quoted: "He's past talking." (warning toast) on interacting with hostile Hollis in fists/open-hand mode. | eval of `.notification` |
| Consumables | PASS. First Aid Kit in the generator hall is takeable. At full HP: "You're not hurt. Keep the first aid kit for later." and kept. After `playerHealth.damage(60)` (console, so exercised not earned): HP 40 to 80, toast "First Aid Kit: +40 HP", item gone from inventory. Coffee machine not tested (the handover sheet calls it broken). | eval |
| Restart after a knockout | PASS for state. Two knockouts (Hollis, then Park). After each Restart `isNPCHostile` was false for Hollis, Park and Mercer; Park's conversation reopened at `start` with all five options and could be talked round. The reset event itself was not seen (the page reloads on Restart and the log drains with it); see finding 3 for what the mission does not clear. | brief, eval |
| Per-NPC damage and HP | PASS. Hollis and Park hit for 4 (state read after hostile: damage 4, range 32, cooldown 2000, max HP 100); Mercer hit for 3 (every HP drop was a multiple of 3). Punches did 10 each. | HP traces in log |
| Punch cone | PASS in the sense that punches landed from about 35-55 degrees off the facing axis after turning to the nearest cardinal direction, and missed when the target was past about 60 degrees. Mercer KO'd with a few misses. Note fists mode was entered with Q once (default after load is open hand). | HP and NPC HP reads |
| Fists mode: click walks, interact blocked | PASS. With fists up the console would not open (`no-effect-confirmed`); Q back to open hand and it opened. HaX's "Hands down" text arrived after the first KO as designed. | log |
| Phone number keys and "more choices" cue | PASS. Key 3 chose the third option; with 7 choices, key 6 (below the fold) chose "Where do I stand?". The cue "▼ more choices" showed while the list overflowed and went away at the bottom. | screenshot 02, eval |
| Long HUD captions wrap | PASS. The console caption wraps over three lines in its box (screenshots 10, 17); narration captions wrap over two. | screenshots |
| Flag lock with no `requires` | PASS, quoted: "It doesn't take a flag here. It unlocks when the right flag is submitted at the SAFETYNET Relay Terminal." after flag 4 the console opened (container, "Sequence Abort Confirmation"). | screenshot 10 |
| Password near miss | PASS, quoted: "Incorrect password. Passwords are case-sensitive. 2 attempts remaining." for `cascadewindow19`. | screenshot 09 |
| HaX case hint on `door_unlock_failed` | PASS. Events `door_unlock_failed` and `door_unlock_failed:scada_control` fired; HaX sent "Right word, wrong case. Capital C, capital W, as the relay note wrote it." (see finding 6 for the wording). | event drain, thread read |
| PIN keypad names the lock | PASS, quoted: "Enter PIN: Underground Cable Vault". | screenshot 12 |
| "Trace How They Got In (Optional)" | PASS. Tasks `secure_generator_room`, `recover_vault_pin`, `neutralise_park` completed first; the aim stayed `active` after `search_cable_vault` (4 of 5) and became `completed` only when `recover_mole_evidence` (2 of 2) finished. | aim reads |
| "* required" key on aims | Seen on "Get Onto The Control Network" and on its tasks in screenshots 03 and 06. | screenshots |
| Story-rate game clock and cascade timer | Timer started at 14:58 on flag 3 and read 11:43 about three minutes of play later. Matches 1x. | screenshots 15, 17 |
| Room-emitter LEDs on racks | Rack LEDs visible and lit in the server hall (screenshots 06, 15). Not examined at pixel level. | screenshots |
| Conversation backgrounds | Checked: server hall (Elena, shot 07), vault (Park, shot 13), SCADA control (Mercer, shot 16), borrowed office at night (debrief, shot 18). Each matches its room. **Not captured: Hollis's checkpoint and the opening briefing**, so two of the six are unchecked. | screenshots |
| Critical path and optional content | Hollis talked round (handover sheet line first), badge opened the server hall door by itself, key opened the generator hall, Elena turned, PIN 4703 from the transfer switch plate, trunk runs, Tomb Gamma, mole intercept, four flags, Mercer, console, Architect call, "Bring me in", debrief, credits. Park fought, two Restarts later talked round. | log |
| Mid-mission reload | One explicit reload (`location.reload`, then Enter on the title, then Resume through the DOM) in the cable vault after the optional aim completed, plus two Restart reloads. Globals, threads and unread count unchanged; no intro, verdict or nudge replayed. | eval before and after |

## Not exercised

- NPC HP saved with hostility over a reload (the reload came when nobody was hostile).
- Hostile attacks pausing for a conversation or cutscene.
- Dotted-path conditions, `delayMs` on conversation mappings, all-optional aims, above-glow hue, trolleys and chairs rotating through 8 frames: nothing in m07's route made them visible; not checked in the scenario.
- Coffee and energy drinks (none in m07's route).
- RFID reader with an empty cloner: the cloner was not held empty at any reader.
- Hollis's checkpoint background and the briefing background.

## Earned-secrets table

| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| Server-zone badge | item | Hollis, after the Shift Handover Sheet's print-history line (ops floor) | yes |
| Plant maintenance key | item | ops floor desk | yes |
| Control room password | `CascadeWindow19` | Elena, after she turned (a wrong-case try came first) | yes |
| Vault PIN | `4703` | Elena named the rule, ATS-1 plate on the transfer switch reads S/N 0098-4703 | yes |
| Flags 1 to 4 | `<flag:1>` to `<flag:4>` | harness flags XML, no VM | **exercised, not earned** (flag supplied) |
| First Aid Kit test HP loss | `playerHealth.damage(60)` | console | exercised, not earned |

Prerequisites held: VM terminal used (Kali panel opened, standalone), relay terminal reached through the badge-gated server hall. Downstream of the flags (decode, listener capture, console unlock) worked from the supplied flags.

## Repro steps for the findings

3. Provoke Park (vault, "Then finish it and see what happens. (Fight him.)"), let him knock you out, Restart. Check `gameState.globalVariables.park_resolved` (is `ko`), walk back into the vault: no conversation opens by itself. Interact with Park: conversation opens at `start`.
4. After all four flags are in, KO Mercer before reading the abort printout; HaX's text 2 s later ends "Finish the host."
6. Try `cascadewindow19` at the SCADA door after Elena gives the password.
8. Reload at any point; `brief` shows `security_checkpoint` at 160,144.

## Credits as read (20 lines)

MISSION COMPLETE / THE ARCHITECT'S GAMBIT / PACIFIC NORTHWEST REGIONAL GRID: SEQUENCE ABORTED / CUSTOMERS AFFECTED: 0 of 8,400,000 (147 substations held) / THE ATTACK HOST: share read, listener intercepted, operator login, root / CLOCK: armed by the agent's login, stopped with time on it / THE TRIAGE: Trojan Horse, 840 signing keys burned, projection corrected (nine days, not ninety) / INSIDE THE FACILITY: Mercer neutralised at the console, "Argued with, to the end"; Elena turned; Hollis talked, handed over the badge; Park talked, switch left intact / RECOVERED: Tomb Gamma dossier, mole intercept / ON THE RECORD: "Owned the two that went unanswered"; the Architect at large; ENTROPY still operational.

## verify-run.rb output (game 2590)

```
game            2590  (mission 51)
current room    "security_checkpoint"
unlocked rooms  6: security_checkpoint, operations_floor, server_room, scada_control, generator_room, cable_vault
unlocked objs   1: crisis_control_system
NPCs met        8: opening_briefing_cutscene, agent_0x99, ray_hollis, the_architect, closing_debrief, elena_rodriguez, james_mercer, thomas_park
flags submitted 4 (flag{m07_architects_gambit_scada_attack_host_1..4_...})
globals set     53 (includes grid_saved, debrief_played, mission_complete)
VERDICT: progress recorded — 5 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Session 2590 was stopped; no other sessions were started.

## Fixes (2026-10-17)

Scenario and ink fix pass for this report and `PASS5_BLIND_A.md` (game 2594). Code commit **0cd2823a**. Engine items listed below went to the engine fixer working at the same time. Checks: ink compiled, validator clean of new findings (two old dialoguelint warnings remain), tagdiff explained (one new tag and assign: `redirect_declined` clears on a move), loopcheck on every changed conversation, reopencheck 0 problems, all 35 m07 routes pass (new r34 Restart reset, r35 decline then move).

Also done from the lead's rulings: `gender` on the five person NPCs (Netherton x2, Hollis, Mercer, Park male; Elena female), and the HaX fight hints rewritten for the fists-mode click ("To get clear, click open floor and walk, fists up or not"; briefing-close text now says the open hand is for using things; Hollis's "open hand and walk" is now "walk out of his reach").

| # | Severity | Finding | Outcome |
|---|---|---|---|
| R3 | minor | Restart leaves `park_resolved`/`hollis_resolved` at "ko" | **Fixed (0cd2823a).** HaX-side mappings on `npc_hostile_state_changed {isHostile:false, reset:true}` clear `hollis_resolved`, `park_resolved` and `mercer_fate` when they read "ko". Park speaks first on entry again; credits/debrief no longer record a reset fight. Route r34. |
| R4 | minor | Mercer KO text "Finish the host" after root | **Fixed (0cd2823a).** Now `!grid_saved && !flag4_submitted`; a third row for root-in, abort-pending says the abort goes in at the console behind him. |
| R5 | minor | Password dialog title | Engine fixer's (password dialog title). |
| R6 | minor | "as the relay note wrote it" before the player has the note | **Fixed (0cd2823a).** "Right word, wrong case. Capital C, capital W." |
| R7 | cosmetic | Toast under the clock icon | Engine fixer's (toasts). |
| R8 | minor, known | Reload/Restart lands in the start room | Withdrawn: resolved decision (RESOLVED_DECISIONS 2026-10-16, no resume in the room you left). |
| R9 | note | Tester's `getState` call | No action (disclosure). |
| A-M1 | major | Credits Close hidden ~12 min, right panel clipped | Withdrawn in part: `disableClose` on the credits is by design in every mission (they are the end of play) and Close shows when the track ends. Panel clipping at 1400 px deferred to engine (DECISIONS_PENDING E7). |
| A-M2 | major | Redirect "now or never, once you log in" contradicts the window staying open | **Fixed (0cd2823a).** HaX: "The window stays open until you log in as their operator, or the timer on screen runs out. Then the team stays put." The decline reply says it can change until the operator login. Route r35. |
| A-M3 | major | Credits header/ticker say IRONSEAL, CONTAINED, NOMINAL, VICTORY | Deferred, engine: the text is hard-coded in `bond-visualiser.js` for every SAFETYNET mission, not scenario data (DECISIONS_PENDING E7). The scenario's credit lines read right. |
| A-M4 | major | Park fight unreadable for a first-timer | Already fixed in part (b2a394da: first aid kit in the generator hall before Park; HaX controls text as the briefing closes). The rest (no health bar over the NPC, damage popup over the player) is engine; deferred. |
| A-M5 | major | Position resets on reload and Restart | Withdrawn: resolved decision (as R8). |
| A-m1 | minor | Fists up silently blocks object use | Already handled by HaX's "Hands down" text after the first KO (seen in the run, after the fact). The block itself is engine design; no change. |
| A-m2 | minor | Park's talk options loop with identical replies; nothing reflects the splice | **Fixed (0cd2823a).** Repeats of "Step away" and "Who's paying you" get short varied answers; once the splice is read, a one-off question about it gets its own reply (and his stand-down line no longer repeats it as news). |
| A-m3 | minor | Mercer's "Not yet. I've something else to ask you." returns to the same two options | **Fixed (0cd2823a).** Offered only while a topic is left (`topics_left()`); otherwise "Not yet. (Leave him for now.)" exits. |
| A-m4 | minor | Elena repeats "Give me the control room door and the vault code again" | **Fixed (0cd2823a).** The reminder goes once both the control room and the vault have been reached. |
| A-m5 | minor | Ray's "Back off. I'm leaving." reuses the cornered narration | **Fixed (0cd2823a).** From the hub he gets "You step back out of his flashlight…"; the corner line stays on the cornered route. |
| A-m6 | minor | Harness `bootstrap` times out on the briefing | Withdrawn: harness, not the game. |
| A-m7 | minor | `redirect_declined` and `team_redirected` both true after decline then move | **Fixed (0cd2823a).** The move clears `redirect_declined`. Route r35. |
| A-m8 | minor | Debrief "The other three operations went ahead on schedule" | **Fixed (0cd2823a).** With a team committed: "started on schedule. One of them ran into our team."; uncommitted keeps "went ahead". |
| A-m9 | minor | Garbled sign in Ray's conversation background | Deferred: background art; not touched in this pass. |

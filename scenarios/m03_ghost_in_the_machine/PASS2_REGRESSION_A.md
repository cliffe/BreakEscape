# m03 pass 2 regression, Run A (day), 2026-10-12

> **Rename note (2026-10-12, m03 pass 2 dialogue round 2):** m03's receptionist is now Ffion Rees (id `ffion_rees`, ink `m03_npc_ffion_rees.ink`; was `receptionist_npc` / `m03_npc_receptionist.ink`) and the night guard is Terry Mott (id `terry_mott`, ink `m03_npc_terry_mott.ink`; was `night_guard` / `m03_npc_guard.ink`). Old ids below are historical.

Question answered: plumbing (regression of a route that played clean on 2026-10-05). Headless, load average about 1. Keyless server :3001.

- Game 2084 (main run, Run A steps 1-6, two reloads): session log `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m03-regA/session.jsonl` (reload 1 about lines 410-430, reload 2 about lines 840-860).
- Game 2088 (short second game for R1-16, C17, B-1): `.../m03-regA/session2.jsonl`.

## verify-run.rb

Game 2084:

```
game            2084  (mission 47)
played for      553s of wall clock
current room    "reception_lobby"
unlocked rooms  3: reception_lobby, main_hallway, conference_room_01
unlocked objs   0:
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge
NPCs met        8: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, night_transition, victoria_sterling
flags submitted 0:
globals set     11: briefing_played, clone_call_done, conference_reader_tried, danny_fate, engine_tutorial_declined, knows_m2_connection, mission_phase, player_approach, reception_badge_cloned, victoria_card_cloned, victoria_fate
VERDICT: progress recorded — 2 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

Game 2088:

```
game            2088  (mission 47)
played for      200s of wall clock
current room    "reception_lobby"
unlocked rooms  3: reception_lobby, main_hallway, conference_room_01
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge
globals set     8: briefing_played, cloner_explained, danny_fate, engine_tutorial_declined, mission_phase, player_approach, reception_badge_cloned, victoria_fate
VERDICT: progress recorded — 2 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

## Earned secrets

| Secret | Earned in-game? | Source |
|---|---|---|
| Staff Access Badge (cloned) | yes | receptionist clone choice, Dictionary attack, Save, Emulate opened the conference reader (games 2084, 2088) |
| Executive Keycard (cloned) | yes (game 2084) | whiteboard read during Victoria's chat, Darkside, Save; `victoria_card_cloned` set |
| Plaque year 2010 | yes | read "Founded 2010 by Victoria Sterling" in the lobby |
| Password, safe PIN, flags | not exercised | Run B territory |

## Run A steps

| Step | Result | Evidence |
|---|---|---|
| 1 Briefing | PASS | Briefing cutscene (Netherton, Nightshade, HaX) then hub, approach, "I'm ready". Mission Brief notes panel shows once, then the tutorial prompt. No "what will I learn" topic. HaX text on reception load matches R1-7 exactly. |
| 2 Reception | PASS | Plaque shows 2010. First greeting "Afternoon! You'll be the three o'clock, is it?". Visitor Badge issued. Clone choice absent when the cloning topic was skipped. |
| 3 Conference reader, reload | PASS | `conference_reader_tried` set; flipper opened; HaX text "That reader wants a staff badge..." and task "Copy the receptionist's staff badge with your cloner" toast and panel (B-2 pass). After reload the title screen then game, no brief panel, state held (globals, inventory, tasks). Player respawns in reception_lobby at the start position (see F2). |
| 4 Back to reception | PASS | Return greeting "Back again? Forgotten something?" (C15 pass); choice "Lean in by her lanyard and let the cloner read her badge." offered after reload (C6 pass). Dictionary, Save: `reception_badge_cloned`, both reader tasks tick. |
| 5 Conference room | PASS | Emulate opened the door. Victoria's first lines have no player name (voice rule). "Meet Victoria Sterling" completes. Whiteboard option, flipper opened at once on Continue after "Card read. Now run Darkside on it." (B-4 pass), Darkside about 25 s, Save. `victoria_card_cloned`. New task "Walk out with the visitors and come back after dark" on the panel and HaX text "Card's saved. Thank her, walk out with the visitors, and come back after dark." (R1-1 clone route pass). Not tested: KO route. |
| 5b Reload after saving her card | PASS | Reload (a Resume Session overlay appeared this time, see F3), Resume, title Space. Room, tasks and globals held, night cutscene had not played. |
| 6 Leave to the main hallway | PASS | Entering main_hallway played the night transition (player portrait on a magenta code backdrop), "Eleven o'clock that night...". Then HaX text "You're in. Server room's at the north end of the main hallway: use Sterling's card at the reader. Mind the guard in the executive wing." Panel: "Get Inside WhiteHat" completed, "Breach The Server Room" is the only new aim (flag tasks plus "Read the recovered transaction log"; decode_directive not shown). |

## Other items checked

| Item | Result |
|---|---|
| R1-7 HaX first text | PASS, text as specified |
| R1-8 "Now we go after the seller's own ledger." | PASS, no "Tonight" |
| R1-16 clone choice in first chat after the briefing clone topic | PASS (game 2088): offered as the third of four options, not fourth; wording as specified |
| R1-1 (clone route), B-2, B-4, C6, C15 | PASS, above |
| C17 briefing | PASS: Nightshade lines "One day it'll be our badge somebody clones." present; no "what will I learn" topic |
| B-1 whiteboard from a blunt branch | PASS (game 2088): "This sounds like you're advocating selling vulnerabilities", then "Thank you. I've taken enough of your time." ("not the right fit"), "Pick the conversation back up"; the hub still offers "Is that your training lab on the whiteboard?"; answer "*curtly* The training lab. Since you're so interested." and the read starts. Panel task reads "Clone Victoria's keycard at her whiteboard" |
| Voice rule | PASS for receptionist, Victoria, HaX lines heard |
| Console errors | Not collected in game 2084 (harness does not log the console). Game 2088: an error hook installed after load caught nothing. Weak evidence |
| New engine visuals | Rooms render lit, no unexpected darkness. Conversation backgrounds are plain black in every m03 chat (Victoria, receptionist). Expected: `scenarios/m03.../scenario.json.erb` defines no `chatBackground` or lighting for any room yet (stages 4-5 of the pass). The night hallway looks the same as day for the same reason |
| Not run | R1-1 KO route, R1-2, R1-3, B-3, B-5 to B-12, C1 to C5 and the rest (Run B or struggling run) |

## Findings

| # | Severity | Finding | Repro |
|---|---|---|---|
| F1 | minor | Persisted "current room" is wrong at night. After the night turn the player stands in main_hallway but verify-run reports `current room "reception_lobby"` (game 2084). Possibly only the sync timing, but it matches F2 | game 2084, sync after step 6 |
| F2 | minor (needs ruling) | After a reload the player always respawns at the start of reception_lobby (160,144), not in the room they left (main_hallway after step 3, conference room after step 5b). Tasks and globals hold, so it is not a softlock. If a reload mid-room used to restore position, this is a regression; I could not tell which | game 2084, reload in main_hallway then in the conference room |
| F3 | minor | Reload flow is inconsistent. First reload: title screen then straight in. Second reload: title screen, then a "Resume Session? Resume / Restart / New Session" overlay with an Other Sessions list on top of the title, and it needed a DOM click on Resume followed by another Space on the title screen. The Resume overlay can strand `bootstrap`-style drivers (known harness note). A player has to click through two layers | game 2084, session log around line 850 |
| F4 | minor | Night transition portrait has a thin cyan vertical stripe across the player's left eye and cheek (likely the glitch art, check) | game 2084, step 6 screenshot `s12.png` |
| F5 | note | Task-list wording, harness/spec drift: script says the clone choice is "[Lean in...]" in brackets, in game it has no brackets; script R1-16 says "fourth choice", in game it is third of four. Stage directions such as `*warmly*` print on screen inside Victoria's lines (matches the tts-audio rule that they are inline, so not a bug unless the engine is meant to strip them) | games 2084, 2088 |

Counts: 0 blockers, 0 softlocks, 0 majors, 4 minors (F1 to F4), 1 note (F5). No step in Run A regressed.

## Summary

Run A (steps 1-6, both reloads) passes end to end on today's engine: the briefing, reception, reader refusal, clone choice after a reload, Victoria's whiteboard read (including the flipper opening over the chat), the save, the new walk-out task, and the night turn with "Breach The Server Room" as the only new aim. The R1-1, R1-7, R1-8, R1-16, B-1, B-2, B-4, C6, C15 and C17 checks also pass. Nothing is broken by the room lighting, conversation background or save-state work; m03 has no lighting or chatBackground configured, so rooms are lit and chat backdrops are black, as expected. The only oddities are minor reload behaviour: the player respawns at the lobby start after a reload, the persisted current room lags, and the Resume overlay can stack on the title screen.

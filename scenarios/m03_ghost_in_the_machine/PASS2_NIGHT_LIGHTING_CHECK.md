# m03 pass 2: day/night lighting and dialogue browser check (2026-10-12)

Run type: **plumbing** regression (no globals set by hand). One game, **2147**, keyless :3001, headless. Session log: `tools/playtest/m03-night-check-session.jsonl` (729 commands). Screenshots: `scenarios/m03_ghost_in_the_machine/build_evidence/night_check/` (all looked at).

Not done: B4 (debrief), A1 Danny's office by day (the night scene fires the moment you leave the conference room, so the exec wing was never entered by day), Terry's daytime meeting (so the "three o'clock" callback in B2 was not exercised).

## Earned secrets

| Secret | Value | In-game source | Earned? |
|---|---|---|---|
| Staff badge clone | (card) | Ffion's lanyard, her hub choice (after trying the reader) | yes |
| Victoria's card | (card) | Whiteboard read in the first chat, Darkside | yes |
| Flags, office PC, safe PIN | n/a | not in scope | not used |

## Results

| # | Check | Result | Evidence |
|---|---|---|---|
| A1 | Day: reception, hallway, conference lit | PASS | `01-day-reception.png`, `02-day-main-hallway.png`, `04-day-conference.png` |
| A1 | Danny's office lit and empty by day | NOT CHECKED | exec wing never reachable by day before the night scene |
| A2 | Night turn: hallway on dim night lights, threat map glowing; reception darker with cyan counter strip | PASS | `05-night-hallway-scene-closed.png`, `06-night-reception.png`; resolved `reception #545c70 v0`, `main_hallway #323a50 v0` |
| A2 | Warm wash on the slat wall | WEAK | slat wall reads only slightly warmer than day; hard to see (L1 below) |
| A3 | Reload by day stays day | PASS | `03-day-after-reload-reception.png`; `reception on v-1 #e4e8ee`, `clone_call_done=false` |
| A3 | Reload at night stays night: reception, hallway, exec wing, Danny dark with lamp, Terry's torch | PASS | `08`, `09`, `10`, `11` png; `clone_call_done=true`, all `v0`; `danny_office: dark` |
| A4 | Terry's torch beam and vision cone on approach and at the CEO door | PASS | `07`, `10`, `12` (beam draws, cone shows). `13` is the lockpick overlay, which hides the scene. |
| A4 | CEO office strikes on when entered | PASS | `14-night-ceo-office-lit.png`, state `motion on=true` |
| A4 | Server room strikes on when entered | PASS | `15-night-server-room-lit.png`, `motion on=true` (Victoria's card via the flipper) |
| A4 | Danny's office never strikes on at night | PASS | `11`: stays `dark`, lamp only, with the player inside |
| B1 | Ffion's night question plays without reload, answer reaches Terry | PASS with a wart (F1) | night: "Is Ms. Sterling expecting you this late?"; chose "She said to come back once the building was quiet"; Terry: "Ffion reckons Ms. Sterling's expecting you. She never said nothing to me." |
| B2 | Terry's question, my excuse, no greeting after dismissal | PASS | "So what are you doing in my corridor?" -> excuse -> "Which files?" -> "Ten minutes. Then I come looking." -> "I'll let you get on" -> "Mind how you go."; re-interact opened nothing. The afternoon-recruit callback ("The three o'clock, back again") needs `day_greeted` and was not run |
| B3 | Victoria at night plays her night scene | PASS | "*low, into her phone, back to the door* No. Not tonight..." (see F3) |
| B4 | Debrief | NOT RUN | time |

Console: only 503 (no TTS on :3001, expected) and three 404s on resource loads; no page errors. I did not identify which resources 404'd.

## Findings

| # | Severity | Finding | Repro |
|---|---|---|---|
| F1 | minor (suspect ink/engine resume) | Ffion's night scene opens with a stale afternoon line: "Sorry, I was miles away. Where were we?" then "Oh! You made me jump. I only came back for my charger." The first line is the `clone_badge_debrief` beat (`m03_npc_ffion_rees.ink:312`) that I skipped by ending the chat at the cloner's "The badge is in the cloner." narration (End Conversation); it resumed at night. A player who presses Continue would not see it. | Day: clone Ffion's badge, End Conversation at "The badge is in the cloner.", finish the day, talk to her at night (log, game 2147, around seq 560-600) |
| F2 | minor | Reload after the night turn showed the "Resume / Restart / New Session" overlay (the day reload did not). Not an error, but the player is always put back in reception at (160,144), whatever room they left in. | Reload at night in the exec wing |
| F3 | minor | Victoria's night line carries a stage direction inside the spoken text (`*low, into her phone, back to the door*`). Fine now; it will be read out when m03 is voiced. | Talk to Victoria at night |
| L1 | minor (taste) | The warm cove wash on the reception slat wall at night is barely distinguishable from the day wall at the render size. The cyan counter strip and pool are clear. | `06`, `08` |
| L2 | observation | Conference room keeps its day lighting at night (bright blue carpet, plan section 10 says "none"). Next to the dim hallway it reads like Victoria working late, which fits the scene, but it is the brightest night room. | `05`, `16` |
| L3 | observation | Executive office stays lit after you leave while the hallway is dim; the server room also stays on. Per motion `offAfter`. | `15` |
| E1 | observation | Skipping the briefing: harness `pressKey Escape` refuses while the chat is up; a DOM-dispatched Escape keydown worked. Then the Mission Brief notes panel and the tutorial prompt need closing by hand. | start of run |

Counts: 0 blockers, 0 majors, 3 minors (F1, F2, F3), 1 taste minor (L1), 3 observations.

## verify-run.rb (game 2147)

```
game            2147  (mission 47)
created         2026-10-12 17:51:26 UTC
last write      2026-10-12 18:01:30 UTC
played for      604s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, main_hallway, conference_room_01, executive_wing_hallway, danny_office, executive_office, server_room
unlocked objs   0: 
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge
NPCs met        10: briefing_cutscene, director_netherton, agent_nightshade, ffion_rees, agent_0x99, closing_debrief, night_transition, victoria_sterling, terry_mott, danny_foster
flags submitted 0: 
globals set     19: briefing_played, clone_call_done, conference_reader_tried, danny_fate, engine_tutorial_declined, exec_office_entered, exec_wing_entered, exec_wing_night, ffion_night_story, guard_challenged, lockpicking_guide_offered, mission_phase, netexploit_guide_offered, night_explored, player_approach, reception_badge_cloned, sterling_on_call_seen, victoria_card_cloned, victoria_fate

VERDICT: progress recorded — 6 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

The CEO door lock was opened with `completeLockpick` (assisted, dexterity minigame), not picked by hand.

# m10 Full Disclosure: confirmation playtest 2 (endings and closing)

Browser regression run, 2026-10-22, keyless :3001, headless Chromium, Node 24 from the Playwright cache. Source for steps: the retest list in the task (items 1, 8, 9, 10, 13, 14 plus the "last line before the card, credits once" check on each ending). Head start at the core as briefed (flags 1-4 via `--submit-flag` plus `flagN_submitted` and `submit_flag_N`, `head_start_out=none`, `outer_lock_open=true`, closing NPCs carried, `--imports=none` except game D). Everything upstream of the core is exercised, not earned; no earned-secrets table applies. No game files edited, nothing committed. :3000 untouched.

Scratch, transcripts, screenshots and session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10cf2/` (call it `$S` below).

Games and session logs (`$S/<letter>.jsonl`):

| Letter | Game | Ending | Notes |
|---|---|---|---|
| A | 3076 | LETHAL | reloaded twice at the core before the ending (items 8, 9) |
| B | 3084 | SCORCHED | no reload; `m02_completed` set (see item 8 note) |
| C | 3088 | JOIN | |
| D | 3096 | ARREST | `--imports` file with m02 completed and Gary protected; reloaded at the core before the ending, again after it; gallery and server hall unlocked |
| E | 3103 | (globals only) | `ending=arrest`, `closing_done`, `night_closed` set at creation, to walk the rooms after a reload (see item 1) |

`verify-run.rb` (`$S/verify_3076.txt`, `verify_3084.txt`, `verify_3088.txt`, `verify_3096.txt`): all four print "progress recorded" (1 room beyond the first, 4 flags submitted; D: 3 rooms). 3076 shows 12 of 12 tasks completed, `close_the_night` last. Final lines:

```
3076: VERDICT: progress recorded - 1 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
3084: VERDICT: progress recorded - 1 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
3088: VERDICT: progress recorded - 1 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
3096: VERDICT: progress recorded - 3 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```

Globals read back at the end: A (Fire; I did not read `ending` back, the card said "dead at his console"; `wren_at_core=true`, `closing_done=true`, `night_closed=true`); B `ending="scorched"`, `closing_done=true`, `night_closed=true`; C `ending="joined"`, `night_closed=true`; D `ending="arrest"`, `night_closed=true`. The whodunit stayed unsolved on every run (`accused=""`, `sleeper_caught=false`; Kowalczyk comes to the core on her own, `wren_at_core=true`).

## Results

| # | Item | Result |
|---|---|---|
| 1 | After ARREST: gallery, core, server hall, reload: no raid NPC returns (Vos especially) | PASS, with a caveat on the reload half |
| 8 | 06:00 lines under their own names; reload at the core before 06:00 | PASS |
| 9 | Reload after the outer lock: no `gallery_open_call` | PASS |
| 10 | Credits and card wording on LETHAL and SCORCHED, WREN unsolved | PASS |
| 13 | Hearing (scorched) and Citadel (join) opening Narrator lines visible | PASS (hearing line is short-lived, see note) |
| 14 | JOIN header MISSION FAILED, stays so; Skip/close button during forced credits | PASS |
| - | Closing scene's last line shows before the card; credits roll once | PASS on all four endings |

### 1. After ARREST (game D, plus E)

Real arrest route in D (stop console, disclose, "[You're under arrest.]", "[Hold fire.]"; Tesseract holds out his wrists). Closing scene, card, credits, then closed the end screen and walked the rooms with `room` and `enter`:

- Core: Tesseract, `kowalczyk_core_waiting`, `kowalczyk_core` and `quintero_core` all `visible=false`. Only Director Netherton and HaX (the SAFETYNET pair) show. (`$S/D_core_after_reload.txt`, `D_core_after_reload.png`)
- Gallery: every record hidden, Victoria, `victoria_threat`, `vos`, Fonoti, the guards, `quintero_lock`, `minder_lock`, `nightshade_lock` all `visible=false`. (`D_gallery_after_arrest.png`)
- Server hall: Asante, Mercer, both hall guards, `kowalczyk_hall`, `arakawa_hall`, `quintero_hall` all `visible=false`. (`D_hall_after_arrest.png`)
- Back through gallery to core: same, nobody from the raid.

Caveat: after the real ending in D, a reload leaves the game inert (see O-1), so I could not walk the gallery and hall after that reload. To cover the reload half I made game E with `ending=arrest`, `closing_done` and `night_closed` set at creation (an emulated ending state, not a played arrest), walked gallery and hall, synced, reloaded, resumed, and walked core, gallery, server hall and core again. Nobody from the raid showed in any room, Vos included. (`E_hall.png`, `E_gallery_after_reload.png`, `E_server_hall_after_reload.png`.) Verdict: PASS for the closing flags hiding the raid on room entry and on reload; the "after a real concluded ending then reload" combination is untestable because of O-1.

### 8. 06:00 speakers

- A (LETHAL, after two reloads at the core): Imran "Nobody asked me anything all night. Same as the board." shows as speaker Imran Siddiqui. Wendell "Do I still get paid for the week?" shows as Wendell Briggs. (`$S/A_tess.txt` is the Tesseract scene; the 06:00 menu lines are in the run output: speakers printed by the harness as `[Imran Siddiqui]`, `[Wendell Briggs]`; screenshot `A_closing_open.png`.)
- B (SCORCHED, no reload): same two lines, same names.
- D (ARREST, reloaded before 06:00, Gary protected via an imports file): Gary Whitlock "Consultant for a night. I spent it watching other people's benches." shows as Gary Whitlock; Wendell as Wendell Briggs. With Gary present the menu offers Gary instead of Imran (ink: Gary takes the slot), so Imran was checked in A and B.
- Netherton, HaX and Quintero lines in the same scenes carried their own names in all runs.

Note: `--set m02_completed=true --set m02_gary_protected=true` did not make Gary appear (game B); only an imports file did. That is a harness matter (imports win over the global in the ink), not a game finding.

### 9. No `gallery_open_call` after a reload

A: reloaded at the core twice, the second time through the Resume overlay as a player would, and watched about 35-40 s with `brief` polling and a drain of the event log. No phone-chat, no HaX call, no `minigame` event beyond the mission brief and tutorial prompt. D: reloaded before the ending, same result. The old stale text ("Fifteen minutes to their head start") did not appear. Screenshot `A_after_reload_core.png`.

### 10. Credits and card on LETHAL (A) and SCORCHED (B)

Card (the first label), full credits in `$S/A_credits.txt` and `$S/B_credits.txt` (34 labels each).

LETHAL card: "Dr Adrian Tesseract: dead at his console, reaching for the key. / The database: with the vendors. Forty have answered. The fixes are ninety days out. / Nothing went at four. / One cell broken: Jennifer Walsh's people. / In Billings, a girl turns nine on Saturday. Her father is bringing a telescope."

SCORCHED card: "Dr Adrian Tesseract: gone, with everything he remembers. / The database: gone, both copies. Nobody holds the map. / Nothing went at four. / One cell broken: Jennifer Walsh's people. / In Billings ..." (title label AGENT 0x00: SUSPENDED follows MISSION COMPLETE).

Both endings:
- IN THIS OPERATION Kowalczyk: "Came through the service door for the key. Stopped. Never accused."
- SAFETYNET Kowalczyk, 'WREN': "Breaching lead, Task Force Null. Eleven years in SAFETYNET. Badge cancelled at six."
- HaX's closing line on Lethal ("Kowalczyk came through his door for the key. Nobody named her before she did it herself.") and the credits agree. No "Never named", no "Badge still active".
- No contradictions found. Lethal: Tesseract "His key never went down." (credits) against "dead at his console, reaching for the key" (card) reads consistently. Scorched: "Gone by the service door. He left a card." matches the Narrator's "On the console, a card in his hand: 'Afterwards, then.'"
- The Ghost line "Sold the head start. Clean exit, no trace." and "Zero Day: still trading. Its broker, Pieter Vos, named." are default arms here, because the head start skipped the mission up to the core. Not checked against a full route.

Screenshots: `A_card.png`, `A_credits_end.png`, `B_card.png`, `B_credits_end.png`.

### 13. Opening Narrator lines

- Hearing (B): first `brief` after the scene opened: Narrator, "A hearing room at the Citadel, two days later. Three people behind a table, and an empty chair beside yours until HaX sits in it." Visible, then it advanced by itself to HaX's "He still knows. But the map's gone..." within about 1.3 s (the harness did not advance it). It is on screen but short; a fast reader may not finish it. No screenshot caught it (the screenshot `B_hearing_open.png` is the 06:00 opening; `B_hearing_hax.png` is HaX's line that follows).
- Citadel (C): Narrator, "The Citadel, an hour later. Netherton is on the wall screen from Montana. Beside him, HaX's channel is still open. Nobody has spoken on it." Visible in three consecutive `brief` polls; the dialogue-text observer logged it for about 5.1 s before Netherton's first line (timestamps 144804 to 149893 ms). The scene waited for the harness here, unlike the hearing. Dialogue log in `$S/C.jsonl`.

### 14. JOIN end screen (C)

- Header bar reads "MISSION FAILED // AUDIO INTEL" (screenshot `C_card.png`). The credit title label is MISSION FAILED too. The old "MISSION COMPLETE // AUDIO INTEL" does not appear.
- Sampled every 10 s through the whole credits roll (10 samples), at the last label, after clicking Close, and after reopening the visualiser from the HUD "Visualiser" button: the header read MISSION FAILED each time (`C_credits_end.png`, `C_after_close.png`, `C_reopen_visualiser.png`). No separate conclusion screen appeared after the credits; the server did conclude the mission (`mission_concluded` event, and `night_closed`, `ending="joined"` persisted).
- Skip/close during forced credits: while the labels roll (about 95 s) the only buttons are PAUSE and AUTO. No Skip, no close button. The "CLOSE" button appears when the last label (Agent 0x6B Ana Lucia Ferreira) is reached, about 100 s in, and stays. A Skip button is absent on the first play and present when the visualiser is reopened from the HUD.
- Right-hand panel reads STATUS: MONITORING, THREAT: CRITICAL on Join (STATUS was blank in R1). Probably fine for a failed mission, but it sits oddly beside "MISSION FAILED". Left for the author.

Join credits (`$S/C_credits.txt`): 32 labels, "AGENT 0x00: Pressed the key." HaX: "Handler. Her last message to 0x00 went unanswered."

### Last line before the card; credits once

| Ending | Last scene line | Card then credits | Credits count |
|---|---|---|---|
| Lethal (A) | HaX: "There'll be a board. I'll be sitting next to you." | yes | one MISSION COMPLETE label, 34 labels in all |
| Scorched (B) | HaX: "They'll ask me if I'd have stopped you. I'll tell them I wasn't asked." | yes | one, 34 labels |
| Join (C) | Netherton: "Find 0x00. Bring them in, and bring them to me." | yes | one MISSION FAILED, 32 labels |
| Arrest (D) | HaX: "I said no. It took me till morning." | yes | one MISSION COMPLETE, 33 labels |

The `#bv-cr-label` observer shows each label once; the overlay opened once per run.

## Other observations

- **O-1 (needs a decision): a reload after the mission has concluded leaves the game inert.** In D, after the arrest ending, a reload plus Resume reopens the visualiser at once (header correct, close and skip buttons present, no credits roll, `__cr` empty), then after closing it the player cannot move: `brief.room` is `null`, `walk` and `moveTo` do not change the position, `enter` reports `no-doorway ... from: null`, and the event log shows `mission_concluded` but no `game_loaded` or `room_entered`. Credits correctly do not replay. If "game over, reload shows the end screen" is intended this is fine; if players should be able to walk the post-ending base after a reload, it is a bug. This is why item 1's reload half used game E.
- Head-start artefacts (not game bugs): carrying `director_netherton` and `hax_post` into the core plays the whole briefing and the "nothing went at four" Tesseract preamble on first load; a reload before that Tesseract preamble finishes replays it once.
- Harness: after a reload, click Resume first, wait for the overlay to clear, then send Space to the title, then close the mission brief and the tutorial prompt. Sending Space first, or `bootstrap`, misses a step. `brief` can report the title screen for a few seconds after it has gone; use `mg getState`.
- Sessions A to E were all stopped (`session-stop.sh`).

# m07 The Architect's Gambit: regression playtest

Question answered: **plumbing** plus **unexpected behaviour** (re-talks, reload, wrong password, KO). Not a solvability pass.
Walkthrough source: `scenarios/m07_architects_gambit/TESTING_WALKTHROUGH.md`. Headless, `fast` speed, Sonnet-style manual stepping.

Games and session logs (line numbers cite `m07-regress-session.jsonl` unless stated):
- 1192, main critical-path run: `tools/playtest/m07-regress-session.jsonl` (972 lines), flags `m07_architects_gambit-flags-game1192.xml`
- 1192, after-reload check: `m07-regress-session-reload.jsonl`
- 1199, Esc-closed-briefing variant, Park hub, phone close: `m07-regress-session-b.jsonl`
- 1206, Morrison mid-conversation re-talk: `m07-regress-session-c.jsonl`

## Result: status=completed, `mission_concluded_at` 2026-10-01 06:44:02 UTC (game 1192, read from the game record)

## verify-run.rb (game 1192, after `sync`)

```
game            1192  (mission 51)
created         2026-10-01 06:34:51 UTC
last write      2026-10-01 06:44:02 UTC
played for      551s of wall clock
unlocked rooms  4: security_checkpoint, operations_floor, server_room, scada_control
unlocked objs   1: crisis_control_system
inventory       6: Your Phone, Lock Pick Kit, Notepad, Facility Access Badge -- Server Zone, Listener Capture -- Operator Credentials, Sequence Abort Confirmation
NPCs met        7: opening_briefing_cutscene, agent_0x99, jake_morrison, the_architect, closing_debrief, elena_rodriguez, james_mercer
flags submitted 4: flag{..._1_23eb4d}, flag{..._2_b23858}, flag{..._3_5232d8}, flag{..._4_c18053}
globals set     33 (incl. architect_signoff_done, cascade_armed, debrief_played, grid_saved, mission_complete)
VERDICT: progress recorded — 3 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Game 1199 (variant run): `VERDICT: progress recorded — 4 rooms beyond the first, 0 objects unlocked, 0 flags submitted.` (generator_room and cable_vault reached, Park talked.)
Game 1206 was a single-conversation check only; no verifier run, no progress claimed.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Server-zone badge | (item) | Morrison KO drop (`debugKO`, assisted) in 1192; talked-round handover in 1199 | log l.146-160 | yes (1192 assisted) |
| Control-room door password | `CascadeWindow19` | Elena Rodriguez dialogue (turned), also printed in the flag-2 Listener Capture | l.~290-330; capture read after flag 2 | **yes**, from Elena before the door (l.502) |
| Cable vault PIN | `4703` | Elena dialogue, and the Plant Maintenance Log (read in game 1199) | 1192 l.~330; 1199 | yes |
| Plant key | (item) | Operations floor pickup (game 1199) | 1199 | yes |
| `scada_attack_host:flag_1..4` | `<flag:1>`..`<flag:4>` | VM challenge, none in standalone | l.~500-523 | **no** (standalone, session policy) |
| Listener Capture (flag 2 reward) | (item) | Relay handover on flag 2 | after l.~500 | yes (reward read in inventory) |

Flags rows are "no": the VM work (NFS export, high-port listener, SSH, sudo) was not possible. Everything from flag 1 onward was exercised, not tested for solvability.

## Checks requested

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Critical path to status=completed | **PASS** | status=completed, concluded_at above; debrief reached via console close then sign-off then debrief |
| 1b | Debrief line "And two of ours. Names withheld until the families are told." spoken by Netherton, reads naturally | **PASS** (see note A) | l.797; speaker `Director Magnus Netherton`, directly after "They died tonight, on your clock, while you were in Portland saving a different eight million." |
| 2a | Countdown arms at flag 3 | **PASS** | HUD `CASCADE SEQUENCE 14:58` right after flag 3 (l.512); before it the timer container was absent/"--:--" |
| 2b | HUD clock disappears after the win | **PASS** | on console open: `.scenario-timer-container` computed `display:none` |
| 2c | Reload after win: no restart | **PASS** | fresh browser on game 1192: container `display:none`, text "Next Event:--:--", `countdown_expired=false` after 6 s |
| 3 | Flag-2 Listener Capture in inventory and readable | **PASS** | inventory shows "Listener Capture -- Operator Credentials" (type text_file); TextFileMinigame opens with the capture text including `CascadeWindow19` |
| 4a | Architect first contact on ops floor | **PASS** | `architect_contact` set on entering `operations_floor`; bark "The Architect: Agent 0x00. Don't look for the trace." (l.171). In 1199 his phone thread read "No messages yet" until then |
| 4b | His sign-off opens when the console closes | **PASS** | closing the Cascade container opened a phone chat with the Architect (sign-off: "You saved eight point four million people..."), `architect_signoff_started`, debrief opened after it closed |
| 4c | No stale taunt | **PASS with note B** | Sign-off text is correct. Note B: the phone header preview under his name still showed "Agent 0x00. Don't look for the trace." |
| 5 | Re-talk hubs | **PASS** | Elena (1192, after a finished conversation): hub of 5 options returned. Park (1199): hub returned after mid-chat close and again after "Nothing. I was never here." ended it. Morrison (1206): hub returned after mid-chat close. A talked-round Morrison disappears by design, so no post-resolution re-talk exists |

## Other engine changes exercised

| Change | Result | Evidence |
|---|---|---|
| `globalVarOnKO` emits `global_variable_changed:morrison_ko` | PASS (assisted KO) | l.146-149 |
| KO item drop (badge) | PASS | `morrison_server_badge` appeared and was taken; `clear_the_checkpoint` completed |
| Wrong password counts an attempt | PASS | "Attempts: 1/3 / Incorrect password. 2 attempts remaining." (l.498); server logged a 422, no "Network error" |
| Phone chat emits `conversation_closed` once | PASS | exactly 1 `conversation_closed:agent_0x99` and 1 for `the_architect` per close |
| Collect `targetCount` default, aim reveal | not separately probed in m07 | |
| `objectives/unlock` endpoint | PASS | 4x POST `/objectives/unlock` returned 200, no 404 |
| Notes as flag rewards reach the notepad | N/A in m07 | m07 gives a text_file, not a note; notepad only held "Notepad" |
| Esc closes the briefing, HaX offers the commit menu | PASS | game 1199: Esc closed it, `assign_tactical_team` stayed open, HaX thread offered "Where the team goes: I'm ready to make the call." |

## Findings and notes (observations, not classified as bugs)

- **A. Timeline wording in the debrief.** "They died tonight, on your clock" is followed by "Eighty to a hundred and forty people did not survive that week" and "Ninety to a hundred and sixty dead over the following month". "Tonight" and "that week" disagree. The new "two of ours" line itself reads fine.
- **B. Stale text in the Architect phone header.** Phone chat header preview still shows the first-contact line while the sign-off is playing. The bark text is also his contact preview. Low severity.
- **C. Architect thread after the win not reachable.** After reload, the phone contacts list was empty ("Messages", no contacts), so "Hang up (`after_win`)" could not be exercised. Untested.
- **D. Credits after reload.** On reload after the win the bond visualiser reopens with `closable:true` and a "Mission Brief" notes minigame appears under it. This looks like the known intro-replay-on-reload issue; recorded only.
- **E. Harness: bootstrap hang after in-session reload.** After `location.reload()` on a game already in credits, `bootstrap resume:resume` never returned (5+ min), and the session had to be killed and restarted. A fresh session on the same game URL worked. Suspect harness/credits-overlay interaction; not investigated.
- **F. Console noise.** ~310 `POST /games/<id>/tts` returned 500: Gemini quota exhausted (log: `QuotaExhaustedError ... Retry in ~17h`). Environmental. It also made long lines advance slowly.
- No **regression** found in m07: nothing that previously worked failed.
- Not tested: the 15-minute expiry, redirect branches, Mercer record/hollowed/walks endings (hostile ending only; Mercer then `debugKO`, assisted), reload mid-debrief.

Mercer was met via the "Get away from the console" branch (hostile), then `debugKO` (assisted, combat not played). The Cascade console opened as a container without a flag prompt (`locked:false` in `room`) after flag 4.

# m08 The Mole: regression playtest

Question answered: **plumbing** plus **unexpected behaviour** (pre-brief ordering, wrong accusation, closable-conversation checks). Not a solvability pass.
Walkthrough source: `scenarios/m08_the_mole/TESTING_WALKTHROUGH.md`. Headless, `fast`.

- Game 1200. Session log: `tools/playtest/m08-regress-session.jsonl` (1554 lines); after-reload: `m08-regress-session-reload.jsonl`. Flags: `m08_the_mole-flags-game1200.xml`.
- Result: **status=completed, `mission_concluded_at` 2026-10-01 07:07:48 UTC** (game record).

## verify-run.rb (game 1200)

```
game            1200  (mission 52)
played for      804s of wall clock
unlocked rooms  8: main_lobby, operations_floor, security_archives, cryptography_lab, break_room, server_room, director_office, interrogation_room
unlocked objs   2: badge_printer, director_safe
inventory       9: Your Phone, Lock Pick Kit, Notepad, Post-It On The Coffee Machine, Printed Server-Zone Badge, Director's Access Keycard -- All Zones, Interrogation Room Key, Sealed Psych Evaluation -- Agent 0x47, Personnel Print Job -- Director's Investigation Request
NPCs met        11 (incl. nightshade_confrontation, closing_debrief)
flags submitted 4: flag{m08_the_mole_safetynet_gitlist_server_1..4_...}
globals set     36 (incl. accused_cipher, all_flags_submitted, debrief_played, fate_decided, mission_complete, nightshade_arrested, tomb_gamma_location_known)
VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Archives password | `TrustNoOne` | ATHENA, "Ask about the Security Archives" (also the break-room post-it) | l.~15-23 | yes |
| Badge printer PIN | `0311` | Break-room post-it ("Visitor badge printer PIN: 0311") | l.~230-244 | yes |
| Director's safe PIN | `2407` | Ops-floor personnel printout ("svc no. 2407") | printout read **after** the safe was opened (l.368) | **no**: I used it from the walkthrough, then confirmed the printout states 2407. Source verified, order not earned |
| Interrogation key | (item) | Director's safe | after l.368 | yes |
| Director's keycard | (item) | Netherton, "I'll need access" | after the brief | yes |
| `safetynet_gitlist_server:flag_1..4` | `<flag:1>`..`<flag:4>` | VM challenge | l.~960-1000 | **no** (standalone) |

Flag rows are "no": the GitList exploit and root work were not possible. Everything downstream was exercised, not tested for solvability.

## Checks requested

| # | Check | Result | Evidence |
|---|---|---|---|
| 6 | Critical path to status=completed | **PASS** | status=completed, concluded_at above. Debrief played to the end, then the bond visualiser |
| 7a | Confrontation has NO "End Conversation" | **PASS** | Controls list held only "Skip [SPACE]"; `.minigame-close-button` present but width 0; Esc did nothing |
| 7b | Can't close before choosing; after choosing the confrontation closes by itself and the debrief opens | **PASS** | After choosing "No deals" the scene played out and the debrief ("It's done, then. Agent 0x47.") opened with no input from me (l.839 onward). Timing of the ~2 s auto-close not measured precisely |
| 7c | Debrief plays before the credits | **PASS** | person-chat debrief ran to Netherton's last line, then `missionEnd.creditsShowing` |
| 8 | Aim ladder: nothing revealed before the brief | **PASS** | Before the brief I opened the archives (ATHENA's password), interviewed Cipher and Nightshade (Phantom not), printed a badge with the break-room PIN and entered the server room. Aims stayed `take_the_brief:active`, all other five `locked`, no tasks complete. After the brief: `take_the_brief`, `work_the_suspects` completed, `get_into_the_repo` active with `breach_server_room` already done; tasks ticked at once |
| 9a | Wrong accusation: accuse Cipher | **PASS** | `accused_cipher` set (l.95) while aims still locked |
| 9b | Apology after flag 4 | **PASS** | After flag 4 Cipher offered "The logs cleared you. I was wrong to say it." (l.517); reply "Thank you. People don't usually come back to say that..." |
| 9c | Debrief remembers it | **PASS** | "You accused Cipher to his face. I read the transcripts. It is in the file now..." (see note A) |
| 9d | Credits line | **NOT OBSERVED** (derived) | Credits scroll one line per 3 s in a `#bv-cr-label`; my collector missed it and credits do not replay their lines on reload. Live globals: `accused_cipher=true`, `cipher_ko=false`, which satisfy the scenario condition for "CIPHER: Accused to his face, then cleared by the logs". Not seen on screen |
| 10a | Psych eval signed Dr S. Okafor | **PASS** | "Evaluator: Dr S. Okafor, Psychology Division" (l.383); ink also names Dr Okafor |
| 10b | No "Mission 7" / "Dr Chen" in m08 | **PASS** | grep of `scenarios/m08_the_mole` (scenario, ink, compiled ink, mission.json): no "Chen", no "Mission 7". Session logs contain neither. "m07" appears only in code comments, `mission.json` `recommendedPrecedingMissions`, and one `mission.json` description string ("the familiar director from m07"), line 136 |

## Other engine changes exercised

| Change | Result |
|---|---|
| Re-talk Netherton after the brief | PASS, hub of 7 options returned (not "End of conversation") |
| Nightshade hidden once all four flags are in | PASS, `visible:false` in the crypto lab |
| Brief-gated task mappings (lesson 27) | PASS, see check 8 |
| Collect `targetCount`, `objectives/unlock` POST | `objectives/unlock` not exercised here; no 404 seen in m08 |
| Reload: aim statuses persist | PASS, all six aims `completed` after a fresh session on game 1200 |
| Notes into the notepad | PASS: Post-It and Personnel printout were added as notes (notepad held 3 notes per the game record) |

## Findings and notes (observations, not classified as bugs)

- **A. Debrief contradiction.** With `accused_cipher` true and `suspect_theory` unset, Netherton says "You accused Cipher to his face ... it will follow him longer" and then straight after "You let the box make the case and kept your own opinion out of it until it was proven. Cold, and correct." The second line contradicts the first for a player who accused someone.
- **B. Duplicate `update_room remove_object` request.** Picking up the printout (and the Post-It) sends two identical `POST /update_room` requests at the same moment; the second returned 422 in the console (log: Completed 422). Harmless on this run.
- **C. Harness.** `enter` often reports `no-known-doorway` or `did-not-cross` while the player does arrive a moment later, so the next `room` call shows stale position. Walking through unlocked west doors needed `walk left`. Nothing concluded about the game.
- **D. Slow long lines.** Some narrator lines needed 20 `continue` presses over ~40 s; the log shows ~300 TTS 500s (Gemini quota exhausted). Environmental.
- **E. Credits on reload.** Reload after the win reopens the visualiser with `closable:true` and no credits lines. Same family as the known reload replay issue.
- **No regression found** in m08.
- Not tested: arrest-vs-triple-agent contrast (arrest only), phone/Phantom interview, CyberChef, Netherton KO, reload mid-confrontation.

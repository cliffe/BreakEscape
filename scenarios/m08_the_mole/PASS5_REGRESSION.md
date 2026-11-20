> **Rename (2026-10-16):** Agent 0x23 'Cipher' is now 'Vector' (user's decision). Ids, globals, the ink file and routes were renamed with him (`agent_vector`, `accused_vector`, `vector_*`, `m08_suspect_vector.ink`). This file predates the rename and still says Cipher.

# m08 The Mole: pass 5 stage 1, regression run

Date 2026-10-13. Keyless server :3001 (already up; :3000 untouched). Headless, speed fast (load average about 21 when the run started, so headless as the skill advises). Regression run, not blind: the tester knew the route. It answers the "plumbing" question plus the engine-regression checks in `docs/agents/M08_PASS_BRIEF.md` stage 1. Source of steps: `PASS4_PLAYTEST.md` and `TESTING_WALKTHROUGH.md`.

## Game, log, evidence

| Item | Value |
|---|---|
| Game | 2375 (mission 52), fresh game, tutorial declined at the prompt |
| Session log | `tools/playtest/m08-pass5-regression1-game2375.jsonl` (1,180 lines, 1,179 commands) |
| Flags XML | `tools/playtest/m08_the_mole-flags-game2375.xml` |
| Screenshots | session scratchpad `m08-regression-1/` (files 01 to 36, cited below by number) |
| Wall clock | about 23 minutes (22:19 to 22:37 UTC) |
| Reloads | three page reloads (log lines 516, 697, 878): after the clone, after the USB stick was taken, and after a KO |
| Credits | **reached.** 16 credit lines read from `#bv-cr-label` with a MutationObserver; `mission_complete` set server-side |
| Sessions | the one session was stopped (`session-stop.sh 2375`); no harness or browser process left; :3000 not touched |

## verify-run.rb (game 2375, pasted)

```
game            2375  (mission 52)
created         2026-10-13 22:19:05 UTC
last write      2026-10-13 22:36:49 UTC
played for      1064s of wall clock
current room    "main_lobby"
unlocked rooms  8: main_lobby, cryptography_lab, director_office, operations_floor, intel_analysis, server_room, break_room, interrogation_room
unlocked objs   2: nightshade_locker, director_safe
inventory       9: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Server Access Log (excerpt), USB Stick -- PERSONAL_BACKUP.enc, Personnel Print Job -- Director's Investigation Request, Interrogation Suite Code Card
NPCs met        12: opening_briefing_cutscene, receptionist_ai, agent_0x99, closing_debrief, agent_nightshade, director_netherton, agent_cipher, background_analyst, agent_phantom, agent_0x99_person, background_agent, nightshade_confrontation
flags submitted 4: flag{m08_the_mole_safetynet_gitlist_server_1_c6aa42}, ..._2_9a8af4, ..._3_1c179a, ..._4_b8ce9f
globals set     46: access_nudge_sent, all_flags_submitted, ..., debrief_played, ..., mission_complete, mole_identified, ..., nightshade_arrested, nightshade_print_lifted, ..., tomb_gamma_location_kno[wn]

VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Director's card | (cloned) | Netherton's lanyard, after all three interviews, via his "step up beside him" option | log 404 to 489 | yes |
| Safe PIN | `2407` | "Personnel Print Job" on the ops floor: "Requested by: Director M. Netherton (svc no. 2407)" | read just before log 825 | yes |
| Suite code | `5386` | Interrogation Suite Code Card in the Director's safe | read before log 902 | yes |
| Locker (Nightshade) | lock pick kit | Start kit; `completeLockpick` (dexterity, assisted) | log 683 | PASS (assisted) |
| `safetynet_gitlist_server:flag_1` to `flag_4` | `<flag:1>` to `<flag:4>` | Not earned: standalone has no VM | log 604 (flag 1), 846 to 856 (flags 2 to 4) | **no, flag supplied** |

The flag rows are the boundary of what this run proves. The server-room entry, launcher text and flag-station wiring were exercised and work. Everything about whether the real box can be exploited and the credentials found is **needs checking against SecGen by the user**. Flags 2 to 4 were submitted in one burst with no door audit done, so the flag-4-before-audit order was exercised too. Not played: the archives (`TrustNoOne`), the printer PIN (`0311`), Netherton's audit check, any accusation, Nightshade's key from his audit.

## Results against the pass-4 script

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Open and Netherton's first line | Pass. ATHENA's cutscene plays once; the brief completes on his first line; "I have run field operations for five years", and "He taught your intake" in the Nightshade topic. HaX's first toast arrives after the cutscene | 02, 03; log 6 to 130 |
| 2 | "I'll need access" before interviews | Pass. "Not yet. Talk to all three first" plus one line per suspect; option stays; no card | log 94 to 100 |
| 3 | Cipher handle line; Phantom sprite | Pass. "I had it first. Eleven years first." Phantom has his own sprite, shirt and tie | 05, 06; log 192 (Cipher), 232 (Phantom) |
| 4 | Back to Netherton | Pass. Refuses, turns to the maps, "Step up beside him and let the cloner read his card" appears (brackets are not shown on screen) | 10; log 330 |
| 5 | Close the cloner before Save | Pass. "The cloner did not get a clean read. He has not moved." Clone option stays; `netherton_card_taken` false | 12; log 392 to 395 |
| 6 | Save the clone | Pass. "Whatever you are carrying, Agent, I did not see it." "Understood, Director" closes the chat. HaX toast: "You cloned the Director. Nightshade said it once…emulate it from the cloner's Saved list." Both globals true | 15; log 404 to 489 |
| 7 | Reload, then the server-room reader | Pass. Saved, Director Netherton Keycard, Emulate opens the door; "Access Granted: RFID lock unlocked!" toast; `breach_server_room` ticks; HaX offers the recon guide | 19, 20; log 516 to 570 |
| 8 | Locker, USB stick, dusting after a reload | Pass. Stick observation names a thumbprint, no Base64 or ROT13. Dusting panel opens after the reload. Candidates offered: Director Netherton and Nightshade (pattern narrowing). Wrong pick marks "not a match" and `nightshade_print_lifted` stays false; Nightshade then "Log the print" sets it true. HaX: "A print off the stick. Check it against the locker's owner…" | 27, 28, 30, 31; log 773 to 801 |
| 9 | Launcher and flag 1 | Pass. Launcher text is the generic standalone one; HaX after launcher: scanning and vulnerability-analysis guides; after flag 1: "On the box already? Our own code server…Want the git secrets guide?" | 22, 23; log 604 |
| 13 | All four flags | Pass for the wiring. "Whole chain's in. He's been walked down to the interrogation room…Suite code's in the Director's safe, if you don't have it. Finish it." The "Get the interrogation-suite code" task already ticked because the card was read | 32; log 846 to 860 |
| 14 | Suite scene | Pass. Cutscene on the `hq2` background, "Nightshade stands at the table with both hands flat on it." Lines: "And you printed the stick. Of course you did." Option "Every mission, the PIN cracker stayed on your bench." answered | 35; log 902 to 940 |
| 15 | Fate and debrief to the credits | Pass. Arrest branch, Tomb Gamma, the Architect's teacher line ("Let it hurt afterwards, not during.") delivered by Nightshade; debrief; credits | 36; log 938 to 1173 |

Not run: steps 10 to 12 (badge printer route, accusation before flag 4, door-audit check with End Conversation at step 2). They are the Run B route and need a second game.

## Credits read from the DOM (16 lines)

```
THE MOLE
THE LEAK: Agent 0x47 'Nightshade', placed by ENTROPY during training and dormant for fifteen years
── THE FATE ──
NIGHTSHADE: Handed to the police with the full case file. No deal.
TOMB GAMMA: Coordinates given up in the interrogation room – Montana
── THE SUSPECTS ──
CIPHER: Knocked out. Innocent.
PHANTOM: Cleared. His off-book hunt pointed the right way.
── RECOVERED ──
THE USB STICK: His thumbprint on the casing. Nobody planted the mail.
THE SERVER ROOM: The Director's card, cloned off his lanyard while he studied the maps
GLOBAL THREAT DATABASE: Confirmed stolen during the four-site night
── ON THE RECORD ──
AGENT 0x00 TO THE DIRECTOR: Own the gap
THE ARCHITECT: At large, with every weakness SAFETYNET ever catalogued.
ENTROPY: Still operational.
```

The clone and USB-stick credits are gated on what was done and read correctly. "CIPHER: Knocked out" matches the `debugKO` taken before the reload.

## Engine regression checks (brief stage 1)

| Check | Result |
|---|---|
| Lighting variants | **Nothing to check:** the scenario has no lighting config (`grep` finds no `lighting`). Rooms render fully lit, and the server room shows one pale floor circle (visible in 20 and 22; a sprite or tile, not a light). Lighting is stage 4 work |
| Toasts | Pass. Task, Objective and Mission Updated toasts stay long enough to read; HaX text toasts carry her avatar and persist for the reading time (screenshots taken 5 to 7 s after the trigger still show them) |
| RFID denial hold | **Not exercised.** m08 has one reader and one card, and the only way to a denial is presenting a wrong card, which this route never offers (Saved lists only the Director's card). `door_unlock_failed` was not seen. Needs a second card (the printed badge route) or a wrong-card setup to test |
| KO on reload | Pass. `debugKO agent_cipher` (log 868), sync, reload, Resume: `isKO` still true and the body lies by the desk (34); log 868 to 890. No drops |
| Sight challenges | **None configured** (`grep` finds no `los` or `challengeOnSight`). Nobody reacts when the player walks up; Cipher flinched only when spoken to. Stage 2 work |
| Tutorial hold | Pass. HaX's first toast arrived while the tutorial prompt was open and nothing fired against the prompt (02); declining persists (`engine_tutorial_declined`; no prompt after any reload) |
| Required-task `*` marker | Works as coded: the three interview tasks show `*` in "Work The Three Suspects" (04); the "* required" key appears in the panel header. See finding 8 for the aim with no optional task |
| `nightshade` sprite | Pass. Both Nightshade NPCs use `spriteSheet: nightshade` and `nightshade_talk.png` (erb 1395 to 1396, 1490 to 1491); the walk sprite and bust render (08, 35) |
| `agent_hax` sprite and HaX's new bust | **Fail.** See finding 1 |

## Findings

0 blockers, 4 majors, 11 minors (the three "planned work" rows are minors that stages 2 to 4 will close anyway).

| # | Sev. | Finding | Repro and evidence |
|---|---|---|---|
| 1 | major | HaX in m08 does not use `agent_hax`. The in-person NPC uses `female_hacker_hood_v2` with `female_hacker_hood_talk.png` and `_visemes.png` (erb 1576 to 1578), and the phone NPC's avatar is `female_hacker_hood_headshot.png` (erb 595). m01 and m07 use `agent_hax`, `agent_hax_talk.png`, `agent_hax_visemes.png` and `agent_hax_headshot.png`. The result is a coarse, faceless grey-hoodie bust that matches neither the other m08 busts nor HaX in the earlier missions. Nothing to do with the `nightshade` rename, which is fine | Break room, talk to HaX (25; log 625 to 660); `grep -n female_hacker scenarios/m08_the_mole/scenario.json.erb`. The assets `agent_hax*.png` all exist. Fix is wiring, not art |
| 2 | major | Director Netherton (and the debrief Netherton) still use the generic `male_spy_v2` (erb 993, 834), though m04 created a `netherton` sheet, talk sheet and visemes and wires them (`scenarios/m04_critical_failure/scenario.json.erb:586`). Same man, two faces across the season | Director's office (03, 10); `ls public/break_escape/assets/characters | grep netherton` |
| 3 | major | The answer is handed over by wording before any evidence. All of these show before the door audit or the box: the optional task "Tell the Director who the door audit puts in the Crypto Lab", the interview task "Interview the cryptography lab's duty officer" (the one suspect not named in his task), the server-room excerpt "TERM crypto-lab-04", HaX in person ("When you're across that table, he'll explain…He's had fifteen years to polish it") and the ops-floor personnel printout, which is Nightshade's record alone. The brief says deduction must not be handed over by a task title or NPC. Source gating of the HaX lines not checked in ink (read-only run); the break-room chat was available with only the interviews and the server room done | 04 (task titles); log 578 (`server_access_logs` text); log 641 (HaX); log 809 (printout). For the stage 2 reviewers |
| 4 | major | The brief's rule "red herrings should cost something" has no cost in this route: Cipher and Phantom cost nothing (no reaction to being accused was run here), and the Director's lanyard clone has no trace for the mole to react to. Observation only: this run did not play the accusation branches, so this is a design flag for stage 2, not a defect found by playing | Not run; listed so stage 2 checks it against `PUZZLE_CHAINS_PLAN.md` |
| 5 | minor (planned) | No sight challenges. None of the NPCs reacts to the player on sight. Cipher "does not look up until you are right on top of him" is narration only | No `los` block in the erb; walked up to Cipher at log 174 to 192 |
| 6 | minor (planned) | No lighting config; every room is fully lit, so the night-shift mood the opening sets up ("Every badge reader blinks red") has no visual | 03, 20, 24 |
| 7 | minor (planned) | Person chats have no `chatBackground` and show a black backdrop (the cutscenes have `hq2` backgrounds, so the contrast is sharp) | 05, 06, 08, 25 |
| 8 | minor | The "* required" key says "Unmarked tasks are optional", but in "Get Into The Internal Repository" the server-room and flag tasks are required (the flag tasks are in `concludeRequires`) and show no `*`, because `objectives-panel.js:90-96` only marks an aim that has a visible optional task. Reads wrong beside the marked interview tasks. Engine behaviour, so goes to `DECISIONS_PENDING.md` rather than a mission fix | 04 (aim "Work The Three Suspects" marked) against 15 (aim "Get Into The Internal Repository" unmarked), key text at `objectives-panel.js:41` |
| 9 | minor | Crypto Lab layout: `moveToNear agent_nightshade` stops 60 px short (`arrived-but-outside-plain-range`, `moveShortfall` 46, three nudges). Interact still worked through the menu ("approached-then-menu"), so a player can talk to him, but the desk and chair block the direct approach | log 279; 07, 09 |
| 10 | minor | The USB stick's dusting panel prints the whole ciphertext on one unbroken line that runs out of the panel frame to the right and off screen | 27 |
| 11 | minor | The three stacked toasts (Task Complete, Objective Complete, Mission Updated) cover Nightshade's face when the suite scene opens, and a Task Complete toast covers the top of the portrait in the interview chats | 35, 06, 08 |
| 12 | minor | The Director's safe keypad is titled "Enter PIN for item" (the generic title, not the object's name); the harness also flagged it `wrong-target-opened` for that reason, so a scripted run reads it as a failure | log 824 |
| 13 | minor | The credits' "THE LEAK: …placed by ENTROPY during training and dormant for fifteen years" sits oddly with what Nightshade says in the room ("ENTROPY only told me what I'd already worked out alone…I stopped shielding the flame") and Okafor's "ideological drift" in the debrief. Both can be true (the Architect "put me here"), but the credit asserts the version the player may not have heard. Story ruling for stage 3 | Credits line 2; confrontation hub |
| 14 | minor | "PHANTOM: Cleared. His off-book hunt pointed the right way." printed after a run in which the tester asked Phantom nothing and read none of his notes. Check whether the line is gated on the notes or the alibi | Credits line 8; log 232 to 260 |
| 15 | minor | Reload order: the "Mission Brief" note pops up over the title screen before the "Resume Session?" overlay is answered. On the first reload the overlay did not appear (straight into the game after the brief); on the second and third it did, with six other sessions listed. Inconsistent, not a loss of progress (inventory, globals, cloner cards and the KO body all came back) | log 516, 697, 878; 26 |

Harness notes, not findings: the RFID "Save" control is missing for about a second after the read screen opens (first `clickControl Save` failed with `no-control-matching:Save`, the retry worked, log 392 then 395); after a reload the inventory icons carry no `title`, so `interactInventory("USB Stick")` is needed instead of a DOM lookup.

## Counts

0 blockers, 4 majors (1 and 2 are wiring, 3 is design wording, 4 is a design flag from a branch not played), 11 minors.

## Handed to later stages

- Stage 2: findings 3 and 4, the aim ladder and the red herrings; sight challenges (5); HaX hub progress-gating (m04 pattern).
- Stage 3: findings 13 and 14, credit gating; HaX's in-person line "he'll explain" (3).
- Stage 4: lighting (6), chat backgrounds (7), the Crypto Lab approach (9).
- Wiring that can happen now without art: findings 1 and 2 (existing `agent_hax` and `netherton` assets).
- `DECISIONS_PENDING.md`: finding 8 (engine).
- Steps 10 to 12 (the badge-printer route, accusation, audit check) and the RFID denial hold still need a second game.

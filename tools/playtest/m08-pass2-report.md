# m08 The Mole, pass 2 playtest

Questions answered: (1) plumbing, (2) unexpected behaviour (aim ladder, wrong accusations, early lockpick, mid-scene close, Netherton KO), partial (3): solvability is NOT proven, flags were handed over (standalone, no VM).
Walkthrough source: scenarios/m08_the_mole/TESTING_WALKTHROUGH.md + PASS2_IMPROVEMENTS.md.

## Sessions and evidence
| Run | Game | Session log | Verifier | What |
|---|---|---|---|---|
| 1 | 1181 | tools/playtest/m08-pass2-session.jsonl (811 cmds) | m08-pass2-verify-run1.txt | Full route, keycard + safe, wrong accusations, fate = handover (arrest). status=completed, mission_concluded_at 02:14:23 |
| 2 | 1182 | tools/playtest/m08-pass2-session-run2.jsonl | m08-pass2-verify-run2.txt | Netherton KO'd, printer route, lockpick on interrogation, fate = triple agent. status=completed, mission_concluded_at 02:20:03 |
| 3 | 1183 | tools/playtest/m08-pass2-session-run3.jsonl | n/a (analyst talk only) | Junior Analyst talk and re-talk |

Verifier output (run 1, game 1181):
```
unlocked rooms  9: main_lobby, cryptography_lab, interrogation_room, operations_floor, security_archives, intel_analysis, break_room, server_room, director_office
unlocked objs   2: badge_printer, director_safe
inventory       9: Your Phone, Lock Pick Kit, Notepad, Personnel Record Printout -- Agent 0x47, Post-It On The Coffee Machine, Printed Server-Zone Badge, Director's Access Keycard -- All Zones, Interrogation Room Key, Sealed Psych Evaluation -- Agent 0x47
flags submitted 4 (flag{m08_the_mole_safetynet_gitlist_server_{4,1,2,3}_...})
VERDICT: progress recorded -- 8 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```
Run 2 (game 1182): 7 rooms unlocked, badge_printer unlocked, 4 flags, same VERDICT line (6 rooms beyond the first). Full text in the verify files.
verify-run.rb does not print status; I read it with a runner: both games `status=completed`, `mission_concluded_at` set.

## Earned-secrets table
| Secret | Value used | In-game source | Obtained at (run1 log seq) | Earned? |
|---|---|---|---|---|
| Archives password | `TrustNoOne` | ATHENA "Ask about the Security Archives" (seq ~30-60); also break-room post-it | before use at seq 146 | yes |
| Director's safe PIN | `2407` | ATHENA hint ("signs service number on printouts, one in the ops tray") then ops-floor Personnel Record Printout, "Requested by: Director M. Netherton (svc no. 2407)" (seq 120-130) | before use at seq 308 | yes |
| Netherton's keycard | item | Netherton "I'll need access" (seq 290-302) | before server room (second entry) | yes |
| Badge printer PIN | `0311` | Break-room post-it (run1 seq ~230, run2 seq ~78) | before use at seq 238 / 82 | yes |
| Interrogation room | key from safe (run1); start-inventory lockpick (run1 early, run2 final) | safe / start inventory | run1 seq 308+ | yes (lockpick PASS assisted) |
| flags 1-4 | `<flag:1>`..`<flag:4>` | Evidence Relay Terminal, session-supplied | handed over | **no** |

Flags rows are "no": the GitList VM work (exploit, creds, sudo) was not done (standalone, no VM), and the prerequisite chain on the VM was not exercised. Everything downstream of flag submission (confrontation, fate, debrief, credits, conclusion) was exercised, not tested for solvability. Flag 4 and flags 1-3 were submitted in that unusual order in run 1 on purpose.

## Priority results
1. Critical path to completed: PASS (run 1 and run 2, server-confirmed). All non-flag secrets earned.
2. Aim ladder: PASS. Before talking to Netherton (run 1): lockpicked the interrogation room (seq 30), read the evidence wall ("Awaiting evidence") and disposition screen ("No detainee on record"), interviewed Nightshade, Cipher, Phantom, opened the archives (TrustNoOne), printed a badge and entered the server room. Aims stayed: take_the_brief active, all others locked throughout. After the brief (first line), the same objectives ticked at once: work_the_suspects tasks interview_cipher/phantom/nightshade/read_the_archives and get_into_the_repo/breach_server_room (event log seq 614-633). Confront The Mole did not reveal on the lockpick. Residual as documented: flag 4 before the brief-gated flags reveals correlate_the_evidence.
3. NPCs: PASS with notes. All nine visible and talkable in their rooms: ATHENA, Netherton, Cipher, Phantom, Junior Analyst, Nightshade (lab), confrontation Nightshade, HaX (break room), Off-Duty Agent. Coordinates all inside the room footprints; nearest furniture 30-55 px (Phantom beside phantom_notes 30 px, Nightshade beside a chair 15-33 px after the chair moved). I did not take screenshots, so "clear of furniture" is by coordinates only. Re-talk: ATHENA, Nightshade, Cipher, Phantom, HaX, Off-Duty Agent, Netherton, Analyst all return a hub, no "(End of conversation)". Netherton's re-talk only offered "I'm ready. Let me work." (other hub topics were already consumed).
4. Wrong accusation: PASS. Accused Cipher and Phantom (and Nightshade) pre-brief. After flag 4 both offered an apology line ("The logs cleared you. I was wrong to say it." / "You were right. I was wrong to put it on you."). Debrief the_hunt said "You accused both of the innocent men to their faces"; credits: "CIPHER: Accused to his face, then cleared by the logs", "PHANTOM: ... cleared by a flight manifest", "YOUR FIRST CALL TO THE DIRECTOR: Cipher -- wrong, and corrected".
5. Confrontation: PARTIAL. See D1: the "End Conversation" button closes it mid-scene (the x close and Escape are blocked). Fate recorded (run 1 `nightshade_arrested`, run 2 `nightshade_triple_agent`, `fate_decided` both). Debrief played in full before credits in both (the bond visualiser opened only after the debrief closed). Credits differ per fate (handover / triple agent, accusations, Director KO line). Not tested: reload mid-scene (known engine reload issue).
6. Netherton KO route: PASS (run 2, via debugKO, PASS (assisted)). brief_with_netherton completed, HaX message points to the break room and printer, post-it PIN 0311 printed a badge, server room opened, breach_server_room completed, game completed. No keycard dropped.
7. Unexpected: see defects. No "Mission 7" (static grep of ink and scenario: only comments), no US spellings found in a grep, no line says SAFETYNET arrests anyone (the confrontation ink comment says it must not; the debrief says "goes to the police"; credits "Handed to the police"). No barks over conversations observed (I did not stress this).

## Defects and observations
D1 (major) Confrontation can be closed mid-scene. In the opening line of the confrontation, `mg close` and Escape are refused, but `clickControl "End Conversation"` (id minigame-cancel, enabled, shown beside "Skip") closes it. Repro: all four flags in, enter interrogation room, click End Conversation. Result: run 1 session log seq ~524; `fate_decided=false`, tasks decide_the_fate and take_the_debrief still open; no debrief opened. Re-entering the room reopens the scene from its start, so it is recoverable. Suspect engine (`disableClose` blocks x/Esc but not the cancel button). I did not test the button at the fate-choice screen.
D2 (minor) After an apology, Cipher/Phantom still use their pre-clearing sign-off: Cipher "Check the logs. That's all I ask." and Phantom "Pull the manifest. Then come and apologise, or come and cuff me. Not both." (run 1, seq ~373-380 and after).
D3 (minor) Run 2 only: the last debrief line stayed on screen for about 17 consecutive "continue" presses before the conversation closed (run 1 needed two). Credits then appeared normally. Log run2 seq ~215-330. Suspect engine/typing timing; unconfirmed.
D4 (minor) HaX still says "The Director will give you his keycard if you ask him for access" after Netherton was KO'd (hub answer is not conditioned on netherton_ko; the unprompted message is).
D5 (minor) In the confrontation Narrator line the Director "countersigns" / "you owe him the answer to his face" with Netherton KO'd (run 2). Debrief option "Okafor told you in writing" is offered to a player who never read the psych eval (run 2).
D6 (observation) The Director's safe printout is titled "Personnel Record Printout -- Agent 0x47" while the key line is the Director's number; works (clear after reading) but the title points at the wrong man.
D7 (observation) Door IDs: crypto lab and ops floor list no door back to the lobby in `room`; the harness must walk through the remembered gap. Not game-facing.
Known engine issues were not chased. The `no-effect-confirmed` on the first printout click came from a 37 px plain distance (gather radius 32); it opened after a closer approach.

## Not covered
Nightshade/Cipher/Phantom KO, CyberChef decode, reload mid-debrief, Phantom's notes, the timeline note, flags with a real VM, barks while a conversation is open (none seen), screenshots of furniture clearance.

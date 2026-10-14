# m08 pass 5: browser check of the blind-run-A fixes

Date 2026-10-14. Keyless server :3001 only, headless (load about 1), checked-in harness scripts only, viewport as the harness default (screenshots 1400x1000). No mission files edited, nothing committed, no SecGen XML or restricted exploit guide opened. Both sessions started here were stopped with `session-stop.sh`.

Question answered: do the six items owed after "Phase 8 playtests: blind run A fixes" (`IMPROVEMENT_LOOP_LOG.md`) behave on screen. Plumbing check, not a solvability pass.

## Games and logs

| Game | Purpose | Session log (`tools/playtest/`) | verify-run |
|---|---|---|---|
| 2511 | Main run: three suspect menus, safe, HaX phone, break room, archives audit, Cipher confirmation, Director's trust question (wrong option then right), naming, suite, confrontation with "Read the wall first", reload mid-confrontation, "Face him", fate, reload after the fate | `m08-pass5-fixcheck-game2511.jsonl` (1323 commands) | "progress recorded, 8 rooms beyond the first, 1 objects unlocked, 4 flags submitted" |
| 2512 | Lamp before the naming (fresh game, suite PIN typed early), door sign, reload before the naming | `m08-pass5-fixcheck-game2512.jsonl` (63 commands) | "progress recorded, 2 rooms beyond the first, 0 objects unlocked, 0 flags submitted" (short game by design) |

Scratch (driver scripts, screenshots): session scratchpad `m08-fixcheck/` (`accuse_cipher.png`, `accuse_nightshade.png`, `suite_after_fate_reload.png`, `g2_suite_prenaming.png`).

## Earned-secrets table

| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| Director's safe PIN | `2407` | Personnel Print Job, ops floor ("Requested by: Director M. Netherton (svc no. 2407)", "every safe opens on its owner's service number") read first in game 2511 | yes |
| Director's card clone | cloner: Crack keys, Darkside, Save, Emulate | Director's "Step up beside him" option, then the cloner | yes |
| Archives passphrase | `TrustNoOne` | Post-It on the break-room coffee machine, read first. HaX's hint ("Try the break room, round the coffee machine.") was read before | yes |
| Suite PIN | `5386` | Interrogation Suite Code Card in the Director's safe (read, game 2511) | yes in 2511. **Game 2512: typed without earning it, exercised, not earned** (only used to load the room for the unlit-lamp check) |
| `safetynet_gitlist_server:flag_1..4` | `<flag:1>`..`<flag:4>` | Evidence Relay Terminal | **exercised, not earned**: harness-supplied. The GitList VM was never touched. Everything downstream (the naming, suite, confrontation, debrief) is exercised, not earned. VM content: needs checking against SecGen by the user |
| Door-audit answers to the Director | 10:38, Nightshade, "out of the lab at 10:32", "The people on it confirm their own rows" | Badge Audit Printout (read before), Cipher's own confirmation (heard before) | yes |

## Result per item

### 1. RECORDING lamp and door sign: PASS (one note, L-1)

Object `recording_lamp` in `interrogation_room`, texture read from the loaded room (`window.rooms.interrogation_room.objects.recording_lamp.texture.key`).

| State | Game | Texture | Seen |
|---|---|---|---|
| Fresh game, suite unlocked, before entering | 2512 | `hq_recording1` (unlit) | room loaded on door unlock |
| Inside the suite before the naming (`all_flags_submitted` and `mole_identified` false) | 2512 | `hq_recording1` | screenshot `g2_suite_prenaming.png`: dim "RECORDING" sign, case file shows three "?" cards |
| After reload, before the naming, re-entered | 2512 | `hq_recording1` | unlit holds |
| Naming done, suite unlocked, before entering | 2511 | `hq_recording_on1` (lit) | see L-1 |
| Confrontation opening choice on screen | 2511 | `hq_recording_on1` | |
| Reload in the middle of the confrontation (player back in the lobby), re-enter, opening choice again | 2511 | `hq_recording_on1` | lit holds across a reload |
| Fate chosen, "Netherton finds you in the corridor..." on screen | 2511 | `hq_recording1`, `fate_decided` true | read at each of six lines |
| Reload after the fate (credits overlay and the Resume overlay dismissed through the DOM), suite entered | 2511 | `hq_recording1`, `fate_decided` true | screenshot `suite_after_fate_reload.png`: sign dark, evidence wall reads "CONCLUSIVE", disposition panel "HANDOVER" |

Lit-lamp world screenshot was not possible: the confrontation opens a person-chat on entry and its close button does nothing while it runs. The lit state is shown by the texture only. Entry text on screen in the pre-naming state: the room shows no chat.

Door sign: from the lab (game 2512, before unlocking) the door entity reads `"name": "Interrogation Suite"`, id `door:cryptography_lab->interrogation_room`, and the PIN keypad opens from it. Quoted from the scan and the interact result. The keypad panel itself shows no door name (it says "Enter PIN for door").

### 2. Confrontation opening choice: PASS

Game 2511, on entering the suite after the naming:
- Narrator "The interrogation room records everything. Nightshade stands at the table with both hands flat on it. He doesn't sit." then "Behind him the evidence wall is lit. He follows your eyes to it and waits."
- Choices: "1. (Read the wall first.)" and "2. (Face him.)".
- "(Read the wall first.)": "The case runs down the wall in order. The repository, opened with no password. Credentials left in its history. Mail to the Architect. Root, and forty-seven minutes on the Portland plan from a Crypto Lab terminal." / "Under it, Okafor's evaluation, with the Director's seal across the recommendation." (Okafor's file had been taken from the safe) / "Pinned beside it, the door audit. One row ringed in red: 0x47, in at 10:15, out at 11:43." / "Nightshade lets you finish. He has read it already." then the single choice "1. (Turn back to him.)", then "You found it. Forty-seven minutes on the Portland plan, two days before you deployed. My account, my terminal, my mail." and on to "It's over, Nightshade. Tell me why."
- Second pass (after the reload, re-entering the suite): the same opening menu, "(Face him.)" went straight to "You found it. Forty-seven minutes..." with no recap. Both routes reached the same menu.
- Not exercised: the recap without Okafor's file (the line "Under it, Okafor's evaluation..." omitted). The route driver r26 covers it in ink.

### 3. Three sealed files in the Director's safe: PASS

Game 2511, `director_safe` opened with 2407. Contents listed: Interrogation Suite Code Card, Sealed Psych Evaluation (Agent 0x47), Sealed Vetting Query (Agent 0x23), Sealed Standards Referral (Agent 0x88). All three sealed files were taken and opened from the inventory as text files; quoted:
- Okafor: "CLASSIFIED – PSYCHOLOGICAL EVALUATION ... ACTION TAKEN: [SEALED BY ORDER OF THE DIRECTOR – M.N.] ... 'I put this in writing. Whatever happens, I put it in writing.'"
- Cipher: "CLASSIFIED – VETTING QUERY ... crypto annex badge issued outside this office's chain ... Signs hardware tokens out of the annex cabinet at night, alone ... ACTION TAKEN: [DEFERRED BY ORDER OF THE DIRECTOR – M.N.] ... 'The annex says he is theirs. I have asked twice.'"
- Phantom: "CLASSIFIED – PROFESSIONAL STANDARDS REFERRAL ... Three absences from the floor in six weeks, none on the roster ... An undeclared meeting with a foreign liaison officer ... ACTION TAKEN: [HELD BY ORDER OF THE DIRECTOR – M.N.] ... 'Not until Portland is closed.'"

Reading Okafor's file set `found_nightshade_profile` (global present in the run) and fed the wall recap above. See N-2 for how items leave the safe.

### 4. Accusation choices fit their buttons: PASS

Headless default viewport, buttons are `overflow:hidden; white-space:nowrap`, so a clipped label would show `scrollWidth > clientWidth`. Measured at the menu:

| Suspect | Choice (on screen) | scrollWidth / clientWidth |
|---|---|---|
| Cipher | "5. I think it's you, Cipher. (Out loud. The whole floor will hear.)" | 608 / 608, screenshot `accuse_cipher.png` shows the whole label with room to spare |
| Phantom | "4. I think it's you, Phantom. (Out loud. The whole floor will hear.)" | 583 / 583 (DOM only) |
| Nightshade | "5. I think it's you, Nightshade. (Out loud. The whole floor will hear.)" | 832 / 832, screenshot `accuse_nightshade.png` (widest panel, the label ends well inside the button) |

Nothing clipped on any button in any menu opened in the run (the check also ran over the other choices in those three menus). Only the wide 1400x1000 viewport was tried; a narrow phone-width layout was not.

### 5. Audit row, off-duty testimony, HaX hint: PASS

- Badge Audit Printout, quoted: "07:52  IN   0x3C  OFF-SHIFT (break room; no planning clearance)", with "(next event: 13:10 OUT 0x3C)" under the Crypto Lab door block.
- Off-duty agent (break room), first talk then "What did you see that morning?": "You didn't hear it from me. Two days before Portland I was in here from before eight." / "Went through to the lab for the stapler. Just gone twenty past ten, half past at the latest." / "Someone at the bench at the far end. Had the build of the nerdy one, Cipher. Or not. I wasn't looking." / "And before you ask, I'm off-shift with no planning clearance. I couldn't open that share if I wanted to." / "I'm sitting where I can see the door. You should too." The new line does not name the mole.
- HaX phone, "Where would the door logs be?": "Security Archives, south of the ops floor. Facilities set the passphrase, and facilities write things down. Try the break room, round the coffee machine." then "The lab's got one door. Whatever that door saw, it saw everyone." The post-it then read "Archives backup pw: TrustNoOne", and the passphrase opened the door on the first try.

### 6. Audit-trust question: PASS

Game 2511, Director, after "I can name the leak" and the 10:38 / Nightshade / "out of the lab at 10:32" picks. Question: "That audit is Phantom's query, off Phantom's printer. Why trust it?" Options: "1. The people on it confirm their own rows." / "2. Phantom's own row puts him on a plane." / "3. It agrees with the auth log Phantom pulled." / "4. It looks like a straight badge-system printout." / "5. Let me read it again."

Picked 4: Director "Paper says what the man at the printer wants it to. Who else will swear to it?" and back to the hub (it set `audit_misread`). Then re-ran the path and picked 1, which went on to the naming (`mole_identified`, `named_on_evidence`). The new reply is reached and the old generic "Somebody chose the query, Agent, and the window." did not appear.

## New findings

| # | Severity | Finding | Where |
|---|---|---|---|
| L-1 | note | The lamp turns on at the naming (the condition is `all_flags_submitted && mole_identified && !fate_decided`), not when the confrontation begins. After the naming it is already lit when the suite loads and stays lit until the fate, so a player who walks in is shown a lit lamp over a scene that has not started. This is what the log said (`spriteVariants` "on the confrontation condition"); only the player's route to the suite changes whether anyone sees the unlit-to-lit change. No action unless the user wants a switch-on at entry | game 2511, rooms read before entering |
| N-1 | note | `HaX` phone, after the last flag: "Whole chain's in: a terminal, a time, an account." and after flag 2 "let's see whose account it really is." The A1 fix removed every request to bring an account; HaX still tells the player the chain includes one. The Director and Nightshade no longer ask for it, so this is harmless, but the word is the same one the finding was about. Needs the user's eye alongside U1 addendum 4 (does root show an account name in-game; needs checking against SecGen by the user) | game 2511, HaX thread |
| N-2 | note | `take` on a text file inside the Director's safe moves it to the inventory without opening a viewer (`openedViewer: null`); only the notes-type code card opened a viewer on take. All three sealed files read fine from the inventory. Existing container behaviour, not new with this fix | game 2511 |
| N-3 | note | A reload after the fate shows the credits overlay (and, on that reload, the Resume / Restart / New Session overlay) over the lobby, so the post-fate lamp can only be read by dismissing both through the DOM. Same cause as the earlier N2 (debrief backstop on load). Not a regression | game 2511 |
| N-4 | note | The first reload in each game put the title screen on top; `pressKey` Enter through the page did nothing, `mg pressKey Enter` did. Harness only | both games |

Counts: 0 blockers, 0 majors, 0 minors, 5 notes (1 design-intent, 1 wording, 3 harness/engine behaviour).

## Not covered

- The wall recap without Okafor's file; the wrong-answer branch of the Director's question beyond option 4 (options 2 and 3 not tried); the off-duty agent's "Heard anything new?" line; Nightshade's new post-audit line ("Yes, that row's right...") and "Bring me the account" removal on the Director's and Nightshade's lines (not exercised in play, covered by route r26 in ink).
- Early accusation consequences after picking the longer choice (the choices were displayed and measured, not picked).
- Phone-width layout for item 4.
- Lit-lamp world screenshot (the confrontation chat cannot be closed).
- VM content: needs checking against SecGen by the user.

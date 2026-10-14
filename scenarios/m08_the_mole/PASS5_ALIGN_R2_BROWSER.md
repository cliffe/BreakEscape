# m08 pass 5, alignment round 2: browser check

Date 2026-10-14. Keyless server :3001 only, headless (load about 11), checked-in harness scripts only. No mission files edited, nothing committed. Every session started here was stopped (`session-stop.sh` for 2416, 2417, 2420).

Question answered: do the round-2 fixes (J1-J5, n1-n11, N1-N6) behave in real play. Not a solvability pass.

## Games and logs

| Game | Purpose | Session log (scratchpad `m08-align-r2-browser/`) |
|---|---|---|
| 2416 (1) | Clean route: keys from all three suspects after the audit beats, three lockers by key, ordinary holdall, N5, two misreads and the warning, HaX ladder, **mid-mission page reload** (after two misreads, before the naming), naming, confrontation, debrief, credits | `game1-session.jsonl` (1083 commands) |
| 2417 (2) | Cipher accused before the naming, tidy, Phantom accused (silent), three lockers by lockpick, tidied variants, naming, confrontation, debrief, credits | `game2-session.jsonl` |
| 2420 (3) | **debugKO on the Director (combat not played)**, HaX phone reading, holdall read after HaX's naming | `game3-session.jsonl` |

Screenshots in the same folder: `L1_cipher_lock.png`, `L2_holdall_pre.png`, `N5_reopen_hub.png`, `G2_locker47_lock.png`, `G2_locker23_pick.png`, `G2_stick_dusting.png`, `G3_phone_ko_hub.png`, `G3_hax_reading.png`, `G3_holdall_named.png`, `G1_credits.png`.

## Earned-secrets table

| Secret | Value used | Source | Earned? |
|---|---|---|---|
| Netherton card clone (games 1, 2) | cloner Save, Emulate | Netherton's "Step up beside him" then the RFID read | yes |
| Director's keycard (game 3) | picked up from the floor | KO drop (debugKO) | exercised, not earned (KO by debug shortcut) |
| Archives password | `TrustNoOne` | Break-room post-it | yes |
| Interrogation suite PIN | `5386` | Netherton, after the naming | yes |
| Locker access (game 2, 3) | `completeLockpick` | assisted, lock pick kit in the start kit | assisted |
| Locker access (game 1) | each suspect's key | suspect's own audit-beat conversation | yes |
| `safetynet_gitlist_server:flag_1..4` | `<flag:1>`..`<flag:4>` | Evidence Relay Terminal | **exercised, not earned**: the harness supplied them, the GitList launcher was never opened |

Everything downstream of the flag submissions is "exercised, not earned". Nothing about VM content was checked (needs checking against SecGen by the user).

## Results per item

### 1. Accusation before the naming: PASS (tidy exclusions not covered)

Game 2, Cipher accused on the ops floor (phone had 3 messages before):
- Globals after: `accused_cipher`, `nightshade_tipped_off`. `nightshade_tidied` absent while still on the ops floor.
- HaX text, shared neutral: "You've said it to someone's face. On this floor, that's said to everyone by midnight. If it's the right man, he knows we're looking." (message 4).
- Entering `main_lobby` set `nightshade_tidied`. So the tidy fires on the next room entry.
- Second accusation (Phantom, in `intel_analysis`): `accused_phantom` set, phone still 4 messages, no new text. Silent.
- Confrontation line for the tidy: "You put it on Cipher in front of the floor. Walls are thin here. So I tidied. Not well enough, it seems."
- Tidied state in the lockers (lockpicked): locker 0x47 holdall reads "Fresh scratches round the lock on the inside of the door. The top shelf is empty: a clean rectangle in the dust where a holdall stood until tonight." Stick via the dusting panel reads the neutral "PERSONAL_BACKUP.enc. One file on the stick."; "Use normally" gives "PERSONAL_BACKUP.enc – 0 bytes. Last written: tonight. Overwritten. Whatever was on it is gone." (N1 and N3 stay fixed).
- Not covered: that entering the Crypto Lab or break room does not trigger the tidy (the lobby is the only way into either from the ops floor, so it can't be walked to without passing a room that does), the sprint-beats-the-tidy case, a Nightshade accusation. The route driver (r8, r9) covers these in ink only.

### 2. The three lockers: PASS

Game 1 (clean, keys):
- Before the audit beat there is no locker option in any suspect's hub. After it: Cipher "Your locker in the break room. I want to see inside it." then "There's a project sheet in there you're not cleared for. Read it anyway. You'll only pick the lock otherwise."; Phantom's and Nightshade's same option ("Take it. 0x47, second from the end. I'd genuinely encourage it."). Inventory afterwards: "Cipher's Locker Key", then a "Key Ring" holding all three.
- 0x23 shows its lock overlay: locker image, "Staff Locker -- 0x23", "A staff locker labelled 0x23, plastered with conference stickers. One says DO NOT ROT13 ME.", key picker with all three keys (`L1_cipher_lock.png`). With no keys held it goes straight to the pick screen (`G2_locker23_pick.png`). 0x47 and 0x88 likewise show their overlay.
- Contents match the description. 0x23: "Token Pouch" (D-2 10:26 UTC, "Reason: (left blank)") and "Project Sheet" ("DO NOT DISCUSS. NOT ON THE ROSTER..."). 0x88: boarding stub ("Destination ZRH, seat 14C ... "Usual place. Bring the list."") and the folded sheet ("Across the bottom, underlined twice: DOORS, NOT FACES."). 0x47: stick, Deep State brief, holdall.
- Lockpicks (games 2 and 3, `completeLockpick`, assisted) opened 0x23, 0x47 and 0x88.
- Holdall before the naming (game 1): "A packed holdall on the top shelf. A change of clothes, a wash bag, a paperback with an uncracked spine. Nothing with a name on it. Half the agents on this floor keep a bag like this ready. You keep one yourself."
- After the naming, first read (game 3, named by HaX): "A passport in a name you have never heard, with his photograph, sewn into the lining. An e-ticket, one way, economy, to Helena, Montana ... He packed to leave nine days ago, and he is still at his desk."
- After the naming, read earlier (game 1): HaX text "Security searched his holdall once you named him. Passport in the lining, his photo, a name I've never heard. A one-way to Helena, Montana, for the morning after Portland." (`go_bag_lining_known` set). Followed by "Whole chain's in, and it has a name."
- Game 1 confrontation offered "You had a flight to Montana the morning after Portland. Why are you still here?"; game 2 (tidy, go-bag gone) did not offer it, and the credit read "GO-BAG: Gone from his locker the night you tipped him off". I did not check whether that choice should show in the tidied case.

### 3. Second-misread warning and hint ladder: PASS

Game 1, flags in, audit read:
- Misread 1 (10:38, "Cipher."): "Read the door against the minute, not the man." No warning.
- HaX at one misread: "He's said no once. Three misses and he reads it himself. Every row against the minute. Who stayed inside?"
- Misread 2 (10:38, "Phantom."): "Read the door against the minute, not the man." then "Once more like that and I read it myself, and the file will say that I had to." (the after-flag-4 variant; `audit_warned` set).
- HaX at two: "He's warned you. One more miss and he reads it himself. Every row against the minute. Who stayed inside?"
- Third misread and the takeover were not run in the browser (r3, r6 cover them in ink).

### 4. Director KO, HaX reading: PASS (debugKO used, combat not played)

Game 3, `debugKO director_netherton` (peaceful NPC converted, as the harness logs), then the card from the floor:
- HaX at the KO: "The Director is down. Tell me that wasn't you. His card's on the floor beside him. Or use the reception printer; its PIN is somewhere in the break room." then "With the Director down, I'm who you bring the name to. Get the door audit from the archives first, then read it to me."
- After flag 4: "Root. A terminal and a time, no face: crypto-lab-04, D-2 10:38, forty-seven minutes. The Director's down, and a login isn't a person. Get the door audit from the archives and read it to me." No name.
- Door audit read: "That's the door audit. With the Director on his floor, read it to me. Call me when you've got it straight." The phone hub then gained "I can name the leak." (absent before).
- Two-step reading: "Two questions, the ones he'd ask. When was the plan opened?" Wrong minute (10:15): "That's a door moving or the file closing. When did it open? Read it again and call me back." Right minute then "Who was behind the lab door at 10:38, and still inside?"; wrong person (Phantom): "Read the door against the minute, not the man. Who was still inside at 10:38? Call me back."; free retry; then Nightshade: "In at 10:15, out at 11:43. Cipher was gone by 10:32, and Phantom was on a plane." / "Nightshade. I trained with him." / "I'll put it in front of the Director when he can stand. You finish the chain."
- Globals: `named_by_hax`, `mole_identified`, `netherton_ko`; `named_on_evidence` not set. The `confront_the_mole` aim stayed locked in game 3 because I skipped the three interview tasks (my route, not a finding). The confrontation was not run in this game.

### 5. Debrief first beat and credits: PASS

- Games 1 and 2: the confrontation ends, then the narrator reads "Your phone buzzes once in the corridor. HaX: "He said it to you? 'Afterwards, not during.' I was taught that line, and I say it to every agent I run. Same classroom, 0x00. Don't ask me whose yet."" before "Netherton finds you, empty-handed." It is the first beat of the debrief, on screen while the debrief runs.
- Game 2 debrief: "You accused both of the innocent men to their faces. I read the transcripts." and "And he knew we were coming before we came. Whatever he had time to clear, we will never see now."
- Credits, game 2 (tip-off, read from `#bv-cr-label`): "CIPHER: Accused to his face, then cleared by the logs", "PHANTOM: Accused to his face, then cleared by a flight manifest", "NIGHTSHADE: Tipped off before he was named", "GO-BAG: Gone from his locker the night you tipped him off". Game 1 (no tip-off) has none of those: "CIPHER: Cleared on the evidence...", "PHANTOM: Cleared...", "GO-BAG: Packed nine days ago. Never used."

### 6. N5: PASS (one cosmetic note)

Game 1: "[I have a name forming.]" gives "Already? Say it. Not for the file – for me. Who is your instinct pointing at?" with Cipher, Phantom, Nightshade and "Not yet, sir." After End Conversation and a re-open, the choices are the hub (items 1-8), not the question. "Not yet, sir." exists and gives "Good. Keep it to yourself until it is more than a feeling." and returns to the hub.

### Reload and other checks

- Mid-mission reload (game 1, after flags, audit, two misreads, three locker keys): title screen, Enter (dispatched through `eval`; `pressKey` is blocked by the title minigame), Mission Brief note, then inventory (all three keys on the Key Ring), `audit_misread`, `audit_warned`, `found_go_bag`, open lockers and aims intact. The naming then ran normally.
- N6: with the flags in, the naming ends "The chain is in. He goes down to the suite now. The code is 5386."
- Game 1 verify-run: 8 rooms beyond the first, 3 objects unlocked, 4 flags (exercised, not earned), globals include `mission_complete`, `named_on_evidence`, `go_bag_lining_known`.

## New findings

| # | Severity | Finding | Where |
|---|---|---|---|
| R1 | minor | A re-opened hub shows the previous line above the hub choices. After "[I have a name forming.]" and End Conversation, the Director's "Already? Say it ... Who is your instinct pointing at?" stands over the eight hub options, so it reads as a question that has no answer options. The choices are right. Probably engine-wide (the first open after the cloner scene showed the old "Go." the same way). | game 1, `N5_reopen_hub.png` |
| R2 | minor | Notes-type items taken from a container (the holdall, the token pouch, the stubs) open the viewer once and do not appear in the inventory afterwards (the text_file items, brief and stick, do). The holdall can't be re-read after the naming; the passport text only reaches a player who first takes it after the naming, or HaX's "Security searched his holdall" text. Probably engine behaviour, and the HaX text covers it. | games 1, 2 |
| R3 | minor | The tidy line in the confrontation names only the first innocent accused ("You put it on Cipher in front of the floor") when both Cipher and Phantom were accused; Netherton's debrief says "both". Small. | game 2 |
| R4 | note | In game 2 (tidy, accusations) the confrontation did not offer the Montana-flight choice. Reads as intended (the bag is gone) but not confirmed against the design. | game 2 |

Counts: 0 blockers, 0 majors, 3 minors, 1 note.

## Not covered

Crypto Lab / break room tidy exclusion and the sprint-beats-the-tidy case (see item 1); the third misread takeover; suspect KO texts (neutral before the naming, after the naming); Nightshade accused early; the Director KO confrontation and debrief; VM contents; audio (keyless server).

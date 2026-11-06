# m09 Digital Archaeology: blind playtest (persona 1, "do your best")

Run type: blind run. It answers questions 1 and 2 (plumbing, plus what happens off the walkthrough). It does not answer question 3 and does not prove solvability past the four VM flag stations.

- Game id 3746, keyless server :3001, headless (load average 22).
- New game: `new-game.rb m09_digital_archaeology --imports=latest`, which gave a full m01-m08 save (m01 arrest, m02 no ransom paid, m04 full disclosure, m05 refused the Recruiter, m06 Irina recruited, m08 Nightshade arrested, and so on).
- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m09-blind/session.jsonl` (2,867 lines, 2,866 commands). Notes file in the same folder.
- Tester caveats. I am a model, so "blind" means I read nothing about m09. I did not open the field guides, the VM docs or anything under `scenarios/m09_digital_archaeology/`. I recognised a Vigenère cipher on sight, which a student may not.
- Only persona 1 was played. No reload test, no struggling-player run, no wrong-answer run for any puzzle.

## verify-run.rb (tail)

```
current room    "loading_dock"
unlocked rooms  11: loading_dock, front_desk, staff_passage, reading_room, restricted_stacks, restricted_cage, open_stacks, server_closet, sorensen_office, tape_room, salvage_cage
unlocked objs   4: plan_cabinet, hl_box, director_safe, enrolment_crate
flags submitted 4: catalogue_server_1, catalogue_server_2, tomb_beta_server_1, tomb_beta_server_2
tasks           26 in objectivesState, 26 completed
tasks_completed 26
score           97
VERDICT: progress recorded: 10 rooms beyond the first, 4 objects unlocked, 4 flags submitted.
```

Game clock: first task 22:45, last task 23:17. About 32 minutes, with the Darkside wait (about 35 s) and the dusting minigame included.

## Earned-secrets table

The "Obtained at" step numbers are my own rough order of play, not session-log line numbers. I did not cut the log into steps.

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Office door | lockpick (assisted) | Lock Pick Kit, HaX phone | step 3 | yes (dexterity assisted) |
| Noor's staff card | EM4100 clone | Lean-in choice on Noor, RFID cloner | step 8 | yes |
| Staff passage door | emulate card | same clone | step 10 | yes |
| Catalogue login | `catalogsvc` / `Catalog!Helena2016` | Login Slip, reading room | step 14 | read, but never typed anywhere (no VM) |
| `catalogue_server:flag_1` | `<flag:1>` | VM work not possible | n/a | **no, flag supplied** (prerequisite, the slip, held) |
| `catalogue_server:flag_2` | `<flag:2>` | VM work not possible | n/a | **no, flag supplied** (prerequisite held) |
| Sorensen's print | lifted from Rubber Stamp | dusting minigame | step 27 | yes (identified by guess, see F1) |
| Sorensen's MIFARE card | cloned, Darkside | lean-on-counter choice, RFID cloner | step 33 | yes |
| Plan cabinet | lifted print | stamp | step 37 | yes |
| H&L box file number | `HL2015-0477` | HaX phone: "A source code, H&L, and a file number" | step 62 | yes, but handed over by HaX, not found on paper |
| Floor safe PIN | `060216` | Lease start date `06/02/16` on lease abstract and rent ledger | step 70 | yes, a guess from clues (first try); HaX confirmed it later with "Lease date. She picked a number she'd never forget" |
| Tape Store card | item | floor safe | step 71 | yes |
| Salvage keypad | `LEWISANDCLARK` | Notepad line `MSJMQAEGDZNVI`, Shelf Marks (Bay 12 BONEYARD), Vigenère by hand | step 76 | yes, decoded by me; I knew the cipher type |
| `tomb_beta_server:flag_1` | `<flag:3>` | VM work not possible | n/a | **no, flag supplied** (binder login `nostromousr` / `TombBeta!Enrol16` held; no target address found in-game) |
| `tomb_beta_server:flag_2` | `<flag:4>` | VM work not possible | n/a | **no, flag supplied** |
| Ledger print copy cipher | not decoded | Print Copy in cage | n/a | **no, left optional and not solved** |

The four VM flags are the boundary of what this run proves. Everything gated behind them (the restricted stacks opening, the ledger call about WREN, the Tomb Beta reveal, the Publication call, the whole second half) was exercised, not earned. I would have been stuck on the VM at all four: the game gives my Kali box's address (172.16.0.3) and two logins, but no address for either target and no named service. The guide would presumably fill that gap, but I did not open it.

I asked for the flag stand-ins the way the brief said. `new-game.rb --help` has no flag-listing option. The only mechanism I found was the session's `<flag:N>` tokens and `{"cmd":"flags"}`, so I used them in order (1, 2 at the catalogue station; 3, 4 at the Tomb Beta station). Flag order matched the stations without any trial and error.

## Timeline: where I was unsure

| # | Where | Length | What I thought | What moved me |
| --- | --- | --- | --- | --- |
| T1 | Loading dock, after HaX's door/shutter choice | about 30 s | "Find the office door, the front desk." | Door list from `room`, HaX said "west door". |
| T2 | Front desk, Noor | about 1 min | Which pretext? Is the card on her belt a hint? | Third choice text, "close to the card on her belt", plus the cloner in my kit. |
| T3 | Dusting, compare step | about 1 min | Two near-identical whorls (Tran, Sorensen). | Coin flip. Guessed Sorensen because the stamp sits in her area. Right. |
| T4 | Hatch: Derek's file or the letters | about 1 min | Which burns? | Leaned on the locked task name `match_the_hand` (visible in the task list) and HaX's line "isn't Derek's handwriting". I chose the file. |
| T5 | Cage: what to do with the `salvage cage` note | about 3 min | "A cipher. Key somewhere." | Not stuck. Shelf Marks legend found by walking into the tape room, and it was obviously the key table. HaX's "hung the key beside the lock" line arrived afterwards. |
| T6 | Sorensen's office safe, six digits | about 1 min | Date? | Tried the lease start first, it opened. |
| T7 | After the Recruiter call: Her file or the Alpha tapes | about 1 min | Which one gets us "through the door"? | Briefing line "what gets us through the door is in Helena". I picked the tapes. |
| T8 | Tomb Beta VM | n/a (stand-ins) | "I would be stuck here." | No address in-game. |
| T9 | After flag 4, "who is WREN" | about 2 min | One of two names (Kowalczyk, Quintero), nothing to split them. | I stopped thinking about it. The mission never asked. |

I was never stuck for more than about three minutes. HaX's "Where do I stand?" option answered the "what next" question every time I used it.

## Findings the player makes versus guesses

Deduced from clues:
- The Architect's handwriting appears on the Lawson asset file, the training notebook margin, the Intake 2011 form and the destruction schedule (sloping hand, looped g, crossed 7, "A.").
- The Intake form's "Candidate 0x47" is Nightshade, and the assessor in 2011 was the teacher on STRAT-204.
- The salvage code: Vigenère, key BONEYARD from Shelf Marks, plaintext LEWISANDCLARK (the county on the certificate).
- The floor safe PIN was the lease start date (a good guess from two documents, not a deduction).
- Sorensen's lifted print opens the plan cabinet. The reader's own text says lifted prints fool readers.

Guessed:
- Tran versus Sorensen at the print comparison (F1).
- Derek's file versus the letters (a moral choice, but my reasoning leaned on a task title).
- Kowalczyk or Quintero as WREN. Nothing I found separates them.
- Alpha tapes or the Recruiter's file. The consequence only shows in the credits.

## What I learned about Cyber Security

- Insiders are recruited through personal pressure points (a father on dialysis, a mother in a nursing home, a lonely clerk), and the "notes" column of a ledger shows how. The defence is to notice who is being approached and to take the pressure point away.
- An EM4100 badge has no encryption, so cloning is a read and a replay. A MIFARE Classic with custom keys takes a Darkside key-recovery attack, and ordinary dictionary attacks fail. Badges are not secrets.
- A lifted fingerprint can open a fingerprint reader. A print is not a password you can change.
- A cipher is only as safe as its key, and keying every code to the bay's word means anyone who finds the legend can decode the lot. "Never write a code down", then a framed chart of the key words beside the keypad.
- Full disclosure and coordinated disclosure are not the same thing. Coordinated gives the vendor time to fix first. "Retain" on a flaw in four hundred sites means you cannot defend them from it, having chosen not to.
- Attribution is evidence work: two samples, one pen, then a second line of evidence (the property label returned "--").
- Pretexting works because people want to be helpful, and the follow-up decision (tell her the truth so she leaves safely, or use her for more) has a human cost that shows up in the credits.

## Did my earlier choices matter?

Yes, noticeably, in four places:
- The briefing recaps m01-m08 from the import (Derek, Ghost, Sterling, Voltage, "told the inquiry everything", the fund, Portland, Nightshade).
- The Recruiter rings back with an offer shaped by m05 (I had refused her before).
- HaX's phone lines referenced Irina's tip-off (m06) and "He bet on Derek's file. He was right."
- The Reading predicts them ("They told the inquiry everything", "They will save Lawson's file"), which is a good scare.

Within the mission, the Derek/letters choice has visible consequences: Tran can't be stopped and the optional `stop_the_tape_wipe` task disappears, the credits name Teresa Villanueva as unwarned. Sending the vendor notice and refusing the Recruiter both echo in the debrief and the credits.

## Was it fun

Yes. The first twenty minutes are the best thing in it: the front-desk pretext, cloning two cards, lifting the print and then reading a file in the Architect's own hand about how I would behave. The notebook scan, Intake form and Lawson file give one hand three times, and that lands. The choice to protect Noor (and watch her leave in the credits as "not allowed to ring her father") is the moral high point. The Publication call and the full versus coordinated disclosure exchange taught something without a lecture.

What was less fun:
- The fingerprint comparison reduces to a coin flip on screen (F1).
- Tran is a dead end with no fight. HaX says "It's a fight, or you leave him to it", and you can only leave.
- The mission ends by hub exit (F4), so the WREN thread is dropped without warning.
- The VM stations cannot be judged here.

Scores (1-5): fun 4, pacing 4, clarity of goals 4, openness of decisions 4, teaching 4 (the VM half untested).

## Were the goals clear

Yes. The task panel and HaX's hub answered "what now" every time. The briefing's "get inside, set up the drop terminal, submit flag" was explicit. Two soft spots: the first window onto Tran ("you'd need paper with his name on it") never resolves, and "WREN" appears with no instruction (see F3).

## Five best lines

1. "A log nobody reads is a diary." (HaX, on the incident book)
2. "She hung the key beside the lock. A cipher is only as safe as its key." (HaX)
3. "Seven years, and nobody turned it off." (HaX, on Tesseract's account)
4. "He wrote that I'd cover for you. Tonight you covered for me. ...That's mine. You don't get to use it on me." (HaX)
5. "You sent it without asking me. I would have said yes. I would have taken a week to say it." (Netherton)

## Five worst lines or moments

1. Sorensen opens with "The lease-holder's auditor. Of course." after I told Noor I was shredder service (F5).
2. "Peg called somebody? Okay. It's in the cage." The cage is where the shredder is and the whole point of the night, and Noor sends a stranger toward it without a flicker.
3. "Tomb Alpha: Heard him teach it." in the credits, for two lines of tape (F6).
4. "Her card's on a reel at her hip. You've done this before." This hands over the RFID step before the player has had a chance to see it.
5. The fingerprint reference cards, which at screen size read as the same print.

## Findings

| # | Severity | Finding | Repro |
| --- | --- | --- | --- |
| F1 | minor (major if wrong guesses are punished; I did not test one) | In the Rubber Stamp dusting compare step, the Tran and Sorensen reference cards are both whorls with near-identical core and ridge counts at screen size. The only discriminator I could see was ridge density, and the lift is stretched wider than the cards. I picked at random. | Dust the stamp in restricted stacks, classify as whorl, compare. Screenshot `print2.png` and `cmp.png` in the scratch folder. |
| F2 | minor | `match_the_hand` asks "the hand on his file" and the toast says "Nightshade's file". The Lawson asset file text has no digits and states no distinguishing features (looped g, crossed 7), while the Intake form does. "Same hand" rests on the description "neat sloping hand" plus the "A." signature. The Intake form is the strong evidence but is not the one "his file" points at. | Compare Notepad pages for the Lawson file and Candidate Assessment. |
| F3 | minor | WREN is a thread the mission raises (HaX, the H&L record, the credits "one of two names") but never asks the player to decide. Nothing separates Kowalczyk from Quintero. A player who works hard at it will find nothing. | After flag 2, ask HaX "TF Null"; open the H&L box with `HL2015-0477`. |
| F4 | minor | The closing debrief hub has "Montana, sir" as its last option and it ends the scene. A player who takes "Montana" before "WREN" never hears Netherton on WREN; the hub does not warn that this option closes it. The WREN line is in the Montana closer, so nothing is lost for the plot, only the chance to ask. | At the hangar debrief, pick "The archive", "The Recruiter", "The notice", then "Montana, sir" before "WREN". |
| F5 | minor | Pretext carry-over. At the front desk I chose "Shredder service. Margaret Sorensen called about the feed." Sorensen then greets me as "the lease-holder's auditor", and the first reply option is "That's right. They want tonight's run checked against the schedule." This matches Noor's audit branch, not the one I chose. | Noor choice 1, later the hatch. |
| F6 | minor | The Alpha reel deck opens its recording late (one to three seconds after `interact`). I walked on and returned, and the tape played mid-run ("Tape two"), so I may have missed "tape one". The credit "Tomb Alpha: Heard him teach it" rests on two lines. The first interaction also left a conversation open while I tried to walk (`minigame-active` on the next move). | Interact `alpha_tape_deck`, then move at once. Compare lines on the first and later interactions. |
| F7 | nit | A "Failed to enter correct password." toast appeared after I pressed Cancel on the Harwick & Lowe box (attempt counter said 0/3 when open). Cancel may count as a failed attempt. | Open `hl_box`, press Cancel, read toasts. |
| F8 | nit | The tutorial prompt ("Welcome to Hacktivity Games!") pops over the game after the opening phone chat, at mission 9, for a player who has played eight missions. Declined at once. | New game, read the briefing, finish the HaX phone chat. |
| F9 | nit | Naming drift: "Series ALPHA" on the annotation sheets, "Alpha tapes" from HaX, "Tomb Alpha" in the credits. | n/a |
| F10 | nit | Credits name "Teresa Villanueva", a person the player only meets if they pick the letters. A player who saves Derek's file sees the name only in the credits. This reads as intended (consequence, not a miss), but a reader could take it as an unexplained name. | Pick Derek's file at the hatch, watch the credits. |
| F11 | harness, not game | `enter` returned `door-locked` immediately after `completeLockpick` and again after an RFID emulate, because the minigame had not finished closing. A second `enter` worked. | Repeat `completeLockpick` then `enter` at once. |
| F12 | harness, not game | `mg getState` text for the phone chat lags and truncates the last bubble; the `.message-bubble` elements are right. | Read a long chat with `mg getState`. |
| F13 | observation | Where the VM would block: no address for either target in the mission text or any object I read. The only address is my Kali box. The binder gives a web login for "the enrolment site", and the slip gives a service login, but neither says where to use it. I did not open the field guides, so this may be answered there. | n/a |

Counts: 0 blockers, 0 majors, 6 minors (F1-F6), 4 nits (F7-F10), plus 2 harness notes (F11-F12) and 1 observation (F13).

## What I did not test

Reload mid-mission; the struggling-player persona (Noor used, Tran fought, letters picked, Recruiter's name taken); wrong answers at the safe, the keypad or the print comparison; the order variants in SOFTLOCK_PATTERNS.md; the ledger print-copy cipher; the field guides; the tape-room Series R trolley lists beyond reading the run sheet; TTS (keyless server, no audio).
